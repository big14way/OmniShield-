// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title IInsurancePoolV2
/// @notice Interface for the enhanced OmniShield insurance pool
interface IInsurancePoolV2 {
    enum CoverageType {
        SmartContractHack,
        PriceCrash,
        Depeg,
        ProtocolFailure,
        BridgeExploit
    }

    struct Coverage {
        uint256 amount;
        uint256 premium;
        uint256 startTime;
        uint256 expiry;
        address asset;
        CoverageType coverageType;
        bool active;
    }

    struct RiskParameters {
        uint256 baseRate;
        uint256 utilizationMultiplier;
        bool enabled;
    }

    event CoveragePurchased(
        uint256 indexed coverageId,
        address indexed buyer,
        uint256 amount,
        address asset,
        CoverageType coverageType,
        uint256 premium
    );

    event LiquidityProvided(address indexed provider, uint256 amount, uint256 lpTokensMinted);

    event WithdrawalRequested(address indexed provider, uint256 amount);

    event LiquidityWithdrawn(address indexed provider, uint256 amount, uint256 lpTokensBurned);

    event ClaimProcessed(
        uint256 indexed coverageId,
        address indexed claimant,
        uint256 payoutAmount
    );

    function purchaseCoverage(
        uint256 amount,
        address asset,
        uint256 period,
        CoverageType coverageType
    ) external returns (uint256);

    function purchaseCoverageWithPermit(
        uint256 amount,
        address asset,
        uint256 period,
        CoverageType coverageType,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256);

    function provideLiquidity(uint256 amount, address asset) external;

    function requestWithdrawal(uint256 lpTokenAmount) external;

    function withdrawLiquidity(uint256 lpTokenAmount, address asset) external;

    function processClaim(uint256 coverageId, bytes calldata pythPriceUpdate) external payable;

    function calculatePremium(
        uint256 amount,
        uint256 period,
        CoverageType coverageType
    ) external view returns (uint256);

    function getCoverage(uint256 coverageId) external view returns (Coverage memory);

    function getUtilizationRatio() external view returns (uint256);
}
