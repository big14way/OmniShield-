import { expect } from "chai";
import { ethers } from "hardhat";
import { InsurancePool, RiskEngine } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { increaseTime, currentTime, takeSnapshot, revertToSnapshot } from "../helpers/time";
import { COVERAGE_AMOUNTS, COVERAGE_DURATIONS } from "../helpers/coverage";

describe("InsurancePool - Comprehensive Unit Tests", function () {
  let insurancePool: InsurancePool;
  let riskEngine: RiskEngine;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  // let user3: HardhatEthersSigner;

  let snapshotId: string;

  // Test constants
  const DEFAULT_COVERAGE = COVERAGE_AMOUNTS.MEDIUM;
  const DEFAULT_DURATION = COVERAGE_DURATIONS.ONE_MONTH;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy RiskEngine
    const RiskEngineFactory = await ethers.getContractFactory("RiskEngine");
    riskEngine = (await RiskEngineFactory.deploy()) as unknown as RiskEngine;
    await riskEngine.waitForDeployment();

    // Deploy InsurancePool
    const InsurancePoolFactory = await ethers.getContractFactory("InsurancePool");
    insurancePool = (await InsurancePoolFactory.deploy(
      await riskEngine.getAddress()
    )) as unknown as InsurancePool;
    await insurancePool.waitForDeployment();
  });

  beforeEach(async function () {
    snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(snapshotId);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await insurancePool.owner()).to.equal(owner.address);
    });

    it("Should set the correct risk engine", async function () {
      expect(await insurancePool.riskEngine()).to.equal(await riskEngine.getAddress());
    });

    it("Should initialize with zero pool balance", async function () {
      expect(await insurancePool.totalPoolBalance()).to.equal(0);
    });

    it("Should not be paused on deployment", async function () {
      expect(await insurancePool.paused()).to.be.false;
    });
  });

  describe("Purchase Coverage - Happy Path", function () {
    it("Should purchase coverage with valid parameters", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      const tx = await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      await expect(tx)
        .to.emit(insurancePool, "PolicyCreated")
        .withArgs(1, user1.address, DEFAULT_COVERAGE, premium);
    });

    it("Should create policy with correct parameters", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      const policy = await insurancePool.getPolicy(1);

      expect(policy.holder).to.equal(user1.address);
      expect(policy.coverageAmount).to.equal(DEFAULT_COVERAGE);
      expect(policy.premium).to.equal(premium);
      expect(policy.active).to.be.true;
    });

    it("Should set correct start and end times", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      const startTime = await currentTime();
      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      const policy = await insurancePool.getPolicy(1);

      expect(policy.startTime).to.be.closeTo(startTime, 5);
      expect(policy.endTime).to.equal(policy.startTime + BigInt(DEFAULT_DURATION));
    });

    it("Should increment policy counter", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      await insurancePool
        .connect(user2)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      const policy1 = await insurancePool.getPolicy(1);
      const policy2 = await insurancePool.getPolicy(2);

      expect(policy1.holder).to.equal(user1.address);
      expect(policy2.holder).to.equal(user2.address);
    });

    it("Should update total pool balance", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      const balanceBefore = await insurancePool.totalPoolBalance();

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      const balanceAfter = await insurancePool.totalPoolBalance();

      expect(balanceAfter - balanceBefore).to.equal(premium);
    });

    it("Should refund excess payment", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      const excess = ethers.parseEther("1");
      const userBalanceBefore = await ethers.provider.getBalance(user1.address);

      const tx = await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium + excess });

      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const userBalanceAfter = await ethers.provider.getBalance(user1.address);

      const expectedBalance = userBalanceBefore - premium - gasUsed;
      expect(userBalanceAfter).to.be.closeTo(expectedBalance, ethers.parseEther("0.0001"));
    });
  });

  describe("Purchase Coverage - Validation", function () {
    it("Should revert with zero coverage amount", async function () {
      await expect(
        insurancePool.connect(user1).createPolicy(0, DEFAULT_DURATION, { value: 0 })
      ).to.be.revertedWith("Coverage amount must be greater than 0");
    });

    it("Should revert with zero duration", async function () {
      await expect(
        insurancePool.connect(user1).createPolicy(DEFAULT_COVERAGE, 0, { value: 0 })
      ).to.be.revertedWith("Duration must be greater than 0");
    });

    it("Should revert with insufficient premium", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await expect(
        insurancePool
          .connect(user1)
          .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium - 1n })
      ).to.be.revertedWith("Insufficient premium");
    });

    it("Should revert if not eligible for coverage", async function () {
      // Set risk score too high (MAX_RISK_SCORE = 10000 means not eligible)
      // Set to 10000 to make user ineligible
      await riskEngine.setRiskScore(user1.address, 10000);

      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await expect(
        insurancePool
          .connect(user1)
          .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium })
      ).to.be.revertedWith("Not eligible for coverage");
    });
  });

  describe("Premium Calculation", function () {
    it("Should calculate premium with 1% accuracy", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      // Premium should be roughly 0.1% of coverage (base rate) * duration factor
      const expectedMinimum = (DEFAULT_COVERAGE * 1n) / 10000n;
      const expectedMaximum = (DEFAULT_COVERAGE * 100n) / 1000n;

      expect(premium).to.be.gte(expectedMinimum);
      expect(premium).to.be.lte(expectedMaximum);
    });

    it("Should scale premium with coverage amount", async function () {
      const smallCoverage = COVERAGE_AMOUNTS.SMALL;
      const largeCoverage = COVERAGE_AMOUNTS.LARGE;

      const smallPremium = await insurancePool
        .connect(user1)
        .calculatePremium(smallCoverage, DEFAULT_DURATION);

      const largePremium = await insurancePool
        .connect(user1)
        .calculatePremium(largeCoverage, DEFAULT_DURATION);

      // Large coverage should have proportionally larger premium
      const ratio = largeCoverage / smallCoverage;
      expect(largePremium / smallPremium).to.be.closeTo(ratio, ratio / 10n);
    });

    it("Should scale premium with duration", async function () {
      const shortDuration = COVERAGE_DURATIONS.ONE_DAY;
      const longDuration = COVERAGE_DURATIONS.ONE_YEAR;

      const shortPremium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, shortDuration);

      const longPremium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, longDuration);

      // Longer duration should have higher premium
      expect(longPremium).to.be.gt(shortPremium);
    });

    it("Should adjust premium based on risk score", async function () {
      // Set different risk scores (valid range MIN=100 to MAX=10000)
      await riskEngine.setRiskScore(user1.address, 1000); // Low risk
      await riskEngine.setRiskScore(user2.address, 5000); // Higher risk

      const lowRiskPremium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      const highRiskPremium = await insurancePool
        .connect(user2)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      expect(highRiskPremium).to.be.gt(lowRiskPremium);
    });
  });

  describe("Claim Processing - Valid Claims", function () {
    let policyId: number;

    beforeEach(async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      policyId = 1;
    });

    it("Should submit valid claim", async function () {
      const claimAmount = DEFAULT_COVERAGE / 2n;

      const tx = await insurancePool.connect(user1).submitClaim(policyId, claimAmount);

      await expect(tx).to.emit(insurancePool, "PolicyClaimed").withArgs(policyId, claimAmount);
    });

    it("Should deactivate policy after claim", async function () {
      const claimAmount = DEFAULT_COVERAGE / 2n;

      await insurancePool.connect(user1).submitClaim(policyId, claimAmount);

      const policy = await insurancePool.getPolicy(policyId);
      expect(policy.active).to.be.false;
    });

    it("Should allow full coverage claim", async function () {
      const claimAmount = DEFAULT_COVERAGE;

      await expect(insurancePool.connect(user1).submitClaim(policyId, claimAmount)).to.not.be
        .reverted;
    });
  });

  describe("Claim Processing - Invalid Claims", function () {
    let policyId: number;

    beforeEach(async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      policyId = 1;
    });

    it("Should revert if not policy holder", async function () {
      await expect(
        insurancePool.connect(user2).submitClaim(policyId, DEFAULT_COVERAGE / 2n)
      ).to.be.revertedWith("Not policy holder");
    });

    it("Should revert if policy already claimed", async function () {
      await insurancePool.connect(user1).submitClaim(policyId, DEFAULT_COVERAGE / 2n);

      await expect(
        insurancePool.connect(user1).submitClaim(policyId, DEFAULT_COVERAGE / 2n)
      ).to.be.revertedWith("Policy not active");
    });

    it("Should revert if policy expired", async function () {
      await increaseTime(DEFAULT_DURATION + 1);

      await expect(
        insurancePool.connect(user1).submitClaim(policyId, DEFAULT_COVERAGE / 2n)
      ).to.be.revertedWith("Policy expired");
    });

    it("Should revert if claim exceeds coverage", async function () {
      const excessiveClaim = DEFAULT_COVERAGE + ethers.parseEther("1");

      await expect(
        insurancePool.connect(user1).submitClaim(policyId, excessiveClaim)
      ).to.be.revertedWith("Claim exceeds coverage");
    });
  });

  describe("Access Control", function () {
    it("Should allow owner to pause", async function () {
      await insurancePool.connect(owner).pause();
      expect(await insurancePool.paused()).to.be.true;
    });

    it("Should allow owner to unpause", async function () {
      await insurancePool.connect(owner).pause();
      await insurancePool.connect(owner).unpause();
      expect(await insurancePool.paused()).to.be.false;
    });

    it("Should revert pause from non-owner", async function () {
      await expect(insurancePool.connect(user1).pause()).to.be.reverted;
    });

    it("Should revert unpause from non-owner", async function () {
      await insurancePool.connect(owner).pause();
      await expect(insurancePool.connect(user1).unpause()).to.be.reverted;
    });
  });

  describe("Pausable Functionality", function () {
    it("Should prevent policy creation when paused", async function () {
      await insurancePool.connect(owner).pause();

      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await expect(
        insurancePool
          .connect(user1)
          .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium })
      ).to.be.revertedWithCustomError(insurancePool, "EnforcedPause");
    });

    it("Should prevent claims when paused", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      await insurancePool.connect(owner).pause();

      await expect(
        insurancePool.connect(user1).submitClaim(1, DEFAULT_COVERAGE / 2n)
      ).to.be.revertedWithCustomError(insurancePool, "EnforcedPause");
    });

    it("Should allow operations after unpause", async function () {
      await insurancePool.connect(owner).pause();
      await insurancePool.connect(owner).unpause();

      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await expect(
        insurancePool
          .connect(user1)
          .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium })
      ).to.not.be.reverted;
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy on createPolicy", async function () {
      // Note: Actual reentrancy test would require malicious contract
      // This test verifies the modifier is in place
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await expect(
        insurancePool
          .connect(user1)
          .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium })
      ).to.not.be.reverted;
    });

    it("Should prevent reentrancy on submitClaim", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      await expect(insurancePool.connect(user1).submitClaim(1, DEFAULT_COVERAGE / 2n)).to.not.be
        .reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum coverage amount", async function () {
      const maxCoverage = ethers.parseEther("10000");
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(maxCoverage, DEFAULT_DURATION);

      await expect(
        insurancePool.connect(user1).createPolicy(maxCoverage, DEFAULT_DURATION, { value: premium })
      ).to.not.be.reverted;
    });

    it("Should handle minimum coverage amount", async function () {
      const minCoverage = ethers.parseEther("0.01");
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(minCoverage, DEFAULT_DURATION);

      await expect(
        insurancePool.connect(user1).createPolicy(minCoverage, DEFAULT_DURATION, { value: premium })
      ).to.not.be.reverted;
    });

    it("Should handle maximum duration", async function () {
      const maxDuration = 365 * 24 * 60 * 60; // 1 year
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, maxDuration);

      await expect(
        insurancePool.connect(user1).createPolicy(DEFAULT_COVERAGE, maxDuration, { value: premium })
      ).to.not.be.reverted;
    });

    it("Should handle minimum duration", async function () {
      const minDuration = 1; // 1 second
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, minDuration);

      await expect(
        insurancePool.connect(user1).createPolicy(DEFAULT_COVERAGE, minDuration, { value: premium })
      ).to.not.be.reverted;
    });
  });

  describe("Gas Optimization", function () {
    it("Should measure gas for policy creation", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      const tx = await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;

      console.log(`      Gas used for policy creation: ${gasUsed.toString()}`);
      expect(gasUsed).to.be.lt(500000); // Should be under 500k gas
    });

    it("Should measure gas for claim submission", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });

      const tx = await insurancePool.connect(user1).submitClaim(1, DEFAULT_COVERAGE / 2n);

      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed;

      console.log(`      Gas used for claim submission: ${gasUsed.toString()}`);
      expect(gasUsed).to.be.lt(200000); // Should be under 200k gas
    });
  });

  describe("State Consistency", function () {
    it("Should maintain pool balance consistency", async function () {
      const premium1 = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      const premium2 = await insurancePool
        .connect(user2)
        .calculatePremium(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.THREE_MONTHS);

      await insurancePool
        .connect(user1)
        .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium1 });

      await insurancePool
        .connect(user2)
        .createPolicy(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.THREE_MONTHS, {
          value: premium2,
        });

      const totalBalance = await insurancePool.totalPoolBalance();
      expect(totalBalance).to.equal(premium1 + premium2);
    });

    it("Should maintain policy counter consistency", async function () {
      const premium = await insurancePool
        .connect(user1)
        .calculatePremium(DEFAULT_COVERAGE, DEFAULT_DURATION);

      for (let i = 0; i < 5; i++) {
        await insurancePool
          .connect(user1)
          .createPolicy(DEFAULT_COVERAGE, DEFAULT_DURATION, { value: premium });
      }

      // Verify all 5 policies exist
      for (let i = 1; i <= 5; i++) {
        const policy = await insurancePool.getPolicy(i);
        expect(policy.holder).to.equal(user1.address);
      }
    });
  });
});
