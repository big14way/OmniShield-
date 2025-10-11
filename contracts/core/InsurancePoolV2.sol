// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "../tokens/LPToken.sol";
import "../tokens/CoverageNFT.sol";
import "../oracles/PythPriceConsumer.sol";

/// @title InsurancePoolV2
/// @notice Advanced insurance pool with liquidity provision, coverage NFTs, and Pyth oracle integration
/// @dev Implements EIP-2612 permit for gasless approvals and comprehensive DeFi insurance features
contract InsurancePoolV2 is ReentrancyGuard, Pausable, AccessControl {
    using SafeERC20 for IERC20;

    // ============ Custom Errors ============

    error InvalidCoverageAmount();
    error InvalidPeriod();
    error ExceedsMaxCoverageRatio();
    error InsufficientPremium();
    error InvalidAsset();
    error CoverageNotActive();
    error CoverageExpired();
    error UnauthorizedClaim();
    error WithdrawalDelayNotMet();
    error InsufficientLiquidity();
    error InvalidCoverageType();
    error ZeroAmount();
    error EmergencyPaused();

    // ============ Enums ============

    /// @notice Types of insurance coverage available
    enum CoverageType {
        SmartContractHack,
        PriceCrash,
        Depeg,
        ProtocolFailure,
        BridgeExploit
    }

    // ============ Structs ============

    /// @notice Coverage details for a user
    struct Coverage {
        uint256 amount;
        uint256 premium;
        uint256 startTime;
        uint256 expiry;
        address asset;
        CoverageType coverageType;
        bool active;
    }

    /// @notice Risk parameters for each coverage type
    struct RiskParameters {
        uint256 baseRate; // Basis points (1% = 100)
        uint256 utilizationMultiplier;
        bool enabled;
    }

    /// @notice Withdrawal request details
    struct WithdrawalRequest {
        uint256 amount;
        uint256 requestTime;
        bool processed;
    }

    // ============ Constants ============

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant CLAIM_PROCESSOR_ROLE = keccak256("CLAIM_PROCESSOR_ROLE");

    uint256 public constant MIN_COVERAGE_PERIOD = 7 days;
    uint256 public constant MAX_COVERAGE_RATIO = 8000; // 80%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant WITHDRAWAL_DELAY = 24 hours;

    // ============ State Variables ============

    LPToken public lpToken;
    CoverageNFT public coverageNFT;
    PythPriceConsumer public pythOracle;

    uint256 public totalPoolLiquidity;
    uint256 public activeCoverageAmount;
    uint256 private _coverageCounter;

    mapping(address => bool) public supportedAssets;
    mapping(CoverageType => RiskParameters) public riskParameters;
    mapping(address => WithdrawalRequest) public withdrawalRequests;
    mapping(uint256 => Coverage) public coverages;

    bool public emergencyWithdrawalEnabled;

    // ============ Events ============

    /// @notice Emitted when coverage is purchased
    event CoveragePurchased(
        uint256 indexed coverageId,
        address indexed buyer,
        uint256 amount,
        address asset,
        CoverageType coverageType,
        uint256 premium
    );

    /// @notice Emitted when liquidity is provided
    event LiquidityProvided(address indexed provider, uint256 amount, uint256 lpTokensMinted);

    /// @notice Emitted when liquidity withdrawal is requested
    event WithdrawalRequested(address indexed provider, uint256 amount);

    /// @notice Emitted when liquidity is withdrawn
    event LiquidityWithdrawn(address indexed provider, uint256 amount, uint256 lpTokensBurned);

    /// @notice Emitted when a claim is processed
    event ClaimProcessed(
        uint256 indexed coverageId,
        address indexed claimant,
        uint256 payoutAmount
    );

    /// @notice Emitted when emergency withdrawal is triggered
    event EmergencyWithdrawal(address indexed admin, uint256 amount);

    // ============ Constructor ============

    /// @notice Initializes the insurance pool
    /// @param _lpToken Address of the LP token contract
    /// @param _coverageNFT Address of the coverage NFT contract
    /// @param _pythOracle Address of the Pyth oracle consumer
    constructor(address _lpToken, address _coverageNFT, address _pythOracle) {
        lpToken = LPToken(_lpToken);
        coverageNFT = CoverageNFT(_coverageNFT);
        pythOracle = PythPriceConsumer(_pythOracle);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(CLAIM_PROCESSOR_ROLE, msg.sender);

        _initializeRiskParameters();
    }

    // ============ Core Functions ============

    /// @notice Purchase insurance coverage
    /// @param amount Amount of coverage to purchase
    /// @param asset Asset to cover
    /// @param period Coverage period in seconds
    /// @param coverageType Type of coverage
    /// @return coverageId The ID of the created coverage
    function purchaseCoverage(
        uint256 amount,
        address asset,
        uint256 period,
        CoverageType coverageType
    ) external nonReentrant whenNotPaused returns (uint256) {
        uint256 premium = calculatePremium(amount, period, coverageType);

        // Transfer premium
        IERC20(asset).safeTransferFrom(msg.sender, address(this), premium);

        return _purchaseCoverageInternal(amount, asset, period, coverageType, premium);
    }

    /// @notice Purchase coverage using permit for gasless approval
    /// @param amount Amount of coverage to purchase
    /// @param asset Asset to cover
    /// @param period Coverage period in seconds
    /// @param coverageType Type of coverage
    /// @param deadline Permit deadline
    /// @param v Permit signature v
    /// @param r Permit signature r
    /// @param s Permit signature s
    /// @return coverageId The ID of the created coverage
    function purchaseCoverageWithPermit(
        uint256 amount,
        address asset,
        uint256 period,
        CoverageType coverageType,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant whenNotPaused returns (uint256) {
        uint256 premium = calculatePremium(amount, period, coverageType);

        // Execute permit for gasless approval
        IERC20Permit(asset).permit(msg.sender, address(this), premium, deadline, v, r, s);

        // Transfer premium
        IERC20(asset).safeTransferFrom(msg.sender, address(this), premium);

        return _purchaseCoverageInternal(amount, asset, period, coverageType, premium);
    }

    /// @notice Provide liquidity to the insurance pool
    /// @param amount Amount of liquidity to provide
    /// @param asset Asset to provide (USDC/USDT/DAI)
    function provideLiquidity(uint256 amount, address asset) external nonReentrant whenNotPaused {
        if (amount == 0) revert ZeroAmount();
        if (!supportedAssets[asset]) revert InvalidAsset();

        // Calculate LP tokens to mint
        uint256 lpTokensToMint;
        if (lpToken.totalSupply() == 0) {
            lpTokensToMint = amount;
        } else {
            lpTokensToMint = (amount * lpToken.totalSupply()) / totalPoolLiquidity;
        }

        // Transfer assets
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Mint LP tokens
        lpToken.mint(msg.sender, lpTokensToMint);

        totalPoolLiquidity += amount;

        emit LiquidityProvided(msg.sender, amount, lpTokensToMint);
    }

    /// @notice Request liquidity withdrawal (24hr delay)
    /// @param lpTokenAmount Amount of LP tokens to withdraw
    function requestWithdrawal(uint256 lpTokenAmount) external nonReentrant {
        if (lpTokenAmount == 0) revert ZeroAmount();
        if (lpToken.balanceOf(msg.sender) < lpTokenAmount) revert InsufficientLiquidity();

        uint256 withdrawalAmount = (lpTokenAmount * totalPoolLiquidity) / lpToken.totalSupply();

        withdrawalRequests[msg.sender] = WithdrawalRequest({
            amount: withdrawalAmount,
            requestTime: block.timestamp,
            processed: false
        });

        emit WithdrawalRequested(msg.sender, withdrawalAmount);
    }

    /// @notice Withdraw liquidity after delay period
    /// @param lpTokenAmount Amount of LP tokens to burn
    /// @param asset Asset to withdraw
    function withdrawLiquidity(uint256 lpTokenAmount, address asset) external nonReentrant {
        if (lpTokenAmount == 0) revert ZeroAmount();
        if (!supportedAssets[asset]) revert InvalidAsset();

        WithdrawalRequest storage request = withdrawalRequests[msg.sender];
        if (request.processed) revert InsufficientLiquidity();
        if (block.timestamp < request.requestTime + WITHDRAWAL_DELAY)
            revert WithdrawalDelayNotMet();

        uint256 withdrawalAmount = (lpTokenAmount * totalPoolLiquidity) / lpToken.totalSupply();

        if (withdrawalAmount > totalPoolLiquidity - activeCoverageAmount)
            revert InsufficientLiquidity();

        // Burn LP tokens
        lpToken.burn(msg.sender, lpTokenAmount);

        // Transfer assets
        IERC20(asset).safeTransfer(msg.sender, withdrawalAmount);

        totalPoolLiquidity -= withdrawalAmount;
        request.processed = true;

        emit LiquidityWithdrawn(msg.sender, withdrawalAmount, lpTokenAmount);
    }

    /// @notice Process a claim using Pyth oracle price updates
    /// @param coverageId Coverage ID to claim
    /// @param pythPriceUpdate Pyth price update data
    function processClaim(
        uint256 coverageId,
        bytes calldata pythPriceUpdate
    ) external payable nonReentrant onlyRole(CLAIM_PROCESSOR_ROLE) {
        Coverage storage coverage = coverages[coverageId];

        if (!coverage.active) revert CoverageNotActive();
        if (block.timestamp > coverage.expiry) revert CoverageExpired();

        address holder = coverageNFT.ownerOf(coverageId);

        // Update Pyth oracle prices
        bytes[] memory updateData = new bytes[](1);
        updateData[0] = pythPriceUpdate;
        pythOracle.updatePriceFeeds{value: msg.value}(updateData);

        // Verify claim conditions based on coverage type
        bool claimValid = _verifyClaimConditions(coverageId, coverage);
        if (!claimValid) revert UnauthorizedClaim();

        // Calculate payout
        uint256 payoutAmount = coverage.amount;

        // Deactivate coverage
        coverage.active = false;
        coverageNFT.deactivateCoverage(coverageId);

        // Transfer payout
        IERC20(coverage.asset).safeTransfer(holder, payoutAmount);

        activeCoverageAmount -= coverage.amount;

        emit ClaimProcessed(coverageId, holder, payoutAmount);
    }

    // ============ View Functions ============

    /// @notice Calculate premium for coverage
    /// @param amount Coverage amount
    /// @param period Coverage period
    /// @param coverageType Type of coverage
    /// @return Premium amount in basis points
    function calculatePremium(
        uint256 amount,
        uint256 period,
        CoverageType coverageType
    ) public view returns (uint256) {
        RiskParameters memory params = riskParameters[coverageType];

        uint256 utilizationRate = (activeCoverageAmount * BASIS_POINTS) / totalPoolLiquidity;
        uint256 utilizationPremium = (utilizationRate * params.utilizationMultiplier) /
            BASIS_POINTS;

        uint256 basePremium = (amount * params.baseRate) / BASIS_POINTS;
        uint256 timePremium = (basePremium * period) / 365 days;

        return basePremium + timePremium + utilizationPremium;
    }

    /// @notice Get utilization ratio of the pool
    /// @return Utilization ratio in basis points
    function getUtilizationRatio() external view returns (uint256) {
        if (totalPoolLiquidity == 0) return 0;
        return (activeCoverageAmount * BASIS_POINTS) / totalPoolLiquidity;
    }

    /// @notice Get coverage details
    /// @param coverageId Coverage ID
    /// @return Coverage struct
    function getCoverage(uint256 coverageId) external view returns (Coverage memory) {
        return coverages[coverageId];
    }

    // ============ Admin Functions ============

    /// @notice Add supported asset
    /// @param asset Asset address to support
    function addSupportedAsset(address asset) external onlyRole(ADMIN_ROLE) {
        supportedAssets[asset] = true;
    }

    /// @notice Remove supported asset
    /// @param asset Asset address to remove
    function removeSupportedAsset(address asset) external onlyRole(ADMIN_ROLE) {
        supportedAssets[asset] = false;
    }

    /// @notice Update risk parameters for a coverage type
    /// @param coverageType Coverage type to update
    /// @param baseRate Base rate in basis points
    /// @param utilizationMultiplier Utilization multiplier
    /// @param enabled Whether coverage type is enabled
    function updateRiskParameters(
        CoverageType coverageType,
        uint256 baseRate,
        uint256 utilizationMultiplier,
        bool enabled
    ) external onlyRole(ADMIN_ROLE) {
        riskParameters[coverageType] = RiskParameters({
            baseRate: baseRate,
            utilizationMultiplier: utilizationMultiplier,
            enabled: enabled
        });
    }

    /// @notice Pause contract
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause contract
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Enable emergency withdrawal
    function enableEmergencyWithdrawal() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyWithdrawalEnabled = true;
    }

    /// @notice Emergency withdrawal circuit breaker
    /// @param asset Asset to withdraw
    /// @param amount Amount to withdraw
    function emergencyWithdraw(
        address asset,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!emergencyWithdrawalEnabled) revert EmergencyPaused();

        IERC20(asset).safeTransfer(msg.sender, amount);

        emit EmergencyWithdrawal(msg.sender, amount);
    }

    // ============ Internal Functions ============

    /// @notice Initialize default risk parameters
    function _initializeRiskParameters() private {
        riskParameters[CoverageType.SmartContractHack] = RiskParameters({
            baseRate: 200,
            utilizationMultiplier: 150,
            enabled: true
        });

        riskParameters[CoverageType.PriceCrash] = RiskParameters({
            baseRate: 150,
            utilizationMultiplier: 100,
            enabled: true
        });

        riskParameters[CoverageType.Depeg] = RiskParameters({
            baseRate: 100,
            utilizationMultiplier: 120,
            enabled: true
        });

        riskParameters[CoverageType.ProtocolFailure] = RiskParameters({
            baseRate: 250,
            utilizationMultiplier: 200,
            enabled: true
        });

        riskParameters[CoverageType.BridgeExploit] = RiskParameters({
            baseRate: 300,
            utilizationMultiplier: 250,
            enabled: true
        });
    }

    /// @notice Internal function to purchase coverage
    /// @param amount Amount of coverage
    /// @param asset Asset to cover
    /// @param period Coverage period
    /// @param coverageType Type of coverage
    /// @param premium Premium amount already calculated
    /// @return coverageId The ID of the created coverage
    function _purchaseCoverageInternal(
        uint256 amount,
        address asset,
        uint256 period,
        CoverageType coverageType,
        uint256 premium
    ) private returns (uint256) {
        if (amount == 0) revert ZeroAmount();
        if (period < MIN_COVERAGE_PERIOD) revert InvalidPeriod();
        if (!supportedAssets[asset]) revert InvalidAsset();
        if (!riskParameters[coverageType].enabled) revert InvalidCoverageType();

        // Check coverage ratio
        uint256 maxCoverage = (totalPoolLiquidity * MAX_COVERAGE_RATIO) / BASIS_POINTS;
        if (activeCoverageAmount + amount > maxCoverage) revert ExceedsMaxCoverageRatio();

        // Mint coverage NFT
        _coverageCounter++;
        uint256 coverageId = _coverageCounter;

        coverageNFT.mint(
            msg.sender,
            coverageId,
            amount,
            premium,
            period,
            asset,
            uint8(coverageType)
        );

        // Store coverage data
        coverages[coverageId] = Coverage({
            amount: amount,
            premium: premium,
            startTime: block.timestamp,
            expiry: block.timestamp + period,
            asset: asset,
            coverageType: coverageType,
            active: true
        });

        activeCoverageAmount += amount;
        totalPoolLiquidity += premium;

        emit CoveragePurchased(coverageId, msg.sender, amount, asset, coverageType, premium);

        return coverageId;
    }

    /// @notice Verify claim conditions based on coverage type
    /// @param coverageId Coverage ID
    /// @param coverage Coverage struct
    /// @return bool True if claim is valid
    function _verifyClaimConditions(
        uint256 coverageId,
        Coverage memory coverage
    ) private view returns (bool) {
        // Implementation would verify conditions based on Pyth oracle data
        // For now, returns true as placeholder
        return true;
    }
}
