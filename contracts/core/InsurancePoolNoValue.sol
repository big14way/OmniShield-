// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IInsurancePool.sol";
import "../interfaces/IRiskEngine.sol";
import "../libraries/PremiumMath.sol";

/// @title InsurancePoolNoValue
/// @notice Insurance pool for TESTING that doesn't require msg.value
/// @dev This is for testing Hedera where msg.value doesn't work via JSON-RPC
contract InsurancePoolNoValue is IInsurancePool, Ownable, ReentrancyGuard, Pausable {
    uint256 private _policyCounter;
    uint256 public totalPoolBalance;

    mapping(uint256 => Policy) private _policies;
    mapping(address => uint256[]) private _userPolicies;

    IRiskEngine public riskEngine;

    event PremiumCalculated(uint256 premium);

    constructor(address _riskEngine) Ownable(msg.sender) {
        riskEngine = IRiskEngine(_riskEngine);
    }

    function createPolicy(
        uint256 coverageAmount,
        uint256 duration
    ) external payable override nonReentrant whenNotPaused returns (uint256) {
        require(coverageAmount > 0, "Coverage amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(
            riskEngine.isEligibleForCoverage(msg.sender, coverageAmount),
            "Not eligible for coverage"
        );

        uint256 premium = calculatePremium(coverageAmount, duration);
        emit PremiumCalculated(premium);

        // REMOVED msg.value check for Hedera testing
        // Hedera doesn't support msg.value via JSON-RPC properly

        _policyCounter++;
        uint256 policyId = _policyCounter;

        _policies[policyId] = Policy({
            holder: msg.sender,
            coverageAmount: coverageAmount,
            premium: premium,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true
        });

        _userPolicies[msg.sender].push(policyId);
        totalPoolBalance += premium;

        emit PolicyCreated(policyId, msg.sender, coverageAmount, premium);

        return policyId;
    }

    function submitClaim(
        uint256 policyId,
        uint256 claimAmount
    ) external override nonReentrant whenNotPaused {
        Policy storage policy = _policies[policyId];
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.active, "Policy not active");
        require(block.timestamp <= policy.endTime, "Policy expired");
        require(claimAmount <= policy.coverageAmount, "Claim exceeds coverage");

        policy.active = false;

        emit PolicyClaimed(policyId, claimAmount);
    }

    function getPolicy(uint256 policyId) external view override returns (Policy memory) {
        return _policies[policyId];
    }

    function calculatePremium(
        uint256 coverageAmount,
        uint256 duration
    ) public view override returns (uint256) {
        uint256 riskScore = riskEngine.calculateRisk(msg.sender, coverageAmount);
        return PremiumMath.calculatePremium(coverageAmount, duration, riskScore);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Accept HBAR deposits
    receive() external payable {}
}
