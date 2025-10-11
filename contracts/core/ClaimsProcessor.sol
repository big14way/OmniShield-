// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IInsurancePool.sol";

contract ClaimsProcessor is Ownable, ReentrancyGuard {
    enum ClaimStatus {
        Pending,
        Approved,
        Rejected,
        Paid
    }
    
    struct Claim {
        uint256 policyId;
        address claimant;
        uint256 amount;
        ClaimStatus status;
        uint256 submittedAt;
        string evidence;
    }
    
    uint256 private _claimCounter;
    mapping(uint256 => Claim) public claims;
    mapping(uint256 => uint256[]) public policyClaims;
    
    IInsurancePool public insurancePool;
    
    event ClaimSubmitted(
        uint256 indexed claimId,
        uint256 indexed policyId,
        address indexed claimant,
        uint256 amount
    );
    
    event ClaimApproved(uint256 indexed claimId);
    event ClaimRejected(uint256 indexed claimId);
    event ClaimPaid(uint256 indexed claimId, uint256 amount);
    
    constructor(address _insurancePool) Ownable(msg.sender) {
        insurancePool = IInsurancePool(_insurancePool);
    }
    
    function submitClaim(
        uint256 policyId,
        uint256 amount,
        string calldata evidence
    ) external returns (uint256) {
        IInsurancePool.Policy memory policy = insurancePool.getPolicy(policyId);
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.active, "Policy not active");
        require(amount <= policy.coverageAmount, "Amount exceeds coverage");
        
        _claimCounter++;
        uint256 claimId = _claimCounter;
        
        claims[claimId] = Claim({
            policyId: policyId,
            claimant: msg.sender,
            amount: amount,
            status: ClaimStatus.Pending,
            submittedAt: block.timestamp,
            evidence: evidence
        });
        
        policyClaims[policyId].push(claimId);
        
        emit ClaimSubmitted(claimId, policyId, msg.sender, amount);
        
        return claimId;
    }
    
    function approveClaim(uint256 claimId) external onlyOwner {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        
        claim.status = ClaimStatus.Approved;
        emit ClaimApproved(claimId);
    }
    
    function rejectClaim(uint256 claimId) external onlyOwner {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Pending, "Claim not pending");
        
        claim.status = ClaimStatus.Rejected;
        emit ClaimRejected(claimId);
    }
    
    function payClaim(uint256 claimId) external nonReentrant onlyOwner {
        Claim storage claim = claims[claimId];
        require(claim.status == ClaimStatus.Approved, "Claim not approved");
        
        claim.status = ClaimStatus.Paid;
        
        payable(claim.claimant).transfer(claim.amount);
        
        emit ClaimPaid(claimId, claim.amount);
    }
    
    function getClaim(uint256 claimId) external view returns (Claim memory) {
        return claims[claimId];
    }
    
    receive() external payable {}
}
