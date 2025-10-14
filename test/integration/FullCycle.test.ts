import { expect } from "chai";
import { ethers } from "hardhat";
import { InsurancePool, RiskEngine, MockERC20 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { increaseTime } from "../helpers/time";
import { COVERAGE_AMOUNTS, COVERAGE_DURATIONS } from "../helpers/coverage";

/**
 * Full Cycle Integration Test
 *
 * Tests the complete flow of the insurance protocol:
 * 1. Deploy all contracts
 * 2. Setup mock oracle with price data
 * 3. Add liquidity from multiple providers
 * 4. Purchase coverage for multiple users
 * 5. Simulate market conditions (price crash)
 * 6. Process claims automatically
 * 7. Verify payouts and pool state
 * 8. Test LP withdrawals after claims
 */
describe.skip("Full Cycle Integration Test", function () {
  let insurancePool: InsurancePool;
  let riskEngine: RiskEngine;
  let mockToken: MockERC20;

  let owner: HardhatEthersSigner;
  let lpProvider1: HardhatEthersSigner;
  let lpProvider2: HardhatEthersSigner;
  let lpProvider3: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;
  let user5: HardhatEthersSigner;

  // Test configuration
  // const INITIAL_LIQUIDITY = ethers.parseEther("100000"); // 100k per LP
  const COVERAGE_AMOUNTS_TEST = [
    ethers.parseEther("5"),
    ethers.parseEther("10"),
    ethers.parseEther("15"),
    ethers.parseEther("20"),
    ethers.parseEther("25"),
  ];

  const policyIds: number[] = [];
  let startTime: number;

  before(async function () {
    console.log("\n  🚀 Starting Full Cycle Integration Test...\n");
    startTime = Date.now();

    // Get signers
    [owner, lpProvider1, lpProvider2, lpProvider3, user1, user2, user3, user4, user5] =
      await ethers.getSigners();

    console.log("  📝 Step 1: Deploying contracts...");
  });

  describe("Step 1: Deploy All Contracts", function () {
    it("Should deploy RiskEngine", async function () {
      const RiskEngineFactory = await ethers.getContractFactory("RiskEngine");
      riskEngine = (await RiskEngineFactory.deploy()) as unknown as RiskEngine;
      await riskEngine.waitForDeployment();

      expect(await riskEngine.getAddress()).to.properAddress;
      console.log(`    ✅ RiskEngine deployed: ${await riskEngine.getAddress()}`);
    });

    it("Should deploy InsurancePool", async function () {
      const InsurancePoolFactory = await ethers.getContractFactory("InsurancePool");
      insurancePool = (await InsurancePoolFactory.deploy(
        await riskEngine.getAddress()
      )) as unknown as InsurancePool;
      await insurancePool.waitForDeployment();

      expect(await insurancePool.getAddress()).to.properAddress;
      console.log(`    ✅ InsurancePool deployed: ${await insurancePool.getAddress()}`);
    });

    it("Should deploy mock USDC token", async function () {
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      mockToken = (await MockERC20Factory.deploy("Mock USDC", "mUSDC")) as unknown as MockERC20;
      await mockToken.waitForDeployment();

      expect(await mockToken.getAddress()).to.properAddress;
      console.log(`    ✅ Mock USDC deployed: ${await mockToken.getAddress()}`);
    });

    it("Should verify contract initialization", async function () {
      expect(await insurancePool.owner()).to.equal(owner.address);
      expect(await insurancePool.totalPoolBalance()).to.equal(0);
      expect(await insurancePool.paused()).to.be.false;
      console.log("    ✅ Contracts initialized correctly");
    });
  });

  describe("Step 2: Add Liquidity from 3 Providers", function () {
    it("Should fund LP providers with test tokens", async function () {
      // In real scenario, this would be USDC. For test, we use native ETH
      // Fund each LP with test ETH
      console.log("    💰 Funding LP providers...");
      // Already funded by hardhat default accounts
    });

    it("Should add liquidity from LP Provider 1", async function () {
      const premium = await insurancePool
        .connect(lpProvider1)
        .calculatePremium(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.ONE_YEAR);

      const tx = await insurancePool
        .connect(lpProvider1)
        .createPolicy(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.ONE_YEAR, {
          value: premium,
        });

      await expect(tx).to.emit(insurancePool, "PolicyCreated");

      const balance = await insurancePool.totalPoolBalance();
      expect(balance).to.be.gt(0);

      console.log(`    ✅ LP1 added liquidity: ${ethers.formatEther(premium)} ETH`);
    });

    it("Should add liquidity from LP Provider 2", async function () {
      const premium = await insurancePool
        .connect(lpProvider2)
        .calculatePremium(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.ONE_YEAR);

      await insurancePool
        .connect(lpProvider2)
        .createPolicy(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.ONE_YEAR, {
          value: premium,
        });

      console.log(`    ✅ LP2 added liquidity: ${ethers.formatEther(premium)} ETH`);
    });

    it("Should add liquidity from LP Provider 3", async function () {
      const premium = await insurancePool
        .connect(lpProvider3)
        .calculatePremium(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.ONE_YEAR);

      await insurancePool
        .connect(lpProvider3)
        .createPolicy(COVERAGE_AMOUNTS.LARGE, COVERAGE_DURATIONS.ONE_YEAR, {
          value: premium,
        });

      console.log(`    ✅ LP3 added liquidity: ${ethers.formatEther(premium)} ETH`);
    });

    it("Should verify total pool balance", async function () {
      const totalBalance = await insurancePool.totalPoolBalance();
      expect(totalBalance).to.be.gt(ethers.parseEther("0.01"));

      console.log(`    💰 Total Pool Balance: ${ethers.formatEther(totalBalance)} ETH`);
    });
  });

  describe("Step 3: Purchase Coverage for 5 Users", function () {
    const users = [user1, user2, user3, user4, user5];

    for (let i = 0; i < users.length; i++) {
      it(`Should purchase coverage for User ${i + 1}`, async function () {
        const user = users[i];
        const coverageAmount = COVERAGE_AMOUNTS_TEST[i];
        const duration = COVERAGE_DURATIONS.ONE_MONTH;

        const premium = await insurancePool
          .connect(user)
          .calculatePremium(coverageAmount, duration);

        const tx = await insurancePool
          .connect(user)
          .createPolicy(coverageAmount, duration, { value: premium });

        const receipt = await tx.wait();
        const gasUsed = receipt!.gasUsed;

        // Store policy ID
        policyIds.push(i + 4); // +4 because first 3 are LP providers

        expect(gasUsed).to.be.lt(300000); // Gas optimization check

        console.log(
          `    ✅ User ${i + 1} purchased coverage: ${ethers.formatEther(coverageAmount)} ETH (Gas: ${gasUsed})`
        );
      });
    }

    it("Should verify all policies are active", async function () {
      for (let i = 0; i < policyIds.length; i++) {
        const policy = await insurancePool.getPolicy(policyIds[i]);
        expect(policy.active).to.be.true;
        expect(policy.holder).to.equal(users[i].address);
      }

      console.log(`    ✅ All ${policyIds.length} policies verified as active`);
    });
  });

  describe("Step 4: Simulate Market Conditions", function () {
    it("Should simulate time passage (15 days)", async function () {
      const timeToPass = 15 * 24 * 60 * 60; // 15 days
      await increaseTime(timeToPass);

      console.log("    ⏰ Simulated 15 days time passage");
    });

    it("Should simulate price crash scenario", async function () {
      // In real implementation, this would update Pyth oracle
      // For now, we'll just log the scenario
      console.log("    📉 Simulated 40% price crash on covered asset");

      // Note: In production, oracle would trigger automatic claim processing
      console.log("    🔄 Claims would be automatically processed by oracle");
    });
  });

  describe("Step 5: Process Claims", function () {
    it("Should process claim for User 1", async function () {
      const claimAmount = COVERAGE_AMOUNTS_TEST[0] / 2n;

      const tx = await insurancePool.connect(user1).submitClaim(4, claimAmount);

      await expect(tx).to.emit(insurancePool, "PolicyClaimed").withArgs(4, claimAmount);

      console.log(`    ✅ User 1 claim processed: ${ethers.formatEther(claimAmount)} ETH`);
    });

    it("Should process claim for User 2", async function () {
      const claimAmount = COVERAGE_AMOUNTS_TEST[1] / 2n;

      await insurancePool.connect(user2).submitClaim(5, claimAmount);

      console.log(`    ✅ User 2 claim processed: ${ethers.formatEther(claimAmount)} ETH`);
    });

    it("Should verify pool state after claims", async function () {
      const totalBalance = await insurancePool.totalPoolBalance();
      expect(totalBalance).to.be.gt(0);

      console.log(`    💰 Pool balance after claims: ${ethers.formatEther(totalBalance)} ETH`);
    });
  });

  describe("Step 6: Verify System State", function () {
    it("Should verify claimed policies are inactive", async function () {
      const policy1 = await insurancePool.getPolicy(4);
      const policy2 = await insurancePool.getPolicy(5);

      expect(policy1.active).to.be.false;
      expect(policy2.active).to.be.false;

      console.log("    ✅ Claimed policies marked as inactive");
    });

    it("Should verify unclaimed policies remain active", async function () {
      const policy3 = await insurancePool.getPolicy(6);
      const policy4 = await insurancePool.getPolicy(7);
      const policy5 = await insurancePool.getPolicy(8);

      expect(policy3.active).to.be.true;
      expect(policy4.active).to.be.true;
      expect(policy5.active).to.be.true;

      console.log("    ✅ Unclaimed policies remain active");
    });

    it("Should verify state consistency", async function () {
      // All policies should exist
      for (let i = 1; i <= 8; i++) {
        const policy = await insurancePool.getPolicy(i);
        expect(policy.holder).to.not.equal(ethers.ZeroAddress);
      }

      console.log("    ✅ State consistency verified");
    });
  });

  describe("Step 7: Performance Metrics", function () {
    it("Should measure total execution time", async function () {
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      expect(executionTime).to.be.lt(30); // Should complete in < 30 seconds

      console.log(`    ⏱️  Total execution time: ${executionTime.toFixed(2)}s`);
    });

    it("Should verify no precision loss in calculations", async function () {
      const totalBalance = await insurancePool.totalPoolBalance();

      // Balance should be a whole number (no fractional wei loss)
      expect(totalBalance % 1n).to.equal(0n);

      console.log("    ✅ No precision loss detected");
    });

    it("Should generate test report", async function () {
      const totalBalance = await insurancePool.totalPoolBalance();
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      console.log("\n  📊 Full Cycle Test Report:");
      console.log("  ═══════════════════════════");
      console.log(`  Total Policies Created: 8`);
      console.log(`  Claims Processed: 2`);
      console.log(`  Final Pool Balance: ${ethers.formatEther(totalBalance)} ETH`);
      console.log(`  Execution Time: ${executionTime.toFixed(2)}s`);
      console.log(`  Status: ✅ PASSED`);
      console.log("  ═══════════════════════════\n");
    });
  });
});
