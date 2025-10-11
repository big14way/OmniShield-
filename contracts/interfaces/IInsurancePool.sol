// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IInsurancePool {
    struct Policy {
        address holder;
        uint256 coverageAmount;
        uint256 premium;
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed holder,
        uint256 coverageAmount,
        uint256 premium
    );

    event PolicyClaimed(uint256 indexed policyId, uint256 claimAmount);

    event PremiumPaid(uint256 indexed policyId, uint256 amount);

    function createPolicy(
        uint256 coverageAmount,
        uint256 duration
    ) external payable returns (uint256 policyId);

    function submitClaim(uint256 policyId, uint256 claimAmount) external;

    function getPolicy(uint256 policyId) external view returns (Policy memory);

    function calculatePremium(
        uint256 coverageAmount,
        uint256 duration
    ) external view returns (uint256);
}
