import { expect } from "chai";
import { ethers } from "hardhat";
import { RiskEngine } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RiskEngine", function () {
  let riskEngine: RiskEngine;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    
    const RiskEngine = await ethers.getContractFactory("RiskEngine");
    riskEngine = await RiskEngine.deploy();
    await riskEngine.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await riskEngine.owner()).to.equal(owner.address);
    });

    it("Should have correct risk score bounds", async function () {
      expect(await riskEngine.MAX_RISK_SCORE()).to.equal(10000);
      expect(await riskEngine.MIN_RISK_SCORE()).to.equal(100);
    });
  });

  describe("Risk Calculation", function () {
    it("Should calculate base risk for new users", async function () {
      const coverageAmount = ethers.parseEther("10");
      const riskScore = await riskEngine.calculateRisk(user.address, coverageAmount);
      expect(riskScore).to.be.greaterThan(0);
    });

    it("Should determine eligibility for coverage", async function () {
      const coverageAmount = ethers.parseEther("10");
      const isEligible = await riskEngine.isEligibleForCoverage(
        user.address,
        coverageAmount
      );
      expect(isEligible).to.be.true;
    });
  });

  describe("Risk Profile Management", function () {
    it("Should update risk profile", async function () {
      await riskEngine.updateRiskProfile(user.address);
      
      const profile = await riskEngine.getRiskProfile(user.address);
      expect(profile.isActive).to.be.true;
      expect(profile.riskScore).to.be.greaterThan(0);
    });

    it("Should allow owner to set risk score", async function () {
      const newScore = 5000;
      await riskEngine.setRiskScore(user.address, newScore);
      
      const profile = await riskEngine.getRiskProfile(user.address);
      expect(profile.riskScore).to.equal(newScore);
    });

    it("Should reject invalid risk scores", async function () {
      const invalidScore = 15000;
      await expect(
        riskEngine.setRiskScore(user.address, invalidScore)
      ).to.be.revertedWith("Invalid risk score");
    });

    it("Should not allow non-owner to set risk score", async function () {
      const newScore = 5000;
      await expect(
        riskEngine.connect(user).setRiskScore(user.address, newScore)
      ).to.be.reverted;
    });
  });
});
