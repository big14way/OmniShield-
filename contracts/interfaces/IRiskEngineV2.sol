// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IRiskEngineV2 {
    enum CoverageType {
        SmartContractHack,
        PriceCrash,
        Depeg,
        ProtocolFailure,
        BridgeExploit
    }

    struct RiskParams {
        uint256 baseRate;
        uint256 volatilityMultiplier;
        uint256 liquidityFactor;
        uint256 utilizationRate;
    }

    struct ProtocolRiskData {
        uint256 tvl;
        uint256 auditScore;
        uint256 deploymentAge;
        uint256 exploitHistory;
        uint256 lastUpdated;
    }

    struct MonteCarloResult {
        uint256 var95;
        uint256 cvar95;
        uint256 meanLoss;
        uint256 maxLoss;
    }

    event PremiumCalculated(address indexed asset, uint256 premium, uint256 coverageAmount);
    event ProtocolRiskAssessed(address indexed protocol, uint256 riskScore);
    event MonteCarloCompleted(uint256 indexed requestId, uint256 var95, uint256 cvar95);
    event RandomnessReceived(uint256 indexed requestId, uint256[] randomWords);

    function calculatePremium(
        address asset,
        uint256 coverageAmount,
        uint256 period,
        CoverageType coverageType
    ) external view returns (uint256 premium);

    function assessProtocolRisk(address protocol) external returns (uint256 riskScore);

    function calculateMaxCoverage(address pool) external view returns (uint256 maxCoverage);

    function requestMonteCarloSimulation(
        uint256 iterations,
        RiskParams memory params
    ) external returns (uint256 requestId);

    function setProtocolRiskData(
        address protocol,
        uint256 tvl,
        uint256 auditScore,
        uint256 deploymentAge,
        uint256 exploitHistory
    ) external;

    function setPoolTVL(address pool, uint256 tvl) external;
}
