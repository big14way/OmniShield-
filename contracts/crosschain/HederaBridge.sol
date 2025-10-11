// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HederaBridge is Ownable, ReentrancyGuard {
    enum BridgeStatus {
        Pending,
        Completed,
        Failed
    }
    
    struct BridgeRequest {
        address sender;
        address recipient;
        uint256 amount;
        bytes32 hederaTxHash;
        BridgeStatus status;
        uint256 timestamp;
    }
    
    uint256 private _requestCounter;
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(bytes32 => bool) public processedHederaTx;
    
    uint256 public minBridgeAmount;
    uint256 public maxBridgeAmount;
    
    event BridgeInitiated(
        uint256 indexed requestId,
        address indexed sender,
        address indexed recipient,
        uint256 amount
    );
    
    event BridgeCompleted(
        uint256 indexed requestId,
        bytes32 indexed hederaTxHash
    );
    
    event BridgeFailed(uint256 indexed requestId, string reason);
    
    constructor() Ownable(msg.sender) {
        minBridgeAmount = 0.01 ether;
        maxBridgeAmount = 100 ether;
    }
    
    function initiateBridge(
        address recipient,
        uint256 amount
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= amount, "Insufficient value");
        require(amount >= minBridgeAmount, "Amount too low");
        require(amount <= maxBridgeAmount, "Amount too high");
        require(recipient != address(0), "Invalid recipient");
        
        _requestCounter++;
        uint256 requestId = _requestCounter;
        
        bridgeRequests[requestId] = BridgeRequest({
            sender: msg.sender,
            recipient: recipient,
            amount: amount,
            hederaTxHash: bytes32(0),
            status: BridgeStatus.Pending,
            timestamp: block.timestamp
        });
        
        emit BridgeInitiated(requestId, msg.sender, recipient, amount);
        
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        }
        
        return requestId;
    }
    
    function completeBridge(
        uint256 requestId,
        bytes32 hederaTxHash
    ) external onlyOwner {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.status == BridgeStatus.Pending, "Request not pending");
        require(!processedHederaTx[hederaTxHash], "Tx already processed");
        
        request.hederaTxHash = hederaTxHash;
        request.status = BridgeStatus.Completed;
        processedHederaTx[hederaTxHash] = true;
        
        emit BridgeCompleted(requestId, hederaTxHash);
    }
    
    function failBridge(uint256 requestId, string calldata reason) external onlyOwner {
        BridgeRequest storage request = bridgeRequests[requestId];
        require(request.status == BridgeStatus.Pending, "Request not pending");
        
        request.status = BridgeStatus.Failed;
        
        payable(request.sender).transfer(request.amount);
        
        emit BridgeFailed(requestId, reason);
    }
    
    function setBridgeLimits(
        uint256 _minAmount,
        uint256 _maxAmount
    ) external onlyOwner {
        require(_minAmount < _maxAmount, "Invalid limits");
        minBridgeAmount = _minAmount;
        maxBridgeAmount = _maxAmount;
    }
    
    receive() external payable {}
}
