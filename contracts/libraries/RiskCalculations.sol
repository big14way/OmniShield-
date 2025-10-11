// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

library RiskCalculations {
    uint256 private constant BASE_RISK = 1000;
    uint256 private constant COVERAGE_FACTOR = 100;
    uint256 private constant TIME_DECAY_FACTOR = 365 days;
    
    function calculateBaseRisk(uint256 coverageAmount) internal pure returns (uint256) {
        if (coverageAmount == 0) {
            return BASE_RISK;
        }
        
        uint256 coverageRisk = (coverageAmount / 1 ether) * COVERAGE_FACTOR;
        return BASE_RISK + coverageRisk;
    }
    
    function adjustRiskScore(
        uint256 currentScore,
        uint256 coverageAmount,
        uint256 timeSinceUpdate
    ) internal pure returns (uint256) {
        uint256 baseRisk = calculateBaseRisk(coverageAmount);
        
        uint256 timeDecay = 0;
        if (timeSinceUpdate > 0 && timeSinceUpdate < TIME_DECAY_FACTOR) {
            timeDecay = (currentScore * timeSinceUpdate) / TIME_DECAY_FACTOR / 10;
        }
        
        uint256 adjustedScore = currentScore + baseRisk + timeDecay;
        
        return adjustedScore > 10000 ? 10000 : adjustedScore;
    }
    
    function calculateVolatilityRisk(
        int256 priceChange,
        uint256 volatilityThreshold
    ) internal pure returns (uint256) {
        uint256 absPriceChange = priceChange >= 0 
            ? uint256(priceChange) 
            : uint256(-priceChange);
        
        if (absPriceChange > volatilityThreshold) {
            return (absPriceChange * 100) / volatilityThreshold;
        }
        
        return 0;
    }
}
