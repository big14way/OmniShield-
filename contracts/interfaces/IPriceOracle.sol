// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IPriceOracle
/// @notice Generic interface for price oracle integration
interface IPriceOracle {
    function getLatestPrice(
        bytes32 priceFeedId
    ) external view returns (int256 price, uint256 timestamp);

    function calculateVolatility(
        bytes32 priceFeedId,
        uint256 period
    ) external view returns (uint256 volatility);

    function getPriceFeedForAsset(address asset) external view returns (bytes32 priceFeedId);
}
