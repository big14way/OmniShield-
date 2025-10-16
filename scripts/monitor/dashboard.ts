import { ethers } from "hardhat";
import { Contract } from "ethers";

interface PoolMetrics {
  tvl: bigint;
  utilization: number;
  coverageVolume: bigint;
  activePolicies: number;
  timestamp: number;
}

interface OracleHealth {
  lastUpdate: number;
  priceDeviation: number;
  status: "healthy" | "degraded" | "critical";
}

interface AlertConfig {
  largeClaimThreshold: bigint;
  largeWithdrawalThreshold: bigint;
  utilizationThreshold: number;
  priceDeviationThreshold: number;
}

class MonitoringDashboard {
  private insurancePool: Contract;
  private riskEngine: Contract;
  private claimsProcessor: Contract;
  private pythOracle?: Contract;
  private alertConfig: AlertConfig;

  constructor(
    insurancePool: Contract,
    riskEngine: Contract,
    claimsProcessor: Contract,
    pythOracle?: Contract
  ) {
    this.insurancePool = insurancePool;
    this.riskEngine = riskEngine;
    this.claimsProcessor = claimsProcessor;
    this.pythOracle = pythOracle;

    this.alertConfig = {
      largeClaimThreshold: ethers.parseEther("100"),
      largeWithdrawalThreshold: ethers.parseEther("50"),
      utilizationThreshold: 80,
      priceDeviationThreshold: 5,
    };
  }

  async getPoolMetrics(): Promise<PoolMetrics> {
    console.log("\n=== Pool Metrics ===");

    const totalPoolBalance = await this.insurancePool.totalPoolBalance();
    console.log(`TVL: ${ethers.formatEther(totalPoolBalance)} ETH`);

    const policyCounter = await this.insurancePool._policyCounter?.().catch(() => 0n);
    let activePolicies = 0;
    let totalCoverageVolume = 0n;

    if (policyCounter > 0) {
      for (let i = 1; i <= Number(policyCounter); i++) {
        try {
          const policy = await this.insurancePool.getPolicy(i);
          if (policy.active && policy.endTime > Math.floor(Date.now() / 1000)) {
            activePolicies++;
            totalCoverageVolume += policy.coverageAmount;
          }
        } catch {
          continue;
        }
      }
    }

    console.log(`Active Policies: ${activePolicies}`);
    console.log(`Total Coverage Volume: ${ethers.formatEther(totalCoverageVolume)} ETH`);

    const utilization =
      totalPoolBalance > 0n
        ? Number((totalCoverageVolume * 10000n) / totalPoolBalance) / 100
        : 0;
    console.log(`Utilization Rate: ${utilization.toFixed(2)}%`);

    if (utilization > this.alertConfig.utilizationThreshold) {
      console.log(
        `⚠️  ALERT: High utilization rate (${utilization.toFixed(2)}% > ${this.alertConfig.utilizationThreshold}%)`
      );
    }

    return {
      tvl: totalPoolBalance,
      utilization,
      coverageVolume: totalCoverageVolume,
      activePolicies,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  async monitorOracleHealth(): Promise<OracleHealth | null> {
    if (!this.pythOracle) {
      console.log("\n=== Oracle Health ===");
      console.log("No Pyth oracle configured");
      return null;
    }

    console.log("\n=== Oracle Health ===");

    try {
      const priceId = ethers.ZeroHash;
      const price = await this.pythOracle.getPrice(priceId);

      const lastUpdate = Number(price.publishTime || 0);
      const currentTime = Math.floor(Date.now() / 1000);
      const staleness = currentTime - lastUpdate;

      console.log(`Last Update: ${new Date(lastUpdate * 1000).toISOString()}`);
      console.log(`Staleness: ${staleness} seconds`);

      let status: "healthy" | "degraded" | "critical" = "healthy";
      if (staleness > 3600) {
        status = "critical";
        console.log("🔴 CRITICAL: Oracle data is stale (>1 hour)");
      } else if (staleness > 300) {
        status = "degraded";
        console.log("⚠️  WARNING: Oracle data is slightly stale (>5 minutes)");
      } else {
        console.log("✅ Oracle is healthy");
      }

      return {
        lastUpdate,
        priceDeviation: 0,
        status,
      };
    } catch {
      console.log("🔴 ERROR: Failed to fetch oracle data");
      return {
        lastUpdate: 0,
        priceDeviation: 0,
        status: "critical",
      };
    }
  }

  async monitorClaims(): Promise<void> {
    console.log("\n=== Claims Monitoring ===");

    const claimCounter = await this.claimsProcessor._claimCounter?.().catch(() => 0n);
    console.log(`Total Claims: ${claimCounter}`);

    const recentClaims: Array<{
      id: number;
      amount: bigint;
      status: string;
      age: number;
    }> = [];

    if (claimCounter > 0) {
      const startId = Math.max(1, Number(claimCounter) - 10);
      for (let i = startId; i <= Number(claimCounter); i++) {
        try {
          const claim = await this.claimsProcessor.claims(i);
          const currentTime = Math.floor(Date.now() / 1000);
          const age = currentTime - Number(claim.submittedAt);

          recentClaims.push({
            id: i,
            amount: claim.amount,
            status: ["Pending", "Approved", "Rejected", "Paid"][claim.status],
            age,
          });

          if (claim.amount >= this.alertConfig.largeClaimThreshold) {
            console.log(
              `⚠️  ALERT: Large claim detected - ID: ${i}, Amount: ${ethers.formatEther(claim.amount)} ETH`
            );
          }

          if (claim.status === 0 && age > 86400) {
            console.log(
              `⚠️  ALERT: Claim pending for >24 hours - ID: ${i}, Age: ${Math.floor(age / 3600)}h`
            );
          }
        } catch {
          continue;
        }
      }
    }

    console.log("\nRecent Claims Summary:");
    recentClaims.forEach((claim) => {
      console.log(
        `  ID: ${claim.id}, Amount: ${ethers.formatEther(claim.amount)} ETH, Status: ${claim.status}, Age: ${Math.floor(claim.age / 3600)}h`
      );
    });
  }

  async checkCrossChainBridge(): Promise<void> {
    console.log("\n=== Cross-Chain Bridge Status ===");

    try {
      const bridgeBalance = await ethers.provider.getBalance(
        await this.insurancePool.getAddress()
      );
      console.log(`Bridge Balance: ${ethers.formatEther(bridgeBalance)} ETH`);

      if (bridgeBalance < ethers.parseEther("1")) {
        console.log("⚠️  WARNING: Low bridge balance");
      } else {
        console.log("✅ Bridge balance is healthy");
      }
    } catch {
      console.log("🔴 ERROR: Failed to check bridge status");
    }
  }

  async monitorGasPrice(): Promise<void> {
    console.log("\n=== Gas Price Monitoring ===");

    try {
      const feeData = await ethers.provider.getFeeData();

      console.log(
        `Gas Price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A"} gwei`
      );
      console.log(
        `Max Fee: ${feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") : "N/A"} gwei`
      );
      console.log(
        `Priority Fee: ${feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") : "N/A"} gwei`
      );

      const gasPrice = feeData.gasPrice || 0n;
      if (gasPrice > ethers.parseUnits("100", "gwei")) {
        console.log("⚠️  ALERT: High gas prices detected");
      } else {
        console.log("✅ Gas prices are normal");
      }
    } catch {
      console.log("🔴 ERROR: Failed to fetch gas prices");
    }
  }

  async runFullMonitoring(): Promise<void> {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║         OmniShield Monitoring Dashboard                   ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    try {
      await this.getPoolMetrics();
      await this.monitorOracleHealth();
      await this.monitorClaims();
      await this.checkCrossChainBridge();
      await this.monitorGasPrice();

      console.log("\n═══════════════════════════════════════════════════════════");
      console.log("Monitoring cycle completed successfully");
      console.log("═══════════════════════════════════════════════════════════\n");
    } catch (err) {
      console.error("Error during monitoring:", err);
      throw err;
    }
  }

  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    console.log("Alert configuration updated:", this.alertConfig);
  }
}

async function main() {
  console.log("Initializing Monitoring Dashboard...\n");

  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (${network.chainId})`);

  const insurancePoolAddress = process.env.INSURANCE_POOL_ADDRESS;
  const riskEngineAddress = process.env.RISK_ENGINE_ADDRESS;
  const claimsProcessorAddress = process.env.CLAIMS_PROCESSOR_ADDRESS;
  const pythOracleAddress = process.env.PYTH_ORACLE_ADDRESS;

  if (!insurancePoolAddress || !riskEngineAddress || !claimsProcessorAddress) {
    throw new Error(
      "Missing required addresses. Set INSURANCE_POOL_ADDRESS, RISK_ENGINE_ADDRESS, and CLAIMS_PROCESSOR_ADDRESS in .env"
    );
  }

  const insurancePool = await ethers.getContractAt("InsurancePool", insurancePoolAddress);
  const riskEngine = await ethers.getContractAt("RiskEngine", riskEngineAddress);
  const claimsProcessor = await ethers.getContractAt(
    "ClaimsProcessor",
    claimsProcessorAddress
  );

  let pythOracle;
  if (pythOracleAddress) {
    pythOracle = await ethers.getContractAt("IPyth", pythOracleAddress);
  }

  const dashboard = new MonitoringDashboard(
    insurancePool,
    riskEngine,
    claimsProcessor,
    pythOracle
  );

  const monitoringInterval = parseInt(process.env.MONITORING_INTERVAL || "300000");
  const continuous = process.env.CONTINUOUS_MONITORING === "true";

  if (continuous) {
    console.log(`Starting continuous monitoring (interval: ${monitoringInterval}ms)...\n`);
    setInterval(async () => {
      try {
        await dashboard.runFullMonitoring();
      } catch (err) {
        console.error("Monitoring cycle failed:", err);
      }
    }, monitoringInterval);
  } else {
    await dashboard.runFullMonitoring();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      if (process.env.CONTINUOUS_MONITORING !== "true") {
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { MonitoringDashboard };
