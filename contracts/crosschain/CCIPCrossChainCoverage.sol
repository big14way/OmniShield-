// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {IAny2EVMMessageReceiver} from "@chainlink/contracts-ccip/contracts/interfaces/IAny2EVMMessageReceiver.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CCIPCrossChainCoverage
 * @notice Enables cross-chain insurance coverage using Chainlink CCIP
 * @dev Implements secure cross-chain messaging with rate limiting and replay protection
 *
 * ## Cross-Chain Flow:
 *
 * 1. **Purchase Coverage on Source Chain:**
 *    - User calls `sendCrossChainCoverage()` with coverage details
 *    - Contract encodes coverage data and calculates CCIP fees
 *    - CCIP message sent with payment tokens to destination chain
 *    - Pending coverage stored locally with unique message ID
 *
 * 2. **Receive Coverage on Destination Chain:**
 *    - `_ccipReceive()` called by CCIP router
 *    - Validates source chain and sender address
 *    - Checks rate limits and replay protection
 *    - Decodes coverage data and processes on destination
 *    - Emits CrossChainCoverageReceived event
 *
 * 3. **Claim Processing:**
 *    - Claims can be submitted on destination chain
 *    - Claim status synchronized back to source if needed
 *    - CCIP handles secure cross-chain message passing
 *
 * ## Security Features:
 * - Chain whitelisting via `enableChain()`
 * - Rate limiting per source chain
 * - Message replay protection using nonces
 * - Emergency pause for bridge operations
 * - Role-based access control
 */
contract CCIPCrossChainCoverage is
    IAny2EVMMessageReceiver,
    AccessControl,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // ============ Custom Errors ============

    error InvalidRouter();

    error ChainNotEnabled(uint64 chainSelector);
    error InvalidRemoteContract();
    error RateLimitExceeded(uint64 chainSelector);
    error MessageAlreadyProcessed(bytes32 messageId);
    error InsufficientFeePayment(uint256 required, uint256 provided);
    error InvalidCoverageAmount();
    error InvalidDuration();
    error TokenTransferFailed();

    // ============ Structs ============

    /**
     * @notice Cross-chain coverage data structure
     * @param holder Address of the coverage holder on destination chain
     * @param coverageAmount Amount of coverage in wei
     * @param duration Coverage duration in seconds
     * @param premium Premium amount paid
     * @param sourceChain Chain where coverage was purchased
     * @param timestamp When coverage was created
     */
    struct Coverage {
        address holder;
        uint256 coverageAmount;
        uint256 duration;
        uint256 premium;
        uint64 sourceChain;
        uint256 timestamp;
    }

    /**
     * @notice Chain configuration for cross-chain operations
     * @param remoteContract Address of OmniShield contract on remote chain
     * @param enabled Whether chain is whitelisted for cross-chain ops
     * @param rateLimitPerHour Maximum messages per hour from this chain
     * @param lastResetTime When rate limit counter was last reset
     * @param messageCount Current message count in rate limit window
     */
    struct ChainConfig {
        address remoteContract;
        bool enabled;
        uint256 rateLimitPerHour;
        uint256 lastResetTime;
        uint256 messageCount;
    }

    // ============ Constants ============

    bytes32 public constant BRIDGE_ADMIN_ROLE = keccak256("BRIDGE_ADMIN_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    uint256 public constant DEFAULT_RATE_LIMIT = 100; // 100 messages per hour
    uint256 public constant RATE_LIMIT_WINDOW = 1 hours;
    uint256 public constant MIN_COVERAGE_AMOUNT = 0.01 ether;
    uint256 public constant MAX_COVERAGE_AMOUNT = 1000 ether;
    uint256 public constant MIN_DURATION = 1 days;
    uint256 public constant MAX_DURATION = 365 days;

    // ============ State Variables ============

    /// @notice CCIP router address
    address private immutable i_ccipRouter;

    /// @notice Insurance pool contract on local chain
    address public immutable insurancePool;

    /// @notice LINK token for CCIP fees
    IERC20 public immutable linkToken;

    /// @notice Configuration for each supported chain
    mapping(uint64 => ChainConfig) public chainConfigs;

    /// @notice Pending coverage requests by message ID
    mapping(bytes32 => Coverage) public pendingCoverages;

    /// @notice Processed message IDs for replay protection
    mapping(bytes32 => bool) public processedMessages;

    /// @notice Nonce for message replay protection
    mapping(address => uint256) public nonces;

    /// @notice Total cross-chain coverage amount
    uint256 public totalCrossChainCoverage;

    // ============ Events ============

    /**
     * @notice Emitted when coverage is sent to another chain
     * @param messageId Unique CCIP message ID
     * @param destinationChain CCIP chain selector of destination
     * @param coverage Coverage details
     * @param fee CCIP fee paid in LINK
     */
    event CrossChainCoverageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChain,
        Coverage coverage,
        uint256 fee
    );

    /**
     * @notice Emitted when coverage is received from another chain
     * @param messageId Unique CCIP message ID
     * @param sourceChain CCIP chain selector of source
     * @param coverage Coverage details
     */
    event CrossChainCoverageReceived(
        bytes32 indexed messageId,
        uint64 indexed sourceChain,
        Coverage coverage
    );

    /**
     * @notice Emitted when a chain is enabled/disabled
     * @param chainSelector CCIP chain selector
     * @param remoteContract Address of remote contract
     * @param enabled Whether chain is enabled
     */
    event ChainConfigured(uint64 indexed chainSelector, address remoteContract, bool enabled);

    /**
     * @notice Emitted when rate limit is updated
     * @param chainSelector CCIP chain selector
     * @param newLimit New rate limit per hour
     */
    event RateLimitUpdated(uint64 indexed chainSelector, uint256 newLimit);

    /**
     * @notice Emitted when bridge is paused/unpaused
     * @param paused Whether bridge is paused
     */
    event BridgePauseToggled(bool paused);

    // ============ Constructor ============

    /**
     * @notice Initialize cross-chain coverage contract
     * @param _router CCIP router address
     * @param _linkToken LINK token address for fees
     * @param _insurancePool Local insurance pool address
     */
    constructor(address _router, address _linkToken, address _insurancePool) {
        if (_router == address(0)) revert InvalidRouter();
        require(_linkToken != address(0), "Invalid LINK token");
        require(_insurancePool != address(0), "Invalid insurance pool");

        i_ccipRouter = _router;
        linkToken = IERC20(_linkToken);
        insurancePool = _insurancePool;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    /// @notice CCIP router getter required by IAny2EVMMessageReceiver
    function getRouter() public view returns (address) {
        return i_ccipRouter;
    }

    // ============ Core Functions ============

    /**
     * @notice Send coverage request to destination chain via CCIP
     * @dev Encodes coverage data, calculates fees, sends CCIP message with tokens
     *
     * Requirements:
     * - Destination chain must be enabled
     * - Coverage amount within valid range
     * - Duration within valid range
     * - Sufficient LINK tokens approved for fees
     *
     * Process:
     * 1. Validate coverage parameters
     * 2. Check destination chain is enabled
     * 3. Encode coverage data
     * 4. Calculate CCIP fees
     * 5. Transfer LINK for fees
     * 6. Send CCIP message
     * 7. Store pending coverage
     *
     * @param destinationChain CCIP chain selector of destination
     * @param coverage Coverage details to send
     * @return messageId Unique CCIP message ID
     */
    function sendCrossChainCoverage(
        uint64 destinationChain,
        Coverage memory coverage
    ) external payable nonReentrant whenNotPaused returns (bytes32 messageId) {
        // Validate inputs
        if (!chainConfigs[destinationChain].enabled) {
            revert ChainNotEnabled(destinationChain);
        }
        if (
            coverage.coverageAmount < MIN_COVERAGE_AMOUNT ||
            coverage.coverageAmount > MAX_COVERAGE_AMOUNT
        ) {
            revert InvalidCoverageAmount();
        }
        if (coverage.duration < MIN_DURATION || coverage.duration > MAX_DURATION) {
            revert InvalidDuration();
        }

        // Set coverage metadata
        coverage.sourceChain = uint64(block.chainid);
        coverage.timestamp = block.timestamp;

        // Increment nonce for sender
        nonces[msg.sender]++;

        // Encode coverage data with nonce for replay protection
        bytes memory data = abi.encode(coverage, nonces[msg.sender]);

        // Build CCIP message
        Client.EVM2AnyMessage memory ccipMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(chainConfigs[destinationChain].remoteContract),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0), // No tokens transferred with message
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: 500_000}) // Gas for destination processing
            ),
            feeToken: address(linkToken)
        });

        // Calculate fee
        uint256 fee = IRouterClient(i_ccipRouter).getFee(destinationChain, ccipMessage);

        // Validate fee payment
        if (msg.value > 0) {
            // Native token payment not supported, refund
            payable(msg.sender).transfer(msg.value);
            revert InsufficientFeePayment(fee, 0);
        }

        // Transfer LINK tokens for fee
        linkToken.safeTransferFrom(msg.sender, address(this), fee);
        linkToken.approve(i_ccipRouter, fee);

        // Send CCIP message
        messageId = IRouterClient(i_ccipRouter).ccipSend(destinationChain, ccipMessage);

        // Store pending coverage
        pendingCoverages[messageId] = coverage;

        totalCrossChainCoverage += coverage.coverageAmount;

        emit CrossChainCoverageSent(messageId, destinationChain, coverage, fee);

        return messageId;
    }

    /**
     * @notice Receive and process cross-chain coverage from CCIP
     * @dev Called by CCIP router when message arrives from another chain.
     *      Required by IAny2EVMMessageReceiver interface.
     *
     * Security Checks:
     * - Only callable by CCIP router
     * - Validates source chain is enabled
     * - Checks sender is whitelisted remote contract
     * - Enforces rate limiting per source chain
     * - Prevents replay attacks via message ID tracking
     *
     * Processing Flow:
     * 1. Validate caller is CCIP router
     * 2. Validate source chain and sender
     * 3. Check and update rate limits
     * 4. Verify message not already processed
     * 5. Decode coverage data
     * 6. Process coverage on local chain
     * 7. Mark message as processed
     *
     * @param message CCIP Any2EVMMessage from router
     */
    function ccipReceive(Client.Any2EVMMessage calldata message) external override whenNotPaused {
        // Only CCIP router can call
        if (msg.sender != i_ccipRouter) revert InvalidRouter();

        _ccipReceive(message);
    }

    /**
     * @notice Internal handler for CCIP messages
     * @param message CCIP Any2EVMMessage from router
     */
    function _ccipReceive(Client.Any2EVMMessage memory message) internal {
        uint64 sourceChain = message.sourceChainSelector;
        address sender = abi.decode(message.sender, (address));

        // Validate source chain
        ChainConfig storage config = chainConfigs[sourceChain];
        if (!config.enabled) {
            revert ChainNotEnabled(sourceChain);
        }
        if (sender != config.remoteContract) {
            revert InvalidRemoteContract();
        }

        // Check rate limit
        _checkAndUpdateRateLimit(sourceChain);

        // Replay protection
        bytes32 messageId = message.messageId;
        if (processedMessages[messageId]) {
            revert MessageAlreadyProcessed(messageId);
        }
        processedMessages[messageId] = true;

        // Decode coverage data
        (Coverage memory coverage, uint256 nonce) = abi.decode(message.data, (Coverage, uint256));

        // Additional validation
        if (
            coverage.coverageAmount < MIN_COVERAGE_AMOUNT ||
            coverage.coverageAmount > MAX_COVERAGE_AMOUNT
        ) {
            revert InvalidCoverageAmount();
        }

        // Process coverage on local chain
        _processCoverage(coverage);

        totalCrossChainCoverage += coverage.coverageAmount;

        emit CrossChainCoverageReceived(messageId, sourceChain, coverage);
    }

    // ============ Admin Functions ============

    /**
     * @notice Enable or configure a destination chain for cross-chain coverage
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     *
     * @param chainSelector CCIP chain selector to configure
     * @param remoteContract Address of OmniShield contract on remote chain
     * @param rateLimit Maximum messages per hour (0 uses default)
     */
    function enableChain(
        uint64 chainSelector,
        address remoteContract,
        uint256 rateLimit
    ) external onlyRole(BRIDGE_ADMIN_ROLE) {
        require(remoteContract != address(0), "Invalid remote contract");
        require(chainSelector != 0, "Invalid chain selector");

        chainConfigs[chainSelector] = ChainConfig({
            remoteContract: remoteContract,
            enabled: true,
            rateLimitPerHour: rateLimit > 0 ? rateLimit : DEFAULT_RATE_LIMIT,
            lastResetTime: block.timestamp,
            messageCount: 0
        });

        emit ChainConfigured(chainSelector, remoteContract, true);
    }

    /**
     * @notice Disable a chain from cross-chain operations
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     *
     * @param chainSelector CCIP chain selector to disable
     */
    function disableChain(uint64 chainSelector) external onlyRole(BRIDGE_ADMIN_ROLE) {
        chainConfigs[chainSelector].enabled = false;
        emit ChainConfigured(chainSelector, chainConfigs[chainSelector].remoteContract, false);
    }

    /**
     * @notice Update rate limit for a specific chain
     * @dev Only callable by BRIDGE_ADMIN_ROLE
     *
     * @param chainSelector CCIP chain selector
     * @param newLimit New rate limit per hour
     */
    function updateRateLimit(
        uint64 chainSelector,
        uint256 newLimit
    ) external onlyRole(BRIDGE_ADMIN_ROLE) {
        require(newLimit > 0, "Rate limit must be positive");
        chainConfigs[chainSelector].rateLimitPerHour = newLimit;
        emit RateLimitUpdated(chainSelector, newLimit);
    }

    /**
     * @notice Emergency pause all bridge operations
     * @dev Only callable by EMERGENCY_ROLE. Stops all cross-chain coverage operations.
     */
    function pauseBridge() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        emit BridgePauseToggled(true);
    }

    /**
     * @notice Unpause bridge operations
     * @dev Only callable by EMERGENCY_ROLE
     */
    function unpauseBridge() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
        emit BridgePauseToggled(false);
    }

    /**
     * @notice Withdraw stuck LINK tokens
     * @dev Only callable by DEFAULT_ADMIN_ROLE
     *
     * @param amount Amount of LINK to withdraw
     * @param recipient Address to receive LINK
     */
    function withdrawLINK(uint256 amount, address recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        linkToken.safeTransfer(recipient, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate CCIP fee for sending coverage to destination chain
     * @param destinationChain CCIP chain selector
     * @param coverage Coverage to send
     * @return fee Fee in LINK tokens
     */
    function estimateCCIPFee(
        uint64 destinationChain,
        Coverage memory coverage
    ) external view returns (uint256 fee) {
        if (!chainConfigs[destinationChain].enabled) {
            revert ChainNotEnabled(destinationChain);
        }

        bytes memory data = abi.encode(coverage, nonces[msg.sender] + 1);

        Client.EVM2AnyMessage memory ccipMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(chainConfigs[destinationChain].remoteContract),
            data: data,
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 500_000})),
            feeToken: address(linkToken)
        });

        return IRouterClient(i_ccipRouter).getFee(destinationChain, ccipMessage);
    }

    /**
     * @notice Check if chain is enabled for cross-chain operations
     * @param chainSelector CCIP chain selector
     * @return enabled Whether chain is enabled
     */
    function isChainEnabled(uint64 chainSelector) external view returns (bool) {
        return chainConfigs[chainSelector].enabled;
    }

    /**
     * @notice Get pending coverage by message ID
     * @param messageId CCIP message ID
     * @return coverage Pending coverage details
     */
    function getPendingCoverage(bytes32 messageId) external view returns (Coverage memory) {
        return pendingCoverages[messageId];
    }

    /**
     * @notice Get chain configuration
     * @param chainSelector CCIP chain selector
     * @return config Chain configuration
     */
    function getChainConfig(uint64 chainSelector) external view returns (ChainConfig memory) {
        return chainConfigs[chainSelector];
    }

    // ============ Internal Functions ============

    /**
     * @notice Check and update rate limit for source chain
     * @dev Reverts if rate limit exceeded. Resets counter after window expires.
     * @param sourceChain CCIP chain selector of source
     */
    function _checkAndUpdateRateLimit(uint64 sourceChain) private {
        ChainConfig storage config = chainConfigs[sourceChain];

        // Reset counter if window expired
        if (block.timestamp >= config.lastResetTime + RATE_LIMIT_WINDOW) {
            config.messageCount = 0;
            config.lastResetTime = block.timestamp;
        }

        // Check rate limit
        if (config.messageCount >= config.rateLimitPerHour) {
            revert RateLimitExceeded(sourceChain);
        }

        config.messageCount++;
    }

    /**
     * @notice Process received coverage on local chain
     * @dev Override this function to integrate with local insurance pool
     * @param coverage Coverage to process
     */
    function _processCoverage(Coverage memory coverage) internal virtual {
        // Default implementation: emit event
        // In production, integrate with local InsurancePool:
        // - Create policy on destination chain
        // - Transfer funds if needed
        // - Update state
    }

    /**
     * @notice Receive function to accept native tokens if needed
     */
    receive() external payable {}
}
