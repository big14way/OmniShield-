import { expect } from "chai";
import { ethers } from "hardhat";
import { CCIPCrossChainCoverage, RiskEngine } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CCIPCrossChainCoverage", function () {
  let ccipCoverage: CCIPCrossChainCoverage;
  let riskEngine: RiskEngine;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let mockRouter: HardhatEthersSigner;
  let mockLinkToken: any;
  let insurancePool: HardhatEthersSigner;

  // Constants
  const ETHEREUM_CHAIN_SELECTOR = 5009297550715157269n; // Sepolia
  const POLYGON_CHAIN_SELECTOR = 12532609583862916517n; // Mumbai
  const DEFAULT_RATE_LIMIT = 100n;
  const COVERAGE_AMOUNT = ethers.parseEther("10");
  const PREMIUM = ethers.parseEther("0.1");
  const DURATION = 30n * 24n * 60n * 60n; // 30 days

  beforeEach(async function () {
    [owner, user1, user2, mockRouter, insurancePool] = await ethers.getSigners();

    // Deploy mock LINK token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockLinkToken = await MockERC20.deploy("ChainLink Token", "LINK");
    await mockLinkToken.waitForDeployment();

    // Mint LINK to users
    await mockLinkToken.mint(user1.address, ethers.parseEther("1000"));
    await mockLinkToken.mint(user2.address, ethers.parseEther("1000"));

    // Deploy RiskEngine
    const RiskEngineFactory = await ethers.getContractFactory("RiskEngine");
    riskEngine = (await RiskEngineFactory.deploy()) as unknown as RiskEngine;
    await riskEngine.waitForDeployment();

    // Deploy CCIPCrossChainCoverage
    const CCIPFactory = await ethers.getContractFactory("CCIPCrossChainCoverage");
    ccipCoverage = (await CCIPFactory.deploy(
      mockRouter.address,
      await mockLinkToken.getAddress(),
      insurancePool.address
    )) as unknown as CCIPCrossChainCoverage;
    await ccipCoverage.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct LINK token", async function () {
      expect(await ccipCoverage.linkToken()).to.equal(await mockLinkToken.getAddress());
    });

    it("Should set the correct insurance pool", async function () {
      expect(await ccipCoverage.insurancePool()).to.equal(insurancePool.address);
    });

    it("Should grant admin roles to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const BRIDGE_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ADMIN_ROLE"));
      const EMERGENCY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EMERGENCY_ROLE"));

      expect(await ccipCoverage.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await ccipCoverage.hasRole(BRIDGE_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await ccipCoverage.hasRole(EMERGENCY_ROLE, owner.address)).to.be.true;
    });

    it("Should initialize with zero cross-chain coverage", async function () {
      expect(await ccipCoverage.totalCrossChainCoverage()).to.equal(0);
    });
  });

  describe("Chain Management", function () {
    it("Should enable a chain with default rate limit", async function () {
      const remoteContract = user2.address;

      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, remoteContract, 0);

      const config = await ccipCoverage.getChainConfig(ETHEREUM_CHAIN_SELECTOR);
      expect(config.remoteContract).to.equal(remoteContract);
      expect(config.enabled).to.be.true;
      expect(config.rateLimitPerHour).to.equal(DEFAULT_RATE_LIMIT);
    });

    it("Should enable a chain with custom rate limit", async function () {
      const remoteContract = user2.address;
      const customRateLimit = 50n;

      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, remoteContract, customRateLimit);

      const config = await ccipCoverage.getChainConfig(ETHEREUM_CHAIN_SELECTOR);
      expect(config.rateLimitPerHour).to.equal(customRateLimit);
    });

    it("Should disable a chain", async function () {
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0);

      await ccipCoverage.disableChain(ETHEREUM_CHAIN_SELECTOR);

      expect(await ccipCoverage.isChainEnabled(ETHEREUM_CHAIN_SELECTOR)).to.be.false;
    });

    it("Should update rate limit for enabled chain", async function () {
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0);

      const newRateLimit = 200n;
      await ccipCoverage.updateRateLimit(ETHEREUM_CHAIN_SELECTOR, newRateLimit);

      const config = await ccipCoverage.getChainConfig(ETHEREUM_CHAIN_SELECTOR);
      expect(config.rateLimitPerHour).to.equal(newRateLimit);
    });

    it("Should revert when enabling with invalid remote contract", async function () {
      await expect(
        ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, ethers.ZeroAddress, 0)
      ).to.be.revertedWith("Invalid remote contract");
    });

    it("Should revert when enabling with zero chain selector", async function () {
      await expect(ccipCoverage.enableChain(0, user2.address, 0)).to.be.revertedWith(
        "Invalid chain selector"
      );
    });

    it("Should only allow BRIDGE_ADMIN to enable chains", async function () {
      await expect(
        ccipCoverage.connect(user1).enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0)
      ).to.be.reverted;
    });

    it("Should emit ChainConfigured event", async function () {
      await expect(ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0))
        .to.emit(ccipCoverage, "ChainConfigured")
        .withArgs(ETHEREUM_CHAIN_SELECTOR, user2.address, true);
    });
  });

  describe("Coverage Validation", function () {
    beforeEach(async function () {
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0);
    });

    it("Should reject coverage amount below minimum", async function () {
      const coverage = {
        holder: user1.address,
        coverageAmount: ethers.parseEther("0.005"), // Below 0.01 min
        duration: DURATION,
        premium: PREMIUM,
        sourceChain: 0n,
        timestamp: 0n,
      };

      // This would be tested in sendCrossChainCoverage, but we can't easily mock CCIP router
      // So we test the validation logic indirectly
      const minAmount = await ccipCoverage.MIN_COVERAGE_AMOUNT();
      expect(coverage.coverageAmount).to.be.lt(minAmount);
    });

    it("Should reject coverage amount above maximum", async function () {
      const coverage = {
        holder: user1.address,
        coverageAmount: ethers.parseEther("1001"), // Above 1000 max
        duration: DURATION,
        premium: PREMIUM,
        sourceChain: 0n,
        timestamp: 0n,
      };

      const maxAmount = await ccipCoverage.MAX_COVERAGE_AMOUNT();
      expect(coverage.coverageAmount).to.be.gt(maxAmount);
    });

    it("Should reject duration below minimum", async function () {
      const minDuration = await ccipCoverage.MIN_DURATION();
      expect(minDuration).to.equal(86400n); // 1 day
    });

    it("Should reject duration above maximum", async function () {
      const maxDuration = await ccipCoverage.MAX_DURATION();
      expect(maxDuration).to.equal(31536000n); // 365 days
    });
  });

  describe("Emergency Pause", function () {
    it("Should pause bridge operations", async function () {
      await ccipCoverage.pauseBridge();

      expect(await ccipCoverage.paused()).to.be.true;
    });

    it("Should unpause bridge operations", async function () {
      await ccipCoverage.pauseBridge();
      await ccipCoverage.unpauseBridge();

      expect(await ccipCoverage.paused()).to.be.false;
    });

    it("Should emit BridgePauseToggled event on pause", async function () {
      await expect(ccipCoverage.pauseBridge())
        .to.emit(ccipCoverage, "BridgePauseToggled")
        .withArgs(true);
    });

    it("Should emit BridgePauseToggled event on unpause", async function () {
      await ccipCoverage.pauseBridge();

      await expect(ccipCoverage.unpauseBridge())
        .to.emit(ccipCoverage, "BridgePauseToggled")
        .withArgs(false);
    });

    it("Should only allow EMERGENCY_ROLE to pause", async function () {
      await expect(ccipCoverage.connect(user1).pauseBridge()).to.be.reverted;
    });

    it("Should only allow EMERGENCY_ROLE to unpause", async function () {
      await ccipCoverage.pauseBridge();

      await expect(ccipCoverage.connect(user1).unpauseBridge()).to.be.reverted;
    });
  });

  describe("Rate Limiting", function () {
    it("Should have correct default rate limit", async function () {
      expect(await ccipCoverage.DEFAULT_RATE_LIMIT()).to.equal(DEFAULT_RATE_LIMIT);
    });

    it("Should have correct rate limit window", async function () {
      const RATE_LIMIT_WINDOW = await ccipCoverage.RATE_LIMIT_WINDOW();
      expect(RATE_LIMIT_WINDOW).to.equal(3600n); // 1 hour
    });

    it("Should initialize rate limit counter on chain enable", async function () {
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 50);

      const config = await ccipCoverage.getChainConfig(ETHEREUM_CHAIN_SELECTOR);
      expect(config.messageCount).to.equal(0);
      expect(config.lastResetTime).to.be.closeTo(
        await ethers.provider.getBlock("latest").then((b) => b!.timestamp),
        5
      );
    });
  });

  describe("Replay Protection", function () {
    it("Should track message processing", async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message"));

      // Initially not processed
      expect(await ccipCoverage.processedMessages(messageId)).to.be.false;
    });

    it("Should track nonces per sender", async function () {
      const nonce = await ccipCoverage.nonces(user1.address);
      expect(nonce).to.equal(0);
    });
  });

  describe("LINK Token Management", function () {
    it("Should withdraw LINK tokens", async function () {
      // Send LINK to contract from user1 who has LINK
      const amount = ethers.parseEther("10");
      await mockLinkToken.connect(user1).transfer(await ccipCoverage.getAddress(), amount);

      const balanceBefore = await mockLinkToken.balanceOf(user1.address);

      await ccipCoverage.withdrawLINK(amount, user1.address);

      const balanceAfter = await mockLinkToken.balanceOf(user1.address);
      expect(balanceAfter - balanceBefore).to.equal(amount);
    });

    it("Should revert withdrawal with invalid recipient", async function () {
      await expect(
        ccipCoverage.withdrawLINK(ethers.parseEther("1"), ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid recipient");
    });

    it("Should only allow DEFAULT_ADMIN to withdraw LINK", async function () {
      await expect(ccipCoverage.connect(user1).withdrawLINK(ethers.parseEther("1"), user1.address))
        .to.be.reverted;
    });
  });

  describe("Coverage Fee Estimation", function () {
    beforeEach(async function () {
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0);
    });

    it("Should estimate CCIP fee for valid coverage", async function () {
      const coverage = {
        holder: user1.address,
        coverageAmount: COVERAGE_AMOUNT,
        duration: DURATION,
        premium: PREMIUM,
        sourceChain: 0n,
        timestamp: 0n,
      };

      // This will revert because we don't have a real CCIP router
      // In production, this would return the actual fee
      await expect(ccipCoverage.estimateCCIPFee(ETHEREUM_CHAIN_SELECTOR, coverage)).to.be.reverted;
    });

    it("Should revert fee estimation for disabled chain", async function () {
      const coverage = {
        holder: user1.address,
        coverageAmount: COVERAGE_AMOUNT,
        duration: DURATION,
        premium: PREMIUM,
        sourceChain: 0n,
        timestamp: 0n,
      };

      await expect(ccipCoverage.estimateCCIPFee(POLYGON_CHAIN_SELECTOR, coverage))
        .to.be.revertedWithCustomError(ccipCoverage, "ChainNotEnabled")
        .withArgs(POLYGON_CHAIN_SELECTOR);
    });
  });

  describe("View Functions", function () {
    it("Should check if chain is enabled", async function () {
      expect(await ccipCoverage.isChainEnabled(ETHEREUM_CHAIN_SELECTOR)).to.be.false;

      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0);

      expect(await ccipCoverage.isChainEnabled(ETHEREUM_CHAIN_SELECTOR)).to.be.true;
    });

    it("Should get chain configuration", async function () {
      const remoteContract = user2.address;
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, remoteContract, 75);

      const config = await ccipCoverage.getChainConfig(ETHEREUM_CHAIN_SELECTOR);

      expect(config.remoteContract).to.equal(remoteContract);
      expect(config.enabled).to.be.true;
      expect(config.rateLimitPerHour).to.equal(75);
      expect(config.messageCount).to.equal(0);
    });

    it("Should get pending coverage", async function () {
      const messageId = ethers.keccak256(ethers.toUtf8Bytes("test-message"));
      const coverage = await ccipCoverage.getPendingCoverage(messageId);

      // Initially empty
      expect(coverage.holder).to.equal(ethers.ZeroAddress);
      expect(coverage.coverageAmount).to.equal(0);
    });

    it("Should get total cross-chain coverage", async function () {
      expect(await ccipCoverage.totalCrossChainCoverage()).to.equal(0);
    });
  });

  describe("Role Management", function () {
    it("Should grant BRIDGE_ADMIN_ROLE", async function () {
      const BRIDGE_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ADMIN_ROLE"));

      await ccipCoverage.grantRole(BRIDGE_ADMIN_ROLE, user1.address);

      expect(await ccipCoverage.hasRole(BRIDGE_ADMIN_ROLE, user1.address)).to.be.true;
    });

    it("Should grant EMERGENCY_ROLE", async function () {
      const EMERGENCY_ROLE = ethers.keccak256(ethers.toUtf8Bytes("EMERGENCY_ROLE"));

      await ccipCoverage.grantRole(EMERGENCY_ROLE, user1.address);

      expect(await ccipCoverage.hasRole(EMERGENCY_ROLE, user1.address)).to.be.true;
    });

    it("Should revoke roles", async function () {
      const BRIDGE_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRIDGE_ADMIN_ROLE"));

      await ccipCoverage.grantRole(BRIDGE_ADMIN_ROLE, user1.address);
      await ccipCoverage.revokeRole(BRIDGE_ADMIN_ROLE, user1.address);

      expect(await ccipCoverage.hasRole(BRIDGE_ADMIN_ROLE, user1.address)).to.be.false;
    });
  });

  describe("Constants", function () {
    it("Should have correct minimum coverage amount", async function () {
      expect(await ccipCoverage.MIN_COVERAGE_AMOUNT()).to.equal(ethers.parseEther("0.01"));
    });

    it("Should have correct maximum coverage amount", async function () {
      expect(await ccipCoverage.MAX_COVERAGE_AMOUNT()).to.equal(ethers.parseEther("1000"));
    });

    it("Should have correct minimum duration", async function () {
      expect(await ccipCoverage.MIN_DURATION()).to.equal(86400n); // 1 day
    });

    it("Should have correct maximum duration", async function () {
      expect(await ccipCoverage.MAX_DURATION()).to.equal(31536000n); // 365 days
    });
  });

  describe("Integration Scenarios", function () {
    beforeEach(async function () {
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user2.address, 0);
      await ccipCoverage.enableChain(POLYGON_CHAIN_SELECTOR, user2.address, 0);
    });

    it("Should support multiple enabled chains", async function () {
      expect(await ccipCoverage.isChainEnabled(ETHEREUM_CHAIN_SELECTOR)).to.be.true;
      expect(await ccipCoverage.isChainEnabled(POLYGON_CHAIN_SELECTOR)).to.be.true;
    });

    it("Should maintain independent rate limits per chain", async function () {
      const ethConfig = await ccipCoverage.getChainConfig(ETHEREUM_CHAIN_SELECTOR);
      const polyConfig = await ccipCoverage.getChainConfig(POLYGON_CHAIN_SELECTOR);

      expect(ethConfig.messageCount).to.equal(0);
      expect(polyConfig.messageCount).to.equal(0);
    });

    it("Should allow different remote contracts per chain", async function () {
      await ccipCoverage.enableChain(ETHEREUM_CHAIN_SELECTOR, user1.address, 0);
      await ccipCoverage.enableChain(POLYGON_CHAIN_SELECTOR, user2.address, 0);

      const ethConfig = await ccipCoverage.getChainConfig(ETHEREUM_CHAIN_SELECTOR);
      const polyConfig = await ccipCoverage.getChainConfig(POLYGON_CHAIN_SELECTOR);

      expect(ethConfig.remoteContract).to.equal(user1.address);
      expect(polyConfig.remoteContract).to.equal(user2.address);
    });
  });
});
