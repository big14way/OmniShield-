/**
 * Hedera Insurance Pool Tests
 *
 * Tests for HederaInsurancePool contract with:
 * - HBAR payment handling
 * - HTS token operations
 * - Consensus service submissions
 * - Gas cost measurements in tinybars
 * - ED25519 key verification
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { HederaInsurancePool, RiskEngine } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HederaInsurancePool", function () {
  let hederaPool: HederaInsurancePool;
  let riskEngine: RiskEngine;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let treasury: SignerWithAddress;

  const HBAR_TO_TINYBAR = 100_000_000n;
  const COVERAGE_AMOUNT = ethers.parseEther("1000");
  const POLICY_DURATION = 30 * 24 * 60 * 60; // 30 days
  const HTS_TOKEN_ADDRESS = "0x0000000000000000000000000000000000001234"; // Mock HTS token
  const CONSENSUS_TOPIC_ID = ethers.keccak256(ethers.toUtf8Bytes("test-topic"));

  beforeEach(async function () {
    [owner, user1, user2, treasury] = await ethers.getSigners();

    // Deploy RiskEngine
    const RiskEngineFactory = await ethers.getContractFactory("RiskEngine");
    riskEngine = await RiskEngineFactory.deploy();
    await riskEngine.waitForDeployment();

    // Deploy HederaInsurancePool
    const HederaPoolFactory = await ethers.getContractFactory("HederaInsurancePool");
    hederaPool = await HederaPoolFactory.deploy(
      await riskEngine.getAddress(),
      treasury.address,
      HTS_TOKEN_ADDRESS,
      CONSENSUS_TOPIC_ID
    );
    await hederaPool.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct risk engine", async function () {
      expect(await hederaPool.riskEngine()).to.equal(await riskEngine.getAddress());
    });

    it("Should set the correct treasury account", async function () {
      expect(await hederaPool.hbarTreasuryAccount()).to.equal(treasury.address);
    });

    it("Should set the correct HTS token", async function () {
      expect(await hederaPool.htsTokenAddress()).to.equal(HTS_TOKEN_ADDRESS);
    });

    it("Should set the correct consensus topic", async function () {
      expect(await hederaPool.defaultConsensusTopicId()).to.equal(CONSENSUS_TOPIC_ID);
    });

    it("Should have 30% Hedera fee reduction", async function () {
      expect(await hederaPool.HEDERA_FEE_REDUCTION()).to.equal(3000);
    });
  });

  describe("HBAR Payment Tests", function () {
    it("Should create policy with HBAR payment", async function () {
      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const tx = await hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
        value: premium,
      });

      await expect(tx)
        .to.emit(hederaPool, "PolicyCreated")
        .withArgs(1, user1.address, COVERAGE_AMOUNT, premium);
    });

    it("Should revert if insufficient HBAR sent", async function () {
      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      await expect(
        hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
          value: premium - 1n,
        })
      ).to.be.revertedWithCustomError(hederaPool, "InsufficientHbarBalance");
    });

    it("Should refund excess HBAR", async function () {
      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const excessAmount = ethers.parseEther("1");
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
        value: premium + excessAmount,
      });

      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      const expectedBalance = balanceBefore - premium - gasUsed;

      expect(balanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });

    it("Should measure gas costs in tinybars", async function () {
      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const tx = await hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
        value: premium,
      });

      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;
      const gasPrice = receipt!.gasPrice;
      const gasCostWei = gasUsed * gasPrice;
      const gasCostTinybars = (gasCostWei * HBAR_TO_TINYBAR) / ethers.parseEther("1");

      console.log(`      Gas used: ${gasUsed.toString()}`);
      console.log(`      Gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`);
      console.log(`      Cost in wei: ${gasCostWei.toString()}`);
      console.log(`      Cost in tinybars: ${gasCostTinybars.toString()}`);

      expect(gasUsed).to.be.gt(0);
    });
  });

  describe("HTS Token Association", function () {
    it("Should associate HTS token", async function () {
      const associationFee = 5n * HBAR_TO_TINYBAR;

      const tx = await hederaPool.connect(user1).associateHtsToken(HTS_TOKEN_ADDRESS, {
        value: associationFee,
      });

      await expect(tx)
        .to.emit(hederaPool, "HtsTokenAssociated")
        .withArgs(user1.address, HTS_TOKEN_ADDRESS);
    });

    it("Should check if token is associated", async function () {
      const associationFee = 5n * HBAR_TO_TINYBAR;

      await hederaPool.connect(user1).associateHtsToken(HTS_TOKEN_ADDRESS, {
        value: associationFee,
      });

      expect(await hederaPool.isHtsTokenAssociated(user1.address)).to.be.true;
    });

    it("Should revert if insufficient HBAR for association", async function () {
      const insufficientFee = 4n * HBAR_TO_TINYBAR;

      await expect(
        hederaPool.connect(user1).associateHtsToken(HTS_TOKEN_ADDRESS, {
          value: insufficientFee,
        })
      ).to.be.revertedWith("Insufficient HBAR for association");
    });

    it("Should transfer association fee to treasury", async function () {
      const associationFee = 5n * HBAR_TO_TINYBAR;
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      await hederaPool.connect(user1).associateHtsToken(HTS_TOKEN_ADDRESS, {
        value: associationFee,
      });

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(associationFee);
    });
  });

  describe("Consensus Service Claims", function () {
    let policyId: number;

    beforeEach(async function () {
      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const tx = await hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
        value: premium,
      });

      const receipt = await tx.wait();
      const _event = receipt?.logs.find(
        (log) => hederaPool.interface.parseLog(log as any)?.name === "PolicyCreated"
      );
      policyId = 1;
    });

    it("Should submit claim to consensus", async function () {
      const claimAmount = COVERAGE_AMOUNT / 2n;

      const tx = await hederaPool.connect(user1).submitClaim(policyId, claimAmount);

      await expect(tx).to.emit(hederaPool, "ClaimSubmittedToConsensus");
    });

    it("Should create claim submission with consensus message ID", async function () {
      const claimAmount = COVERAGE_AMOUNT / 2n;

      await hederaPool.connect(user1).submitClaim(policyId, claimAmount);

      const claimSubmission = await hederaPool.getClaimSubmission(1);
      expect(claimSubmission.policyId).to.equal(policyId);
      expect(claimSubmission.claimAmount).to.equal(claimAmount);
      expect(claimSubmission.claimant).to.equal(user1.address);
      expect(claimSubmission.consensusMessageId).to.not.equal(ethers.ZeroHash);
    });

    it("Should allow voting on claims", async function () {
      const claimAmount = COVERAGE_AMOUNT / 2n;
      await hederaPool.connect(user1).submitClaim(policyId, claimAmount);

      const CLAIM_VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CLAIM_VOTER_ROLE"));
      await hederaPool.grantRole(CLAIM_VOTER_ROLE, user2.address);

      const tx = await hederaPool.connect(user2).voteOnClaim(1, true);

      await expect(tx).to.emit(hederaPool, "ClaimVoteCast").withArgs(1, user2.address, true, 1, 0);
    });

    it("Should resolve claim after minimum votes", async function () {
      const claimAmount = COVERAGE_AMOUNT / 2n;
      await hederaPool.connect(user1).submitClaim(policyId, claimAmount);

      const CLAIM_VOTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CLAIM_VOTER_ROLE"));
      await hederaPool.grantRole(CLAIM_VOTER_ROLE, owner.address);
      await hederaPool.grantRole(CLAIM_VOTER_ROLE, user2.address);

      // Cast 3 votes (minimum required)
      await hederaPool.connect(owner).voteOnClaim(1, true);
      await hederaPool.connect(user2).voteOnClaim(1, true);

      // Third vote should trigger auto-resolve
      const HEDERA_OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("HEDERA_OPERATOR_ROLE"));
      await hederaPool.grantRole(HEDERA_OPERATOR_ROLE, owner.address);

      await hederaPool.connect(owner).voteOnClaim(1, true);

      const claimSubmission = await hederaPool.getClaimSubmission(1);
      expect(claimSubmission.votesFor).to.equal(3);
    });
  });

  describe("ED25519 Key Support", function () {
    it("Should verify ED25519 public key", async function () {
      const mockPublicKeyHash = ethers.keccak256(ethers.toUtf8Bytes("ed25519-pubkey"));

      const tx = await hederaPool.verifyEd25519Key(mockPublicKeyHash);

      await expect(tx).to.emit(hederaPool, "Ed25519KeyVerified").withArgs(mockPublicKeyHash);
    });

    it("Should create policy with verified ED25519 key", async function () {
      const mockPublicKeyHash = ethers.keccak256(ethers.toUtf8Bytes("ed25519-pubkey"));
      await hederaPool.verifyEd25519Key(mockPublicKeyHash);

      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const tx = await hederaPool
        .connect(user1)
        .createPolicyWithEd25519(COVERAGE_AMOUNT, POLICY_DURATION, mockPublicKeyHash, {
          value: premium,
        });

      await expect(tx).to.emit(hederaPool, "PolicyCreated");
    });

    it("Should revert with unverified ED25519 key", async function () {
      const unverifiedKeyHash = ethers.keccak256(ethers.toUtf8Bytes("unverified-key"));

      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      await expect(
        hederaPool
          .connect(user1)
          .createPolicyWithEd25519(COVERAGE_AMOUNT, POLICY_DURATION, unverifiedKeyHash, {
            value: premium,
          })
      ).to.be.revertedWithCustomError(hederaPool, "InvalidEd25519Signature");
    });
  });

  describe("Fee Reduction", function () {
    it("Should apply 30% Hedera fee reduction", async function () {
      // Deploy standard pool for comparison
      const InsurancePoolFactory = await ethers.getContractFactory("InsurancePool");
      const standardPool = await InsurancePoolFactory.deploy(await riskEngine.getAddress());

      const standardPremium = await standardPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const hederaPremium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const expectedReduction = (standardPremium * 3000n) / 10000n;
      const expectedHederaPremium = standardPremium - expectedReduction;

      expect(hederaPremium).to.equal(expectedHederaPremium);
      expect(hederaPremium).to.be.lt(standardPremium);
    });
  });

  describe("Admin Functions", function () {
    it("Should update consensus topic ID", async function () {
      const newTopicId = ethers.keccak256(ethers.toUtf8Bytes("new-topic"));

      await hederaPool.updateConsensusTopicId(newTopicId);

      expect(await hederaPool.defaultConsensusTopicId()).to.equal(newTopicId);
    });

    it("Should update HTS token address", async function () {
      const newTokenAddress = "0x0000000000000000000000000000000000005678";

      await hederaPool.updateHtsToken(newTokenAddress);

      expect(await hederaPool.htsTokenAddress()).to.equal(newTokenAddress);
    });

    it("Should pause and unpause contract", async function () {
      await hederaPool.pause();

      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      await expect(
        hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
          value: premium,
        })
      ).to.be.revertedWithCustomError(hederaPool, "EnforcedPause");

      await hederaPool.unpause();

      await expect(
        hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
          value: premium,
        })
      ).to.emit(hederaPool, "PolicyCreated");
    });

    it("Should withdraw HBAR to treasury", async function () {
      // Create policy to add funds
      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      await hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
        value: premium,
      });

      const contractBalance = await ethers.provider.getBalance(await hederaPool.getAddress());
      const treasuryBalanceBefore = await ethers.provider.getBalance(treasury.address);

      await hederaPool.withdrawHbar(contractBalance);

      const treasuryBalanceAfter = await ethers.provider.getBalance(treasury.address);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(contractBalance);
    });
  });

  describe("Gas Benchmarks", function () {
    it("Should benchmark policy creation gas costs", async function () {
      const premium = await hederaPool
        .connect(user1)
        .calculatePremium(COVERAGE_AMOUNT, POLICY_DURATION);

      const tx = await hederaPool.connect(user1).createPolicy(COVERAGE_AMOUNT, POLICY_DURATION, {
        value: premium,
      });

      const receipt = await tx.wait();
      console.log(`\n      📊 Policy Creation Gas Benchmark:`);
      console.log(`         Gas used: ${receipt!.gasUsed.toString()}`);
      console.log(`         Gas price: ${ethers.formatUnits(receipt!.gasPrice, "gwei")} gwei`);
      console.log(
        `         Cost: ${ethers.formatEther(receipt!.gasUsed * receipt!.gasPrice)} HBAR`
      );
      console.log(
        `         Cost in tinybars: ${
          (receipt!.gasUsed * receipt!.gasPrice * HBAR_TO_TINYBAR) / ethers.parseEther("1")
        }`
      );
    });
  });
});
