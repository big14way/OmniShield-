// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IPythPriceConsumerV2
/// @notice Interface for enhanced Pyth Network oracle integration
interface IPythPriceConsumerV2 {
    struct PricePoint {
        int64 price;
        uint64 conf;
        uint256 timestamp;
    }

    struct PriceFeedConfig {
        bytes32 pythId;
        address fallbackOracle;
        uint256 maxStaleness;
        uint256 volatilityThreshold;
        bool enabled;
    }

    struct CircuitBreaker {
        bool active;
        uint256 activatedAt;
        uint256 cooldownPeriod;
        string reason;
    }

    event PriceUpdated(bytes32 indexed priceFeedId, int64 price, uint64 conf, uint256 timestamp);

    event BatchPriceUpdate(bytes32[] priceFeedIds, uint256 updateCount, uint256 gasUsed);

    event PriceFeedConfigured(
        bytes32 indexed priceFeedId,
        address indexed asset,
        uint256 maxStaleness,
        uint256 volatilityThreshold
    );

    event CircuitBreakerTriggered(
        bytes32 indexed priceFeedId,
        string reason,
        uint256 cooldownUntil
    );

    event CircuitBreakerReset(bytes32 indexed priceFeedId);

    event HighVolatilityDetected(
        bytes32 indexed priceFeedId,
        uint256 volatility,
        uint256 threshold
    );

    event PriceDeviationDetected(
        bytes32 indexed priceFeedId,
        int64 currentPrice,
        int64 twapPrice,
        uint256 deviationPercent
    );

    function updatePriceFeeds(bytes[] calldata priceUpdateData) external payable;

    function getLatestPrice(
        bytes32 priceFeedId
    ) external view returns (int256 price, uint256 timestamp);

    function calculateVolatility(
        bytes32 priceFeedId,
        uint256 period
    ) external view returns (uint256 volatility);

    function detectPriceDeviation(
        bytes32 priceFeedId,
        uint256 threshold
    ) external returns (bool exceeded);

    function checkVolatilityCircuitBreaker(bytes32 priceFeedId) external;

    function configurePriceFeed(
        bytes32 priceFeedId,
        bytes32 pythId,
        address asset,
        address fallbackOracle,
        uint256 maxStaleness,
        uint256 volatilityThreshold
    ) external;

    function getUpdateFee(bytes[] calldata priceUpdateData) external view returns (uint256 fee);

    function getPriceFeedConfig(
        bytes32 priceFeedId
    ) external view returns (PriceFeedConfig memory config);

    function getCircuitBreakerStatus(
        bytes32 priceFeedId
    ) external view returns (CircuitBreaker memory breaker);

    function getSupportedPriceFeeds() external view returns (bytes32[] memory feeds);

    function getPriceFeedForAsset(address asset) external view returns (bytes32 priceFeedId);
}
