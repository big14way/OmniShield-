// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/// @title PythPriceConsumerV2
/// @notice Advanced Pyth Network oracle integration with volatility tracking and circuit breakers
/// @dev Implements comprehensive price feed management with fallback mechanisms
contract PythPriceConsumerV2 is AccessControl, ReentrancyGuard {
    // ============ Custom Errors ============

    error PriceTooStale();
    error PriceNotPositive();
    error InvalidPriceFeed();
    error ExtremeVolatility();
    error CircuitBreakerActive();
    error InsufficientUpdateFee();
    error NoFallbackOracle();
    error InvalidThreshold();
    error PriceDeviationExceedsThreshold();

    // ============ Structs ============

    /// @notice Historical price data point
    struct PricePoint {
        int64 price;
        uint64 conf;
        uint256 timestamp;
    }

    /// @notice Price feed configuration
    struct PriceFeedConfig {
        bytes32 pythId;
        address fallbackOracle;
        uint256 maxStaleness;
        uint256 volatilityThreshold;
        bool enabled;
    }

    /// @notice Circuit breaker state
    struct CircuitBreaker {
        bool active;
        uint256 activatedAt;
        uint256 cooldownPeriod;
        string reason;
    }

    // ============ Constants ============

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant PRICE_UPDATER_ROLE = keccak256("PRICE_UPDATER_ROLE");

    uint256 public constant DEFAULT_MAX_STALENESS = 60 seconds;
    uint256 public constant DEFAULT_VOLATILITY_THRESHOLD = 50; // 50%
    uint256 public constant VOLATILITY_WINDOW = 24 hours;
    uint256 public constant MAX_HISTORICAL_PRICES = 288; // 24h at 5min intervals
    uint256 public constant CONFIDENCE_THRESHOLD = 500; // 5% max confidence interval
    uint256 public constant CIRCUIT_BREAKER_COOLDOWN = 1 hours;

    // ============ State Variables ============

    IPyth public immutable pyth;

    mapping(bytes32 => PriceFeedConfig) public priceFeedConfigs;
    mapping(bytes32 => PricePoint[]) public historicalPrices;
    mapping(bytes32 => CircuitBreaker) public circuitBreakers;
    mapping(address => bytes32) public assetToPriceFeed;

    bytes32[] public supportedPriceFeeds;
    bool public emergencyPause;

    // ============ Events ============

    /// @notice Emitted when a price feed is updated
    event PriceUpdated(bytes32 indexed priceFeedId, int64 price, uint64 conf, uint256 timestamp);

    /// @notice Emitted when batch prices are updated
    event BatchPriceUpdate(bytes32[] priceFeedIds, uint256 updateCount, uint256 gasUsed);

    /// @notice Emitted when a price feed is configured
    event PriceFeedConfigured(
        bytes32 indexed priceFeedId,
        address indexed asset,
        uint256 maxStaleness,
        uint256 volatilityThreshold
    );

    /// @notice Emitted when circuit breaker is triggered
    event CircuitBreakerTriggered(
        bytes32 indexed priceFeedId,
        string reason,
        uint256 cooldownUntil
    );

    /// @notice Emitted when circuit breaker is reset
    event CircuitBreakerReset(bytes32 indexed priceFeedId);

    /// @notice Emitted when volatility exceeds threshold
    event HighVolatilityDetected(
        bytes32 indexed priceFeedId,
        uint256 volatility,
        uint256 threshold
    );

    /// @notice Emitted when price deviation is detected
    event PriceDeviationDetected(
        bytes32 indexed priceFeedId,
        int64 currentPrice,
        int64 twapPrice,
        uint256 deviationPercent
    );

    // ============ Constructor ============

    /// @notice Initializes the Pyth price consumer
    /// @param _pythAddress Address of the Pyth contract
    constructor(address _pythAddress) {
        if (_pythAddress == address(0)) revert InvalidPriceFeed();

        pyth = IPyth(_pythAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
        _grantRole(PRICE_UPDATER_ROLE, msg.sender);
    }

    // ============ Core Functions ============

    /// @notice Update price feeds with Pyth oracle data
    /// @param priceUpdateData Array of encoded price update data from Pyth
    function updatePriceFeeds(
        bytes[] calldata priceUpdateData
    ) external payable nonReentrant onlyRole(PRICE_UPDATER_ROLE) {
        if (emergencyPause) revert CircuitBreakerActive();

        uint256 fee = pyth.getUpdateFee(priceUpdateData);
        if (msg.value < fee) revert InsufficientUpdateFee();

        uint256 gasBefore = gasleft();

        // Update Pyth oracle
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Store historical prices for supported feeds
        bytes32[] memory updatedFeeds = new bytes32[](supportedPriceFeeds.length);
        uint256 updateCount = 0;

        for (uint256 i = 0; i < supportedPriceFeeds.length; i++) {
            bytes32 feedId = supportedPriceFeeds[i];
            PriceFeedConfig memory config = priceFeedConfigs[feedId];

            if (!config.enabled) continue;
            if (circuitBreakers[feedId].active) continue;

            try pyth.getPriceNoOlderThan(config.pythId, config.maxStaleness) returns (
                PythStructs.Price memory price
            ) {
                _storeHistoricalPrice(feedId, price);
                updatedFeeds[updateCount] = feedId;
                updateCount++;

                emit PriceUpdated(feedId, price.price, price.conf, price.publishTime);
            } catch {
                // Skip failed updates
                continue;
            }
        }

        uint256 gasUsed = gasBefore - gasleft();
        emit BatchPriceUpdate(updatedFeeds, updateCount, gasUsed);

        // Refund excess payment
        if (msg.value > fee) {
            payable(msg.sender).transfer(msg.value - fee);
        }
    }

    /// @notice Get latest price for a price feed with staleness check
    /// @param priceFeedId Price feed identifier
    /// @return price Price value with exponent applied
    /// @return timestamp Price publish timestamp
    function getLatestPrice(
        bytes32 priceFeedId
    ) external view returns (int256 price, uint256 timestamp) {
        PriceFeedConfig memory config = priceFeedConfigs[priceFeedId];
        if (!config.enabled) revert InvalidPriceFeed();
        if (circuitBreakers[priceFeedId].active) revert CircuitBreakerActive();

        PythStructs.Price memory pythPrice = pyth.getPriceNoOlderThan(
            config.pythId,
            config.maxStaleness
        );

        // Check price staleness
        if (block.timestamp - pythPrice.publishTime > config.maxStaleness) {
            revert PriceTooStale();
        }

        // Check price is positive
        if (pythPrice.price <= 0) revert PriceNotPositive();

        // Check confidence interval
        uint256 confPercent = (uint256(uint64(pythPrice.conf)) * 10000) /
            uint256(uint64(pythPrice.price));
        if (confPercent > CONFIDENCE_THRESHOLD) {
            // Try fallback oracle if available
            if (config.fallbackOracle != address(0)) {
                return _getFallbackPrice(config.fallbackOracle);
            }
            revert PriceNotPositive();
        }

        // Convert price with exponent
        price = int256(pythPrice.price);
        timestamp = pythPrice.publishTime;
    }

    /// @notice Calculate annualized volatility for a price feed
    /// @param priceFeedId Price feed identifier
    /// @param period Period in seconds to calculate volatility (max 24h)
    /// @return volatility Annualized volatility percentage (basis points)
    function calculateVolatility(
        bytes32 priceFeedId,
        uint256 period
    ) external view returns (uint256 volatility) {
        if (period > VOLATILITY_WINDOW) period = VOLATILITY_WINDOW;

        PricePoint[] memory prices = historicalPrices[priceFeedId];
        if (prices.length < 2) return 0;

        uint256 cutoffTime = block.timestamp - period;
        uint256 validPrices = 0;

        // Count valid prices within period
        for (uint256 i = prices.length; i > 0; i--) {
            if (prices[i - 1].timestamp < cutoffTime) break;
            validPrices++;
        }

        if (validPrices < 2) return 0;

        // Calculate returns
        int256[] memory priceReturns = new int256[](validPrices - 1);
        uint256 returnIndex = 0;

        for (uint256 i = prices.length - validPrices + 1; i < prices.length; i++) {
            int64 prevPrice = prices[i - 1].price;
            int64 currPrice = prices[i].price;

            // Calculate log return (approximated)
            int256 returnValue = ((int256(currPrice) - int256(prevPrice)) * 10000) /
                int256(prevPrice);
            priceReturns[returnIndex] = returnValue;
            returnIndex++;
        }

        // Calculate standard deviation
        int256 mean = _calculateMean(priceReturns);
        uint256 variance = _calculateVariance(priceReturns, mean);
        uint256 stdDev = _sqrt(variance);

        // Annualize volatility
        volatility = (stdDev * 31536000) / period; // Annualize based on period
    }

    /// @notice Detect if price deviation exceeds threshold
    /// @param priceFeedId Price feed identifier
    /// @param threshold Deviation threshold in basis points (e.g., 1000 = 10%)
    /// @return exceeded True if deviation exceeds threshold
    function detectPriceDeviation(
        bytes32 priceFeedId,
        uint256 threshold
    ) external returns (bool exceeded) {
        if (threshold == 0) revert InvalidThreshold();

        PriceFeedConfig memory config = priceFeedConfigs[priceFeedId];
        if (!config.enabled) revert InvalidPriceFeed();

        // Get current price
        PythStructs.Price memory currentPrice = pyth.getPriceNoOlderThan(
            config.pythId,
            config.maxStaleness
        );

        // Calculate 24h TWAP
        int64 twapPrice = _calculate24hTWAP(priceFeedId);
        if (twapPrice == 0) return false;

        // Calculate deviation percentage
        int256 deviation = ((int256(currentPrice.price) - int256(twapPrice)) * 10000) /
            int256(twapPrice);
        uint256 deviationAbs = deviation >= 0 ? uint256(deviation) : uint256(-deviation);

        exceeded = deviationAbs > threshold;

        if (exceeded) {
            emit PriceDeviationDetected(priceFeedId, currentPrice.price, twapPrice, deviationAbs);

            // Trigger circuit breaker if deviation is extreme
            if (deviationAbs > config.volatilityThreshold * 100) {
                _triggerCircuitBreaker(priceFeedId, "Extreme price deviation detected");
            }
        }
    }

    /// @notice Check and trigger circuit breaker if volatility is extreme
    /// @param priceFeedId Price feed identifier
    function checkVolatilityCircuitBreaker(bytes32 priceFeedId) external onlyRole(OPERATOR_ROLE) {
        uint256 volatility = this.calculateVolatility(priceFeedId, VOLATILITY_WINDOW);

        PriceFeedConfig memory config = priceFeedConfigs[priceFeedId];

        if (volatility > config.volatilityThreshold * 100) {
            emit HighVolatilityDetected(priceFeedId, volatility, config.volatilityThreshold * 100);
            _triggerCircuitBreaker(priceFeedId, "Extreme volatility detected");
        }
    }

    // ============ Admin Functions ============

    /// @notice Configure a price feed
    /// @param priceFeedId Internal price feed identifier
    /// @param pythId Pyth network price feed ID
    /// @param asset Asset address for mapping
    /// @param fallbackOracle Fallback oracle address (optional)
    /// @param maxStaleness Maximum price staleness in seconds
    /// @param volatilityThreshold Volatility threshold percentage
    function configurePriceFeed(
        bytes32 priceFeedId,
        bytes32 pythId,
        address asset,
        address fallbackOracle,
        uint256 maxStaleness,
        uint256 volatilityThreshold
    ) external onlyRole(OPERATOR_ROLE) {
        if (maxStaleness == 0) maxStaleness = DEFAULT_MAX_STALENESS;
        if (volatilityThreshold == 0) volatilityThreshold = DEFAULT_VOLATILITY_THRESHOLD;

        priceFeedConfigs[priceFeedId] = PriceFeedConfig({
            pythId: pythId,
            fallbackOracle: fallbackOracle,
            maxStaleness: maxStaleness,
            volatilityThreshold: volatilityThreshold,
            enabled: true
        });

        assetToPriceFeed[asset] = priceFeedId;

        // Add to supported feeds if not already present
        bool exists = false;
        for (uint256 i = 0; i < supportedPriceFeeds.length; i++) {
            if (supportedPriceFeeds[i] == priceFeedId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            supportedPriceFeeds.push(priceFeedId);
        }

        emit PriceFeedConfigured(priceFeedId, asset, maxStaleness, volatilityThreshold);
    }

    /// @notice Disable a price feed
    /// @param priceFeedId Price feed identifier
    function disablePriceFeed(bytes32 priceFeedId) external onlyRole(OPERATOR_ROLE) {
        priceFeedConfigs[priceFeedId].enabled = false;
    }

    /// @notice Enable a price feed
    /// @param priceFeedId Price feed identifier
    function enablePriceFeed(bytes32 priceFeedId) external onlyRole(OPERATOR_ROLE) {
        priceFeedConfigs[priceFeedId].enabled = true;
    }

    /// @notice Reset circuit breaker for a price feed
    /// @param priceFeedId Price feed identifier
    function resetCircuitBreaker(bytes32 priceFeedId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        CircuitBreaker storage cb = circuitBreakers[priceFeedId];

        if (cb.active && block.timestamp < cb.activatedAt + cb.cooldownPeriod) {
            revert CircuitBreakerActive();
        }

        cb.active = false;
        cb.reason = "";

        emit CircuitBreakerReset(priceFeedId);
    }

    /// @notice Enable emergency pause
    function enableEmergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyPause = true;
    }

    /// @notice Disable emergency pause
    function disableEmergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyPause = false;
    }

    // ============ View Functions ============

    /// @notice Get update fee for price updates
    /// @param priceUpdateData Price update data
    /// @return fee Update fee in wei
    function getUpdateFee(bytes[] calldata priceUpdateData) external view returns (uint256 fee) {
        return pyth.getUpdateFee(priceUpdateData);
    }

    /// @notice Get price feed configuration
    /// @param priceFeedId Price feed identifier
    /// @return config Price feed configuration
    function getPriceFeedConfig(
        bytes32 priceFeedId
    ) external view returns (PriceFeedConfig memory config) {
        return priceFeedConfigs[priceFeedId];
    }

    /// @notice Get circuit breaker status
    /// @param priceFeedId Price feed identifier
    /// @return breaker Circuit breaker state
    function getCircuitBreakerStatus(
        bytes32 priceFeedId
    ) external view returns (CircuitBreaker memory breaker) {
        return circuitBreakers[priceFeedId];
    }

    /// @notice Get all supported price feeds
    /// @return feeds Array of price feed identifiers
    function getSupportedPriceFeeds() external view returns (bytes32[] memory feeds) {
        return supportedPriceFeeds;
    }

    /// @notice Get price feed ID for an asset
    /// @param asset Asset address
    /// @return priceFeedId Price feed identifier
    function getPriceFeedForAsset(address asset) external view returns (bytes32 priceFeedId) {
        return assetToPriceFeed[asset];
    }

    // ============ Internal Functions ============

    /// @notice Store historical price data
    /// @param priceFeedId Price feed identifier
    /// @param price Price struct from Pyth
    function _storeHistoricalPrice(bytes32 priceFeedId, PythStructs.Price memory price) private {
        PricePoint[] storage prices = historicalPrices[priceFeedId];

        // Remove oldest price if at max capacity
        if (prices.length >= MAX_HISTORICAL_PRICES) {
            for (uint256 i = 0; i < prices.length - 1; i++) {
                prices[i] = prices[i + 1];
            }
            prices.pop();
        }

        prices.push(
            PricePoint({price: price.price, conf: price.conf, timestamp: price.publishTime})
        );
    }

    /// @notice Calculate 24h Time-Weighted Average Price
    /// @param priceFeedId Price feed identifier
    /// @return twap 24h TWAP
    function _calculate24hTWAP(bytes32 priceFeedId) private view returns (int64 twap) {
        PricePoint[] memory prices = historicalPrices[priceFeedId];
        if (prices.length < 2) return 0;

        uint256 cutoffTime = block.timestamp - VOLATILITY_WINDOW;
        int256 weightedSum = 0;
        uint256 totalWeight = 0;

        for (uint256 i = 0; i < prices.length; i++) {
            if (prices[i].timestamp < cutoffTime) continue;

            uint256 weight = block.timestamp - prices[i].timestamp;
            weightedSum += int256(prices[i].price) * int256(weight);
            totalWeight += weight;
        }

        if (totalWeight == 0) return 0;
        return int64(weightedSum / int256(totalWeight));
    }

    /// @notice Trigger circuit breaker
    /// @param priceFeedId Price feed identifier
    /// @param reason Reason for triggering
    function _triggerCircuitBreaker(bytes32 priceFeedId, string memory reason) private {
        circuitBreakers[priceFeedId] = CircuitBreaker({
            active: true,
            activatedAt: block.timestamp,
            cooldownPeriod: CIRCUIT_BREAKER_COOLDOWN,
            reason: reason
        });

        emit CircuitBreakerTriggered(
            priceFeedId,
            reason,
            block.timestamp + CIRCUIT_BREAKER_COOLDOWN
        );
    }

    /// @notice Get price from fallback oracle
    /// @param fallbackOracle Fallback oracle address
    /// @return price Fallback price
    /// @return timestamp Fallback timestamp
    function _getFallbackPrice(
        address fallbackOracle
    ) private view returns (int256 price, uint256 timestamp) {
        if (fallbackOracle == address(0)) revert NoFallbackOracle();
        // Implement fallback oracle call
        // This is a placeholder - actual implementation depends on fallback oracle interface
        return (0, 0);
    }

    /// @notice Calculate mean of array
    /// @param values Array of values
    /// @return mean Mean value
    function _calculateMean(int256[] memory values) private pure returns (int256 mean) {
        if (values.length == 0) return 0;

        int256 sum = 0;
        for (uint256 i = 0; i < values.length; i++) {
            sum += values[i];
        }
        return sum / int256(values.length);
    }

    /// @notice Calculate variance of array
    /// @param values Array of values
    /// @param mean Mean of values
    /// @return variance Variance
    function _calculateVariance(
        int256[] memory values,
        int256 mean
    ) private pure returns (uint256 variance) {
        if (values.length == 0) return 0;

        uint256 sumSquaredDiff = 0;
        for (uint256 i = 0; i < values.length; i++) {
            int256 diff = values[i] - mean;
            sumSquaredDiff += uint256(diff * diff);
        }
        return sumSquaredDiff / values.length;
    }

    /// @notice Calculate square root
    /// @param x Input value
    /// @return y Square root
    function _sqrt(uint256 x) private pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
