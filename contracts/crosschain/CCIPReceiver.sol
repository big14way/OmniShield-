// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CCIPReceiver is Ownable {
    struct Message {
        uint64 sourceChainSelector;
        address sender;
        bytes data;
        uint256 receivedAt;
    }

    mapping(bytes32 => Message) public messages;
    mapping(uint64 => bool) public allowedChains;

    event MessageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        bytes data
    );

    constructor() Ownable(msg.sender) {}

    function _ccipReceive(
        uint64 sourceChainSelector,
        address sender,
        bytes memory data
    ) internal returns (bytes32) {
        require(allowedChains[sourceChainSelector], "Chain not allowed");

        bytes32 messageId = keccak256(
            abi.encodePacked(sourceChainSelector, sender, data, block.timestamp)
        );

        messages[messageId] = Message({
            sourceChainSelector: sourceChainSelector,
            sender: sender,
            data: data,
            receivedAt: block.timestamp
        });

        emit MessageReceived(messageId, sourceChainSelector, sender, data);

        return messageId;
    }

    function setAllowedChain(uint64 chainSelector, bool allowed) external onlyOwner {
        allowedChains[chainSelector] = allowed;
    }

    function getMessage(bytes32 messageId) external view returns (Message memory) {
        return messages[messageId];
    }
}
