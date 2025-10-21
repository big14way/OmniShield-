import { expect } from "chai";
import { ethers } from "hardhat";
import { HederaInsurancePoolFixed, RiskEngine } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("HederaInsurancePoolFixed", function () {
  let insurancePool: HederaInsurancePoolFixed;
  let riskEngine: RiskEngine;
  let user: SignerWithAddress;
  let treasury: SignerWithAddress;

  beforeEach(async function () {
    const [, _user, _treasury] = await ethers.getSigners();
    user = _user;
    treasury = _treasury;

    // Deploy RiskEngine
    const RiskEngine = await ethers.getContractFactory("RiskEngine");
    riskEngine = await RiskEngine.deploy();
    await riskEngine.waitForDeployment();

    // Deploy HederaInsurancePoolFixed
    const HederaInsurancePoolFixed = await ethers.getContractFactory("HederaInsurancePoolFixed");
    insurancePool = await HederaInsurancePoolFixed.deploy(
      await riskEngine.getAddress(),
      treasury.address,
      ethers.ZeroAddress, // htsToken
      ethers.ZeroHash // consensusTopic
    );
    await insurancePool.waitForDeployment();
  });

  describe("Policy Creation - Fixed Version", function () {
    it("Should accept any payment > 0 for policy creation", async function () {
      const coverageAmount = ethers.parseEther("10");
      const duration = BigInt(30 * 24 * 60 * 60); // 30 days
      const payment = ethers.parseEther("0.1"); // Send 0.1 HBAR

      const tx = await insurancePool.connect(user).createPolicy(coverageAmount, duration, {
        value: payment,
      });

      await expect(tx).to.emit(insurancePool, "PolicyCreated");

      const policy = await insurancePool.getPolicy(1);
      expect(policy.holder).to.equal(user.address);
      expect(policy.coverageAmount).to.equal(coverageAmount);
      expect(policy.premium).to.equal(payment); // Premium = what user paid
      expect(policy.active).to.be.true;
    });

    it("Should accept very small payments", async function () {
      const coverageAmount = ethers.parseEther("10");
      const duration = BigInt(30 * 24 * 60 * 60);
      const payment = ethers.parseEther("0.001"); // Just 0.001 HBAR

      const tx = await insurancePool.connect(user).createPolicy(coverageAmount, duration, {
        value: payment,
      });

      await expect(tx).to.emit(insurancePool, "PolicyCreated");
    });

    it("Should accept payments larger than calculated premium", async function () {
      const coverageAmount = ethers.parseEther("10");
      const duration = BigInt(30 * 24 * 60 * 60);
      const payment = ethers.parseEther("1"); // Send 1 full HBAR

      const tx = await insurancePool.connect(user).createPolicy(coverageAmount, duration, {
        value: payment,
      });

      await expect(tx).to.emit(insurancePool, "PolicyCreated");

      const policy = await insurancePool.getPolicy(1);
      expect(policy.premium).to.equal(payment); // User pays what they send
    });

    it("Should reject zero payment", async function () {
      const coverageAmount = ethers.parseEther("10");
      const duration = BigInt(30 * 24 * 60 * 60);

      await expect(
        insurancePool.connect(user).createPolicy(coverageAmount, duration, {
          value: 0,
        })
      ).to.be.revertedWithCustomError(insurancePool, "ZeroPaymentNotAllowed");
    });

    it("Should calculate premium correctly (view function)", async function () {
      const coverageAmount = ethers.parseEther("10");
      const duration = BigInt(30 * 24 * 60 * 60);

      const premium = await insurancePool.connect(user).calculatePremium(coverageAmount, duration);

      expect(premium).to.be.gt(0);
      console.log("      Calculated premium:", ethers.formatEther(premium), "HBAR");
    });

    it("Should create multiple policies", async function () {
      const coverageAmount = ethers.parseEther("5");
      const duration = BigInt(15 * 24 * 60 * 60);
      const payment = ethers.parseEther("0.05");

      await insurancePool.connect(user).createPolicy(coverageAmount, duration, {
        value: payment,
      });

      await insurancePool.connect(user).createPolicy(coverageAmount, duration, {
        value: payment,
      });

      const policy1 = await insurancePool.getPolicy(1);
      const policy2 = await insurancePool.getPolicy(2);

      expect(policy1.holder).to.equal(user.address);
      expect(policy2.holder).to.equal(user.address);
    });
  });

  describe("Pool Balance", function () {
    it("Should update pool balance when policy is created", async function () {
      const payment = ethers.parseEther("0.1");

      const balanceBefore = await insurancePool.totalPoolBalance();

      await insurancePool
        .connect(user)
        .createPolicy(ethers.parseEther("10"), BigInt(30 * 24 * 60 * 60), { value: payment });

      const balanceAfter = await insurancePool.totalPoolBalance();
      expect(balanceAfter).to.equal(balanceBefore + payment);
    });
  });

  describe("Liquidity Functions", function () {
    it("Should allow adding liquidity", async function () {
      const amount = ethers.parseEther("10");

      const tx = await insurancePool.connect(user).addLiquidity({ value: amount });
      await expect(tx).to.emit(insurancePool, "LiquidityAdded").withArgs(user.address, amount);

      const balance = await insurancePool.getLiquidityProviderBalance(user.address);
      expect(balance).to.equal(amount);
    });

    it("Should allow withdrawing liquidity", async function () {
      const amount = ethers.parseEther("10");

      await insurancePool.connect(user).addLiquidity({ value: amount });

      const withdrawAmount = ethers.parseEther("5");
      const tx = await insurancePool.connect(user).withdrawLiquidity(withdrawAmount);

      await expect(tx).to.emit(insurancePool, "LiquidityWithdrawn");

      const balance = await insurancePool.getLiquidityProviderBalance(user.address);
      expect(balance).to.equal(amount - withdrawAmount);
    });
  });

  describe("Gas Usage", function () {
    it("Should measure gas for policy creation", async function () {
      const coverageAmount = ethers.parseEther("10");
      const duration = BigInt(30 * 24 * 60 * 60);
      const payment = ethers.parseEther("0.1");

      const tx = await insurancePool.connect(user).createPolicy(coverageAmount, duration, {
        value: payment,
      });

      const receipt = await tx.wait();
      console.log("      Gas used for createPolicy:", receipt?.gasUsed.toString());

      expect(receipt?.gasUsed).to.be.lt(1000000); // Should use less than 1M gas
    });
  });
});
