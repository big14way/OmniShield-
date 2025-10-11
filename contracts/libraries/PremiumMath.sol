// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library PremiumMath {
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant BASE_PREMIUM_RATE = 100;
    uint256 private constant RISK_MULTIPLIER = 10;
    
    function calculatePremium(
        uint256 coverageAmount,
        uint256 duration,
        uint256 riskScore
    ) internal pure returns (uint256) {
        require(coverageAmount > 0, "Coverage must be positive");
        require(duration > 0, "Duration must be positive");
        
        uint256 basePremium = (coverageAmount * BASE_PREMIUM_RATE) / BASIS_POINTS;
        
        uint256 durationFactor = duration / 1 days;
        uint256 durationAdjustment = (basePremium * durationFactor) / 365;
        
        uint256 riskAdjustment = (basePremium * riskScore * RISK_MULTIPLIER) / BASIS_POINTS / 1000;
        
        return basePremium + durationAdjustment + riskAdjustment;
    }
    
    function calculateRefund(
        uint256 premium,
        uint256 policyDuration,
        uint256 elapsedTime
    ) internal pure returns (uint256) {
        if (elapsedTime >= policyDuration) {
            return 0;
        }
        
        uint256 remainingTime = policyDuration - elapsedTime;
        return (premium * remainingTime) / policyDuration;
    }
    
    function applyDiscount(
        uint256 premium,
        uint256 discountBasisPoints
    ) internal pure returns (uint256) {
        require(discountBasisPoints <= BASIS_POINTS, "Invalid discount");
        
        uint256 discount = (premium * discountBasisPoints) / BASIS_POINTS;
        return premium - discount;
    }
}
