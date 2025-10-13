// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title PercentageMath
/// @notice Library for percentage calculations with high precision
/// @dev Uses basis points (10000 = 100%) for precise percentage math
library PercentageMath {
    uint256 public constant PERCENTAGE_FACTOR = 1e4; // 10000 basis points = 100%
    uint256 public constant HALF_PERCENT = PERCENTAGE_FACTOR / 2;

    /// @notice Calculate percentage of a value
    /// @param value The base value
    /// @param percentage The percentage in basis points
    /// @return result The calculated percentage
    function percentMul(uint256 value, uint256 percentage) internal pure returns (uint256 result) {
        if (value == 0 || percentage == 0) {
            return 0;
        }

        require(
            value <= (type(uint256).max - HALF_PERCENT) / percentage,
            "PercentageMath: MULTIPLICATION_OVERFLOW"
        );

        return (value * percentage + HALF_PERCENT) / PERCENTAGE_FACTOR;
    }

    /// @notice Divide by percentage
    /// @param value The base value
    /// @param percentage The percentage in basis points
    /// @return result The result of division
    function percentDiv(uint256 value, uint256 percentage) internal pure returns (uint256 result) {
        require(percentage != 0, "PercentageMath: DIVISION_BY_ZERO");

        uint256 halfPercentage = percentage / 2;

        require(
            value <= (type(uint256).max - halfPercentage) / PERCENTAGE_FACTOR,
            "PercentageMath: MULTIPLICATION_OVERFLOW"
        );

        return (value * PERCENTAGE_FACTOR + halfPercentage) / percentage;
    }

    /// @notice Add a percentage to a value
    /// @param value The base value
    /// @param percentage The percentage to add in basis points
    /// @return result The value plus the percentage
    function percentAdd(uint256 value, uint256 percentage) internal pure returns (uint256 result) {
        return value + percentMul(value, percentage);
    }

    /// @notice Subtract a percentage from a value
    /// @param value The base value
    /// @param percentage The percentage to subtract in basis points
    /// @return result The value minus the percentage
    function percentSub(uint256 value, uint256 percentage) internal pure returns (uint256 result) {
        return value - percentMul(value, percentage);
    }

    /// @notice Calculate compound interest
    /// @param principal The principal amount
    /// @param rate Annual rate in basis points
    /// @param periods Number of compounding periods
    /// @return result The final amount after compound interest
    function compoundInterest(
        uint256 principal,
        uint256 rate,
        uint256 periods
    ) internal pure returns (uint256 result) {
        result = principal;
        for (uint256 i = 0; i < periods; i++) {
            result = percentAdd(result, rate);
        }
    }

    /// @notice Calculate weighted average
    /// @param values Array of values
    /// @param weights Array of weights in basis points
    /// @return avg Weighted average
    function weightedAverage(
        uint256[] memory values,
        uint256[] memory weights
    ) internal pure returns (uint256 avg) {
        require(values.length == weights.length, "PercentageMath: LENGTH_MISMATCH");

        uint256 totalWeight = 0;
        uint256 weightedSum = 0;

        for (uint256 i = 0; i < values.length; i++) {
            weightedSum += percentMul(values[i], weights[i]);
            totalWeight += weights[i];
        }

        require(totalWeight > 0, "PercentageMath: ZERO_TOTAL_WEIGHT");
        return percentDiv(weightedSum, totalWeight);
    }

    /// @notice Convert basis points to decimal string
    /// @param basisPoints Basis points value
    /// @return percentage Percentage as uint (multiplied by 100 for 2 decimals)
    function basisPointsToPercent(uint256 basisPoints) internal pure returns (uint256 percentage) {
        return (basisPoints * 100) / PERCENTAGE_FACTOR;
    }

    /// @notice Convert percentage to basis points
    /// @param percentage Percentage value (100 = 1%)
    /// @return basisPoints Basis points value
    function percentToBasisPoints(uint256 percentage) internal pure returns (uint256 basisPoints) {
        return (percentage * PERCENTAGE_FACTOR) / 100;
    }
}
