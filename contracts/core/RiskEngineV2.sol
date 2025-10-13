// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "../libraries/StatisticalMath.sol";
import "../libraries/PercentageMath.sol";
import "../interfaces/IPriceOracle.sol";

contract RiskEngineV2 is AccessControl, ReentrancyGuard, VRFConsumerBaseV2 {
    using StatisticalMath for uint256[];
    using PercentageMath for uint256;

    bytes32 public constant RISK_MANAGER_ROLE = keccak256("RISK_MANAGER_ROLE");

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

    IPriceOracle public priceOracle;
    VRFCoordinatorV2Interface public vrfCoordinator;

    uint64 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;
    uint32 public vrfCallbackGasLimit = 500000;
    uint16 public vrfRequestConfirmations = 3;
    uint32 public vrfNumWords = 10;

    mapping(CoverageType => RiskParams) public coverageRiskParams;
    mapping(address => ProtocolRiskData) public protocolRisks;
    mapping(address => uint256) public poolTVL;
    mapping(address => mapping(address => uint256)) public protocolExposure;
    mapping(uint256 => MonteCarloResult) public monteCarloResults;

    uint256 public constant MAX_UTILIZATION = 8000;
    uint256 public constant MAX_PROTOCOL_EXPOSURE = 3000;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant BASIS_POINTS = 10000;

    event PremiumCalculated(address indexed asset, uint256 premium, uint256 coverageAmount);
    event ProtocolRiskAssessed(address indexed protocol, uint256 riskScore);
    event MonteCarloCompleted(uint256 indexed requestId, uint256 var95, uint256 cvar95);
    event RandomnessReceived(uint256 indexed requestId, uint256[] randomWords);

    constructor(
        address _priceOracle,
        address _vrfCoordinator,
        uint64 _subscriptionId,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        priceOracle = IPriceOracle(_priceOracle);
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        vrfSubscriptionId = _subscriptionId;
        vrfKeyHash = _keyHash;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RISK_MANAGER_ROLE, msg.sender);

        _initializeRiskParams();
    }

    function calculatePremium(
        address asset,
        uint256 coverageAmount,
        uint256 period,
        CoverageType coverageType
    ) external view returns (uint256 premium) {
        RiskParams memory params = coverageRiskParams[coverageType];

        uint256 baseAnnualRate = params.baseRate;
        uint256 periodFactor = (period * PRECISION) / 365 days;
        uint256 basePremium = coverageAmount.percentMul(baseAnnualRate);
        basePremium = (basePremium * periodFactor) / PRECISION;

        uint256 volatility = _getAssetVolatility(asset);
        uint256 volMultiplier = _calculateVolatilityMultiplier(volatility);
        basePremium = basePremium.percentMul(volMultiplier);

        uint256 liquidityFactor = _calculateLiquidityFactor(asset);
        basePremium = basePremium.percentMul(liquidityFactor);

        uint256 timeFactor = _calculateTimeDecayFactor(period);
        premium = basePremium.percentMul(timeFactor);

        return premium;
    }

    function assessProtocolRisk(address protocol) external returns (uint256 riskScore) {
        ProtocolRiskData storage data = protocolRisks[protocol];

        uint256 tvlScore = _calculateTVLScore(data.tvl);
        uint256 auditPoints = data.auditScore;
        uint256 agePoints = _calculateAgeScore(data.deploymentAge);
        uint256 exploitPenalty = data.exploitHistory;

        riskScore = tvlScore + auditPoints + agePoints;
        riskScore = riskScore > exploitPenalty ? riskScore - exploitPenalty : 0;

        if (riskScore > 1000) riskScore = 1000;

        data.lastUpdated = block.timestamp;
        emit ProtocolRiskAssessed(protocol, riskScore);

        return riskScore;
    }

    function calculateMaxCoverage(address pool) external view returns (uint256 maxCoverage) {
        uint256 tvl = poolTVL[pool];
        uint256 baseMax = tvl.percentMul(MAX_UTILIZATION);

        return baseMax;
    }

    function requestMonteCarloSimulation(
        uint256 iterations,
        RiskParams memory params
    ) external onlyRole(RISK_MANAGER_ROLE) returns (uint256 requestId) {
        requestId = vrfCoordinator.requestRandomWords(
            vrfKeyHash,
            vrfSubscriptionId,
            vrfRequestConfirmations,
            vrfCallbackGasLimit,
            vrfNumWords
        );

        return requestId;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        emit RandomnessReceived(requestId, randomWords);

        uint256[] memory losses = new uint256[](randomWords.length);
        for (uint256 i = 0; i < randomWords.length; i++) {
            losses[i] = (randomWords[i] % (1000 * PRECISION));
        }

        _quickSort(losses, 0, losses.length - 1);

        MonteCarloResult storage result = monteCarloResults[requestId];
        result.var95 = losses.calculateVaR(9500);
        result.cvar95 = losses.calculateCVaR(9500);
        result.meanLoss = losses.calculateMean();
        result.maxLoss = losses[losses.length - 1];

        emit MonteCarloCompleted(requestId, result.var95, result.cvar95);
    }

    function setProtocolRiskData(
        address protocol,
        uint256 tvl,
        uint256 auditScore,
        uint256 deploymentAge,
        uint256 exploitHistory
    ) external onlyRole(RISK_MANAGER_ROLE) {
        protocolRisks[protocol] = ProtocolRiskData({
            tvl: tvl,
            auditScore: auditScore,
            deploymentAge: deploymentAge,
            exploitHistory: exploitHistory,
            lastUpdated: block.timestamp
        });
    }

    function setPoolTVL(address pool, uint256 tvl) external onlyRole(RISK_MANAGER_ROLE) {
        poolTVL[pool] = tvl;
    }

    function _initializeRiskParams() private {
        coverageRiskParams[CoverageType.SmartContractHack] = RiskParams(200, 15000, 10000, 0);
        coverageRiskParams[CoverageType.PriceCrash] = RiskParams(150, 20000, 12000, 0);
        coverageRiskParams[CoverageType.Depeg] = RiskParams(100, 10000, 8000, 0);
        coverageRiskParams[CoverageType.ProtocolFailure] = RiskParams(250, 18000, 15000, 0);
        coverageRiskParams[CoverageType.BridgeExploit] = RiskParams(300, 25000, 15000, 0);
    }

    function _getAssetVolatility(address asset) private view returns (uint256) {
        bytes32 feedId = priceOracle.getPriceFeedForAsset(asset);
        return priceOracle.calculateVolatility(feedId, 24 hours);
    }

    function _calculateVolatilityMultiplier(uint256 volatility) private pure returns (uint256) {
        if (volatility < 2000) return 10000;
        if (volatility < 5000) return 15000;
        if (volatility < 10000) return 20000;
        return 30000;
    }

    function _calculateLiquidityFactor(address) private pure returns (uint256) {
        return 10000;
    }

    function _calculateTimeDecayFactor(uint256 period) private pure returns (uint256) {
        if (period < 30 days) return 12000;
        if (period < 90 days) return 10000;
        if (period < 180 days) return 9000;
        return 8000;
    }

    function _calculateTVLScore(uint256 tvl) private pure returns (uint256) {
        if (tvl > 100_000_000 * 1e18) return 200;
        if (tvl > 10_000_000 * 1e18) return 150;
        if (tvl > 1_000_000 * 1e18) return 100;
        return 50;
    }

    function _calculateAgeScore(uint256 age) private pure returns (uint256) {
        if (age > 365 days) return 50;
        if (age > 180 days) return 30;
        if (age > 90 days) return 15;
        return 5;
    }

    function _quickSort(uint256[] memory arr, uint256 left, uint256 right) private pure {
        if (left >= right) return;
        uint256 pivotIndex = (left + right) / 2;
        uint256 pivot = arr[pivotIndex];
        uint256 i = left;
        uint256 j = right;
        while (i <= j) {
            while (arr[i] < pivot) i++;
            while (pivot < arr[j]) j--;
            if (i <= j) {
                (arr[i], arr[j]) = (arr[j], arr[i]);
                i++;
                if (j > 0) j--;
            }
        }
        if (left < j) _quickSort(arr, left, j);
        if (i < right) _quickSort(arr, i, right);
    }
}
