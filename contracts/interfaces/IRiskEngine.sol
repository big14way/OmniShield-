// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IRiskEngine {
    struct RiskProfile {
        uint256 riskScore;
        uint256 lastUpdated;
        bool isActive;
    }

    event RiskScoreUpdated(address indexed user, uint256 newScore);

    function calculateRisk(
        address user,
        uint256 coverageAmount
    ) external view returns (uint256 riskScore);

    function updateRiskProfile(address user) external;

    function getRiskProfile(
        address user
    ) external view returns (RiskProfile memory);

    function isEligibleForCoverage(
        address user,
        uint256 coverageAmount
    ) external view returns (bool);
}
