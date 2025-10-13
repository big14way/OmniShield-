// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title StatisticalMath
/// @notice Library for statistical calculations in risk assessment
/// @dev Provides functions for mean, standard deviation, correlation, and Value at Risk
library StatisticalMath {
    uint256 private constant PRECISION = 1e18;
    uint256 private constant SQRT_PRECISION = 1e9;

    /// @notice Calculate mean of an array of values
    /// @param values Array of values
    /// @return mean The arithmetic mean
    function calculateMean(uint256[] memory values) internal pure returns (uint256 mean) {
        if (values.length == 0) return 0;

        uint256 sum = 0;
        for (uint256 i = 0; i < values.length; i++) {
            sum += values[i];
        }
        return sum / values.length;
    }

    /// @notice Calculate standard deviation
    /// @param values Array of values
    /// @return stdDev The standard deviation
    function calculateStdDev(uint256[] memory values) internal pure returns (uint256 stdDev) {
        if (values.length < 2) return 0;

        uint256 mean = calculateMean(values);
        uint256 sumSquaredDiff = 0;

        for (uint256 i = 0; i < values.length; i++) {
            uint256 diff = values[i] > mean ? values[i] - mean : mean - values[i];
            sumSquaredDiff += (diff * diff) / PRECISION;
        }

        uint256 variance = sumSquaredDiff / values.length;
        return sqrt(variance * PRECISION);
    }

    /// @notice Calculate correlation coefficient between two datasets
    /// @param x First dataset
    /// @param y Second dataset
    /// @return correlation Correlation coefficient (-1e18 to 1e18)
    function calculateCorrelation(
        uint256[] memory x,
        uint256[] memory y
    ) internal pure returns (int256 correlation) {
        require(x.length == y.length && x.length > 1, "Invalid array lengths");

        uint256 n = x.length;
        uint256 sumX = 0;
        uint256 sumY = 0;
        uint256 sumXY = 0;
        uint256 sumX2 = 0;
        uint256 sumY2 = 0;

        for (uint256 i = 0; i < n; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += (x[i] * y[i]) / PRECISION;
            sumX2 += (x[i] * x[i]) / PRECISION;
            sumY2 += (y[i] * y[i]) / PRECISION;
        }

        int256 numerator = int256(n * sumXY) - int256((sumX * sumY) / PRECISION);
        uint256 denominator = sqrt(
            (n * sumX2 - (sumX * sumX) / PRECISION) * (n * sumY2 - (sumY * sumY) / PRECISION)
        );

        if (denominator == 0) return 0;
        return (numerator * int256(PRECISION)) / int256(denominator);
    }

    /// @notice Calculate Value at Risk (VaR) at 95% confidence level
    /// @param values Sorted array of loss values
    /// @param confidence Confidence level in basis points (9500 = 95%)
    /// @return varValue The Value at Risk
    function calculateVaR(
        uint256[] memory values,
        uint256 confidence
    ) internal pure returns (uint256 varValue) {
        require(values.length > 0, "Empty array");
        require(confidence <= 10000, "Invalid confidence level");

        // Calculate percentile index
        uint256 index = (values.length * (10000 - confidence)) / 10000;
        if (index >= values.length) index = values.length - 1;

        return values[index];
    }

    /// @notice Calculate Conditional Value at Risk (CVaR) - average of losses beyond VaR
    /// @param values Sorted array of loss values
    /// @param confidence Confidence level in basis points
    /// @return cvarValue The Conditional Value at Risk
    function calculateCVaR(
        uint256[] memory values,
        uint256 confidence
    ) internal pure returns (uint256 cvarValue) {
        require(values.length > 0, "Empty array");

        uint256 varIndex = (values.length * (10000 - confidence)) / 10000;
        if (varIndex >= values.length) varIndex = values.length - 1;

        uint256 sum = 0;
        uint256 count = 0;

        for (uint256 i = 0; i <= varIndex; i++) {
            sum += values[i];
            count++;
        }

        return count > 0 ? sum / count : 0;
    }

    /// @notice Calculate percentile of a sorted array
    /// @param values Sorted array
    /// @param percentile Percentile (0-10000 basis points)
    /// @return value The value at the percentile
    function calculatePercentile(
        uint256[] memory values,
        uint256 percentile
    ) internal pure returns (uint256 value) {
        require(values.length > 0, "Empty array");
        require(percentile <= 10000, "Invalid percentile");

        uint256 index = (values.length * percentile) / 10000;
        if (index >= values.length) index = values.length - 1;

        return values[index];
    }

    /// @notice Square root function using Babylonian method
    /// @param x Input value
    /// @return y Square root
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /// @notice Natural logarithm approximation
    /// @param x Input value (scaled by PRECISION)
    /// @return lnValue Natural log (scaled by PRECISION)
    function ln(uint256 x) internal pure returns (int256 lnValue) {
        require(x > 0, "ln of zero");

        int256 result = 0;
        uint256 y = x;

        // Scale to range [1, 2)
        while (y >= 2 * PRECISION) {
            y = y / 2;
            result += int256(693147180559945309); // ln(2) * 1e18
        }

        // Taylor series approximation for ln(1 + x)
        uint256 z = y - PRECISION;
        if (z == 0) return result;

        int256 term = int256(z);
        int256 sum = term;

        for (uint256 i = 2; i <= 10; i++) {
            term = (term * int256(z)) / int256(PRECISION);
            sum += (i % 2 == 0 ? -term : term) / int256(i);
        }

        return result + sum;
    }

    /// @notice Exponential function approximation
    /// @param x Input value (scaled by PRECISION)
    /// @return expValue e^x (scaled by PRECISION)
    function exp(int256 x) internal pure returns (uint256 expValue) {
        if (x < 0) {
            return PRECISION / exp(-x);
        }

        uint256 result = PRECISION;
        uint256 term = PRECISION;

        for (uint256 i = 1; i <= 20; i++) {
            term = (term * uint256(x)) / (PRECISION * i);
            result += term;
            if (term < 100) break; // Convergence threshold
        }

        return result;
    }
}
