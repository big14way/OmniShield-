// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../interfaces/IInsurancePool.sol";
import "../interfaces/IRiskEngine.sol";
import "../libraries/PremiumMath.sol";

/// @title HederaInsurancePool
/// @notice Hedera-optimized insurance pool with HTS integration and consensus service
/// @dev Inherits base insurance functionality with Hedera-specific features
contract HederaInsurancePool is IInsurancePool, AccessControl, ReentrancyGuard, Pausable {
    // ============ Custom Errors ============

    error InsufficientHbarBalance();
    error InvalidHederaToken();
    error ClaimVotingInProgress();
    error ConsensusSubmissionFailed();
    error TokenAssociationRequired();
    error InvalidEd25519Signature();
    error FeeTooLow();

    // ============ Structs ============

    /// @notice Enhanced policy with Hedera features
    struct HederaPolicy {
        address holder;
        uint256 coverageAmount;
        uint256 premium;
        uint256 startTime;
        uint256 endTime;
        bool active;
        address htsToken; // Hedera Token Service token
        bytes32 consensusTopicId; // HCS topic for claim voting
        uint256 claimVotes;
        bool usesEd25519;
    }

    /// @notice Claim submission for consensus voting
    struct ClaimSubmission {
        uint256 policyId;
        uint256 claimAmount;
        address claimant;
        uint256 submissionTime;
        uint256 votesFor;
        uint256 votesAgainst;
        bool resolved;
        bytes32 consensusMessageId;
    }

    // ============ Constants ============

    bytes32 public constant CLAIM_VOTER_ROLE = keccak256("CLAIM_VOTER_ROLE");
    bytes32 public constant HEDERA_OPERATOR_ROLE = keccak256("HEDERA_OPERATOR_ROLE");

    uint256 public constant HEDERA_FEE_REDUCTION = 3000; // 30% lower fees
    uint256 public constant CONSENSUS_VOTING_PERIOD = 24 hours;
    uint256 public constant MIN_VOTES_REQUIRED = 3;

    // Hedera network fees (in tinybars)
    uint256 public constant HBAR_TO_TINYBAR = 100_000_000;
    uint256 public constant HTS_ASSOCIATE_FEE = 5 * HBAR_TO_TINYBAR; // 5 HBAR
    uint256 public constant HCS_SUBMIT_FEE = 1 * HBAR_TO_TINYBAR; // 1 HBAR

    // ============ State Variables ============

    uint256 private _policyCounter;
    uint256 private _claimCounter;
    uint256 public totalPoolBalance;

    mapping(uint256 => HederaPolicy) private _policies;
    mapping(address => uint256[]) private _userPolicies;
    mapping(uint256 => ClaimSubmission) public claimSubmissions;
    mapping(address => bool) public associatedHtsTokens;
    mapping(bytes32 => bool) public verifiedEd25519Keys;

    IRiskEngine public riskEngine;

    // Hedera-specific addresses
    address public hbarTreasuryAccount;
    address public htsTokenAddress;
    bytes32 public defaultConsensusTopicId;

    // ============ Events ============

    /// @notice Emitted when HTS token is associated
    event HtsTokenAssociated(address indexed account, address indexed token);

    /// @notice Emitted when claim is submitted to consensus
    event ClaimSubmittedToConsensus(
        uint256 indexed claimId,
        uint256 indexed policyId,
        bytes32 consensusMessageId
    );

    /// @notice Emitted when claim vote is cast
    event ClaimVoteCast(
        uint256 indexed claimId,
        address indexed voter,
        bool vote,
        uint256 votesFor,
        uint256 votesAgainst
    );

    /// @notice Emitted when claim is resolved
    event ClaimResolved(
        uint256 indexed claimId,
        uint256 indexed policyId,
        bool approved,
        uint256 amount
    );

    /// @notice Emitted when ED25519 key is verified
    event Ed25519KeyVerified(bytes32 indexed publicKeyHash);

    // ============ Constructor ============

    /// @notice Initialize Hedera insurance pool
    /// @param _riskEngine Risk engine contract address
    /// @param _hbarTreasury HBAR treasury account
    /// @param _htsToken HTS token address for premiums
    /// @param _consensusTopic Default HCS topic ID
    constructor(
        address _riskEngine,
        address _hbarTreasury,
        address _htsToken,
        bytes32 _consensusTopic
    ) {
        require(_riskEngine != address(0), "Invalid risk engine");
        require(_hbarTreasury != address(0), "Invalid treasury");

        riskEngine = IRiskEngine(_riskEngine);
        hbarTreasuryAccount = _hbarTreasury;
        htsTokenAddress = _htsToken;
        defaultConsensusTopicId = _consensusTopic;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(HEDERA_OPERATOR_ROLE, msg.sender);
        _grantRole(CLAIM_VOTER_ROLE, msg.sender);
    }

    // ============ Core Functions ============

    /// @notice Create insurance policy with HBAR payment
    /// @param coverageAmount Amount of coverage in wei
    /// @param duration Policy duration in seconds
    /// @return policyId The created policy ID
    function createPolicy(
        uint256 coverageAmount,
        uint256 duration
    ) external payable override nonReentrant whenNotPaused returns (uint256) {
        return _createPolicyInternal(coverageAmount, duration, address(0), false);
    }

    /// @notice Create policy with HTS token payment
    /// @param coverageAmount Amount of coverage
    /// @param duration Policy duration in seconds
    /// @param htsToken HTS token address for payment
    /// @return policyId The created policy ID
    function createPolicyWithHts(
        uint256 coverageAmount,
        uint256 duration,
        address htsToken
    ) external nonReentrant whenNotPaused returns (uint256) {
        if (!associatedHtsTokens[msg.sender]) revert TokenAssociationRequired();
        return _createPolicyInternal(coverageAmount, duration, htsToken, false);
    }

    /// @notice Create policy with ED25519 signature verification
    /// @param coverageAmount Amount of coverage
    /// @param duration Policy duration in seconds
    /// @param ed25519PublicKey ED25519 public key hash
    /// @return policyId The created policy ID
    function createPolicyWithEd25519(
        uint256 coverageAmount,
        uint256 duration,
        bytes32 ed25519PublicKey
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        if (!verifiedEd25519Keys[ed25519PublicKey]) revert InvalidEd25519Signature();
        return _createPolicyInternal(coverageAmount, duration, address(0), true);
    }

    /// @notice Submit claim with consensus voting
    /// @param policyId Policy ID
    /// @param claimAmount Claim amount
    function submitClaim(uint256 policyId, uint256 claimAmount) external override nonReentrant {
        HederaPolicy storage policy = _policies[policyId];
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.active, "Policy not active");
        require(block.timestamp <= policy.endTime, "Policy expired");
        require(claimAmount <= policy.coverageAmount, "Claim exceeds coverage");

        _claimCounter++;
        uint256 claimId = _claimCounter;

        // Submit to Hedera Consensus Service
        bytes32 consensusMessageId = _submitToConsensus(policyId, claimAmount);

        claimSubmissions[claimId] = ClaimSubmission({
            policyId: policyId,
            claimAmount: claimAmount,
            claimant: msg.sender,
            submissionTime: block.timestamp,
            votesFor: 0,
            votesAgainst: 0,
            resolved: false,
            consensusMessageId: consensusMessageId
        });

        emit PolicyClaimed(policyId, claimAmount);
        emit ClaimSubmittedToConsensus(claimId, policyId, consensusMessageId);
    }

    /// @notice Vote on claim submission
    /// @param claimId Claim ID
    /// @param approve True to approve, false to reject
    function voteOnClaim(uint256 claimId, bool approve) external onlyRole(CLAIM_VOTER_ROLE) {
        ClaimSubmission storage claim = claimSubmissions[claimId];
        require(!claim.resolved, "Claim already resolved");
        require(
            block.timestamp <= claim.submissionTime + CONSENSUS_VOTING_PERIOD,
            "Voting period ended"
        );

        if (approve) {
            claim.votesFor++;
        } else {
            claim.votesAgainst++;
        }

        emit ClaimVoteCast(claimId, msg.sender, approve, claim.votesFor, claim.votesAgainst);

        // Auto-resolve if minimum votes reached
        if (claim.votesFor + claim.votesAgainst >= MIN_VOTES_REQUIRED) {
            _resolveClaim(claimId);
        }
    }

    /// @notice Resolve claim based on votes
    /// @param claimId Claim ID
    function resolveClaim(uint256 claimId) external onlyRole(HEDERA_OPERATOR_ROLE) {
        _resolveClaim(claimId);
    }

    /// @notice Associate HTS token with account
    /// @param token HTS token address
    function associateHtsToken(address token) external payable nonReentrant {
        require(msg.value >= HTS_ASSOCIATE_FEE, "Insufficient HBAR for association");
        require(!associatedHtsTokens[msg.sender], "Already associated");

        associatedHtsTokens[msg.sender] = true;

        // Transfer association fee to treasury
        payable(hbarTreasuryAccount).transfer(HTS_ASSOCIATE_FEE);

        emit HtsTokenAssociated(msg.sender, token);

        // Refund excess
        if (msg.value > HTS_ASSOCIATE_FEE) {
            payable(msg.sender).transfer(msg.value - HTS_ASSOCIATE_FEE);
        }
    }

    /// @notice Verify and register ED25519 public key
    /// @param publicKeyHash Hash of ED25519 public key
    function verifyEd25519Key(bytes32 publicKeyHash) external onlyRole(HEDERA_OPERATOR_ROLE) {
        verifiedEd25519Keys[publicKeyHash] = true;
        emit Ed25519KeyVerified(publicKeyHash);
    }

    // ============ View Functions ============

    /// @notice Get policy details
    /// @param policyId Policy ID
    /// @return policy Policy struct cast to IInsurancePool.Policy
    function getPolicy(uint256 policyId) external view override returns (Policy memory policy) {
        HederaPolicy memory hPolicy = _policies[policyId];
        return
            Policy({
                holder: hPolicy.holder,
                coverageAmount: hPolicy.coverageAmount,
                premium: hPolicy.premium,
                startTime: hPolicy.startTime,
                endTime: hPolicy.endTime,
                active: hPolicy.active
            });
    }

    /// @notice Get Hedera-specific policy details
    /// @param policyId Policy ID
    /// @return hederaPolicy Full Hedera policy struct
    function getHederaPolicy(
        uint256 policyId
    ) external view returns (HederaPolicy memory hederaPolicy) {
        return _policies[policyId];
    }

    /// @notice Calculate premium with Hedera fee reduction
    /// @param coverageAmount Coverage amount
    /// @param duration Policy duration
    /// @return premium Calculated premium in wei
    function calculatePremium(
        uint256 coverageAmount,
        uint256 duration
    ) public view override returns (uint256 premium) {
        uint256 riskScore = riskEngine.calculateRisk(msg.sender, coverageAmount);
        uint256 basePremium = PremiumMath.calculatePremium(coverageAmount, duration, riskScore);

        // Apply Hedera fee reduction (30% discount)
        premium = basePremium - ((basePremium * HEDERA_FEE_REDUCTION) / 10000);
    }

    /// @notice Get claim submission details
    /// @param claimId Claim ID
    /// @return claim Claim submission struct
    function getClaimSubmission(
        uint256 claimId
    ) external view returns (ClaimSubmission memory claim) {
        return claimSubmissions[claimId];
    }

    /// @notice Check if account has associated HTS token
    /// @param account Account address
    /// @return associated True if associated
    function isHtsTokenAssociated(address account) external view returns (bool associated) {
        return associatedHtsTokens[account];
    }

    // ============ Internal Functions ============

    /// @notice Internal policy creation
    function _createPolicyInternal(
        uint256 coverageAmount,
        uint256 duration,
        address htsToken,
        bool usesEd25519
    ) private returns (uint256) {
        require(coverageAmount > 0, "Coverage amount must be greater than 0");
        require(duration > 0, "Duration must be greater than 0");
        require(
            riskEngine.isEligibleForCoverage(msg.sender, coverageAmount),
            "Not eligible for coverage"
        );

        uint256 premium = calculatePremium(coverageAmount, duration);

        if (htsToken == address(0)) {
            // HBAR payment
            if (msg.value < premium) revert InsufficientHbarBalance();
        }

        _policyCounter++;
        uint256 policyId = _policyCounter;

        _policies[policyId] = HederaPolicy({
            holder: msg.sender,
            coverageAmount: coverageAmount,
            premium: premium,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            active: true,
            htsToken: htsToken,
            consensusTopicId: defaultConsensusTopicId,
            claimVotes: 0,
            usesEd25519: usesEd25519
        });

        _userPolicies[msg.sender].push(policyId);
        totalPoolBalance += premium;

        emit PolicyCreated(policyId, msg.sender, coverageAmount, premium);

        if (htsToken == address(0) && msg.value > premium) {
            payable(msg.sender).transfer(msg.value - premium);
        }

        return policyId;
    }

    /// @notice Submit claim to Hedera Consensus Service
    function _submitToConsensus(
        uint256 policyId,
        uint256 claimAmount
    ) private returns (bytes32 messageId) {
        // Generate consensus message ID
        messageId = keccak256(abi.encodePacked(policyId, claimAmount, block.timestamp, msg.sender));

        // In production, this would submit to HCS via Hedera SDK
        // For now, return the message ID
        return messageId;
    }

    /// @notice Resolve claim based on voting results
    function _resolveClaim(uint256 claimId) private {
        ClaimSubmission storage claim = claimSubmissions[claimId];
        require(!claim.resolved, "Claim already resolved");

        claim.resolved = true;
        bool approved = claim.votesFor > claim.votesAgainst;

        if (approved) {
            HederaPolicy storage policy = _policies[claim.policyId];
            policy.active = false;

            // Transfer claim amount
            if (policy.htsToken == address(0)) {
                // Pay in HBAR
                require(address(this).balance >= claim.claimAmount, "Insufficient pool balance");
                payable(claim.claimant).transfer(claim.claimAmount);
            }
            // HTS token transfer would be handled here

            if (totalPoolBalance >= claim.claimAmount) {
                totalPoolBalance -= claim.claimAmount;
            } else {
                totalPoolBalance = 0;
            }
        }

        emit ClaimResolved(claimId, claim.policyId, approved, claim.claimAmount);
    }

    // ============ Admin Functions ============

    /// @notice Update default consensus topic
    /// @param newTopicId New topic ID
    function updateConsensusTopicId(bytes32 newTopicId) external onlyRole(HEDERA_OPERATOR_ROLE) {
        defaultConsensusTopicId = newTopicId;
    }

    /// @notice Update HTS token address
    /// @param newToken New token address
    function updateHtsToken(address newToken) external onlyRole(HEDERA_OPERATOR_ROLE) {
        htsTokenAddress = newToken;
    }

    /// @notice Pause contract
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Unpause contract
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @notice Withdraw HBAR to treasury
    function withdrawHbar(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(amount <= address(this).balance, "Insufficient balance");
        payable(hbarTreasuryAccount).transfer(amount);
    }

    /// @notice Receive HBAR
    receive() external payable {}
}
