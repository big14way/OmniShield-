// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IRiskEngine.sol";
import "../libraries/RiskCalculations.sol";

contract RiskEngine is IRiskEngine, Ownable {
    mapping(address => RiskProfile) private _riskProfiles;
    
    uint256 public constant MAX_RISK_SCORE = 10000;
    uint256 public constant MIN_RISK_SCORE = 100;
    
    constructor() Ownable(msg.sender) {}
    
    function calculateRisk(
        address user,
        uint256 coverageAmount
    ) external view override returns (uint256) {
        RiskProfile memory profile = _riskProfiles[user];
        
        if (!profile.isActive) {
            return RiskCalculations.calculateBaseRisk(coverageAmount);
        }
        
        return RiskCalculations.adjustRiskScore(
            profile.riskScore,
            coverageAmount,
            block.timestamp - profile.lastUpdated
        );
    }
    
    function updateRiskProfile(address user) external override {
        RiskProfile storage profile = _riskProfiles[user];
        
        uint256 newScore = RiskCalculations.calculateBaseRisk(0);
        
        profile.riskScore = newScore;
        profile.lastUpdated = block.timestamp;
        profile.isActive = true;
        
        emit RiskScoreUpdated(user, newScore);
    }
    
    function getRiskProfile(
        address user
    ) external view override returns (RiskProfile memory) {
        return _riskProfiles[user];
    }
    
    function isEligibleForCoverage(
        address user,
        uint256 coverageAmount
    ) external view override returns (bool) {
        RiskProfile memory profile = _riskProfiles[user];
        
        if (!profile.isActive) {
            return true;
        }
        
        uint256 riskScore = RiskCalculations.adjustRiskScore(
            profile.riskScore,
            coverageAmount,
            block.timestamp - profile.lastUpdated
        );
        
        return riskScore < MAX_RISK_SCORE;
    }
    
    function setRiskScore(address user, uint256 score) external onlyOwner {
        require(score >= MIN_RISK_SCORE && score <= MAX_RISK_SCORE, "Invalid risk score");
        
        _riskProfiles[user] = RiskProfile({
            riskScore: score,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        emit RiskScoreUpdated(user, score);
    }
}
