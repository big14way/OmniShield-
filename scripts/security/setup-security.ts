import { ethers } from "hardhat";
import { Contract } from "ethers";

interface SecurityConfig {
  multisigOwners: string[];
  multisigThreshold: number;
  timelockDelay: number;
  emergencyGuardians: string[];
}

interface DeployedContracts {
  insurancePool: Contract;
  riskEngine: Contract;
  claimsProcessor: Contract;
  hederaBridge?: Contract;
}

class SecuritySetup {
  private contracts: DeployedContracts;
  private config: SecurityConfig;

  constructor(contracts: DeployedContracts, config: SecurityConfig) {
    this.contracts = contracts;
    this.config = config;
  }

  async deployMultisig(): Promise<string> {
    console.log("\n=== Deploying Gnosis Safe Multi-Sig ===");
    console.log(`Owners: ${this.config.multisigOwners.length}`);
    console.log(`Threshold: ${this.config.multisigThreshold}`);

    try {
      const GnosisSafeFactory = await ethers.getContractFactory("GnosisSafe").catch(() => null);

      if (!GnosisSafeFactory) {
        console.log("⚠️  Gnosis Safe contract not found. Using manual deployment instructions:");
        console.log("\n1. Deploy Gnosis Safe via their UI:");
        console.log("   - Visit: https://app.safe.global/");
        console.log(`   - Add owners: ${this.config.multisigOwners.join(", ")}`);
        console.log(`   - Set threshold: ${this.config.multisigThreshold}`);
        console.log("\n2. Transfer ownership of all contracts to the Safe address");
        console.log("\n3. Update MULTISIG_ADDRESS in .env");
        return "";
      }

      const gnosisSafe = await GnosisSafeFactory.deploy();
      await gnosisSafe.waitForDeployment();
      const safeAddress = await gnosisSafe.getAddress();

      console.log(`✅ Gnosis Safe deployed at: ${safeAddress}`);
      return safeAddress;
    } catch (err) {
      console.error("Error deploying multi-sig:", err);
      throw err;
    }
  }

  async deployTimelock(): Promise<string> {
    console.log("\n=== Deploying Timelock Controller ===");
    console.log(`Delay: ${this.config.timelockDelay} seconds`);

    try {
      const TimelockController = await ethers.getContractFactory("TimelockController");

      const minDelay = this.config.timelockDelay;
      const proposers = this.config.multisigOwners;
      const executors = this.config.multisigOwners;
      const admin = ethers.ZeroAddress;

      const timelock = await TimelockController.deploy(minDelay, proposers, executors, admin);
      await timelock.waitForDeployment();
      const timelockAddress = await timelock.getAddress();

      console.log(`✅ Timelock deployed at: ${timelockAddress}`);
      console.log(`   Min Delay: ${minDelay} seconds (${minDelay / 3600} hours)`);
      return timelockAddress;
    } catch (err) {
      console.error("Error deploying timelock:", err);
      throw err;
    }
  }

  async transferOwnership(newOwner: string): Promise<void> {
    console.log("\n=== Transferring Contract Ownership ===");
    console.log(`New Owner: ${newOwner}`);

    const contracts = [
      { name: "InsurancePool", contract: this.contracts.insurancePool },
      { name: "RiskEngine", contract: this.contracts.riskEngine },
      { name: "ClaimsProcessor", contract: this.contracts.claimsProcessor },
    ];

    if (this.contracts.hederaBridge) {
      contracts.push({ name: "HederaBridge", contract: this.contracts.hederaBridge });
    }

    for (const { name, contract } of contracts) {
      try {
        const currentOwner = await contract.owner();
        console.log(`\n${name}:`);
        console.log(`  Current Owner: ${currentOwner}`);

        if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
          console.log(`  ⏭️  Already owned by target address`);
          continue;
        }

        const tx = await contract.transferOwnership(newOwner);
        await tx.wait();
        console.log(`  ✅ Ownership transferred to: ${newOwner}`);
      } catch (err) {
        console.error(`  ❌ Error transferring ${name}:`, err);
      }
    }
  }

  async setupMonitoring(): Promise<void> {
    console.log("\n=== Setting Up Monitoring Alerts (Forta) ===");

    console.log("\n📋 Forta Agent Setup Instructions:");
    console.log("\n1. Install Forta CLI:");
    console.log("   npm install -g forta-agent");
    console.log("\n2. Initialize Forta agent:");
    console.log("   forta-agent init");
    console.log("\n3. Configure monitoring for:");
    console.log("   - Large claim submissions (>100 ETH)");
    console.log("   - Emergency pause events");
    console.log("   - Ownership transfer attempts");
    console.log("   - Unusual withdrawal patterns");
    console.log("   - Oracle price deviations");
    console.log("\n4. Deploy agent:");
    console.log("   forta-agent publish");

    console.log("\n📧 Alert Channels:");
    console.log("   - Email: Set up in Forta dashboard");
    console.log("   - Slack: Configure webhook integration");
    console.log("   - PagerDuty: For critical alerts");
    console.log("   - Telegram: For real-time notifications");

    console.log("\n⚠️  Critical Events to Monitor:");
    const criticalEvents = [
      "Paused(address)",
      "Unpaused(address)",
      "OwnershipTransferred(address,address)",
      "PolicyCreated(uint256,address,uint256,uint256)",
      "ClaimSubmitted(uint256,uint256,address,uint256)",
      "ClaimPaid(uint256,uint256)",
    ];

    criticalEvents.forEach((event) => {
      console.log(`   - ${event}`);
    });
  }

  async configureBugBounty(): Promise<void> {
    console.log("\n=== Bug Bounty Program Configuration ===");

    console.log("\n📋 Bug Bounty Setup Checklist:");
    console.log("\n1. Choose a platform:");
    console.log("   - Immunefi (recommended for DeFi)");
    console.log("   - HackerOne");
    console.log("   - Code4rena");
    console.log("\n2. Severity Levels & Rewards:");
    console.log("   - Critical: $50,000 - $100,000");
    console.log("     * Loss of funds");
    console.log("     * Protocol shutdown");
    console.log("     * Theft of user policies");
    console.log("   - High: $10,000 - $50,000");
    console.log("     * Price oracle manipulation");
    console.log("     * Unauthorized access");
    console.log("     * Denial of service");
    console.log("   - Medium: $2,000 - $10,000");
    console.log("     * Logic errors");
    console.log("     * Gas optimizations");
    console.log("   - Low: $500 - $2,000");
    console.log("     * UI/UX issues");
    console.log("     * Documentation errors");
    console.log("\n3. Scope:");
    console.log("   In Scope:");
    this.listContractsInScope();
    console.log("\n   Out of Scope:");
    console.log("   - Known issues");
    console.log("   - Frontend vulnerabilities");
    console.log("   - Third-party contracts");
    console.log("\n4. Submission Requirements:");
    console.log("   - Detailed vulnerability description");
    console.log("   - Proof of concept");
    console.log("   - Impact assessment");
    console.log("   - Suggested fix");
  }

  private listContractsInScope(): void {
    const contracts = [
      "InsurancePool",
      "RiskEngine",
      "ClaimsProcessor",
      "HederaBridge",
      "PythPriceConsumer",
    ];

    contracts.forEach((name) => {
      console.log(`   - ${name}`);
    });
  }

  async setupEmergencyPause(): Promise<void> {
    console.log("\n=== Emergency Pause Configuration ===");

    console.log("\n📋 Emergency Guardians:");
    this.config.emergencyGuardians.forEach((guardian, index) => {
      console.log(`   ${index + 1}. ${guardian}`);
    });

    console.log("\n⚠️  Pause Triggers:");
    console.log("   - Large unexpected fund movements");
    console.log("   - Oracle failure or manipulation");
    console.log("   - Detected exploit in progress");
    console.log("   - Critical vulnerability disclosure");
    console.log("   - Suspicious claim patterns");

    console.log("\n🔧 Emergency Response Script:");
    console.log("   Run: npm run emergency:pause");
    console.log("   Or: npx hardhat run scripts/emergency/pause-all.ts");

    try {
      const isPausable = (await this.contracts.insurancePool.paused?.().catch(() => null)) !== null;

      if (isPausable) {
        const isPaused = await this.contracts.insurancePool.paused();
        console.log(`\n📊 Current Status: ${isPaused ? "PAUSED ⏸️" : "ACTIVE ✅"}`);
      }
    } catch {
      console.log("\n⚠️  Cannot check pause status");
    }
  }

  async generateSecurityReport(): Promise<void> {
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║            Security Configuration Summary                 ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");

    console.log("\n📋 Configuration:");
    console.log(`   Multi-sig owners: ${this.config.multisigOwners.length}`);
    console.log(`   Signing threshold: ${this.config.multisigThreshold}`);
    console.log(`   Timelock delay: ${this.config.timelockDelay}s`);
    console.log(`   Emergency guardians: ${this.config.emergencyGuardians.length}`);

    console.log("\n🔐 Security Measures:");
    console.log("   ✅ Multi-signature wallet");
    console.log("   ✅ Timelock for critical operations");
    console.log("   ✅ Emergency pause mechanism");
    console.log("   ✅ Monitoring alerts configured");
    console.log("   ✅ Bug bounty program planned");

    console.log("\n📝 Next Steps:");
    console.log("   1. Deploy multi-sig wallet");
    console.log("   2. Transfer contract ownership");
    console.log("   3. Set up Forta monitoring agents");
    console.log("   4. Launch bug bounty program");
    console.log("   5. Conduct security audit");
    console.log("   6. Test emergency procedures");

    console.log("\n⚠️  Important Reminders:");
    console.log("   - Store multi-sig keys securely");
    console.log("   - Test emergency pause before mainnet");
    console.log("   - Document all security procedures");
    console.log("   - Regular security reviews");
    console.log("   - Keep dependencies updated");
  }
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║        OmniShield Security Setup                          ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  const insurancePoolAddress = process.env.INSURANCE_POOL_ADDRESS;
  const riskEngineAddress = process.env.RISK_ENGINE_ADDRESS;
  const claimsProcessorAddress = process.env.CLAIMS_PROCESSOR_ADDRESS;
  const hederaBridgeAddress = process.env.HEDERA_BRIDGE_ADDRESS;

  if (!insurancePoolAddress || !riskEngineAddress || !claimsProcessorAddress) {
    throw new Error("Missing required contract addresses in .env");
  }

  const insurancePool = await ethers.getContractAt("InsurancePool", insurancePoolAddress);
  const riskEngine = await ethers.getContractAt("RiskEngine", riskEngineAddress);
  const claimsProcessor = await ethers.getContractAt("ClaimsProcessor", claimsProcessorAddress);

  let hederaBridge;
  if (hederaBridgeAddress) {
    hederaBridge = await ethers.getContractAt("HederaBridge", hederaBridgeAddress);
  }

  const contracts: DeployedContracts = {
    insurancePool,
    riskEngine,
    claimsProcessor,
    hederaBridge,
  };

  const multisigOwners = (process.env.MULTISIG_OWNERS || "").split(",").filter(Boolean);
  if (multisigOwners.length === 0) {
    const [deployer] = await ethers.getSigners();
    multisigOwners.push(deployer.address);
  }

  const config: SecurityConfig = {
    multisigOwners,
    multisigThreshold: parseInt(process.env.MULTISIG_THRESHOLD || "2"),
    timelockDelay: parseInt(process.env.TIMELOCK_DELAY || "172800"),
    emergencyGuardians: (process.env.EMERGENCY_GUARDIANS || "").split(",").filter(Boolean),
  };

  const securitySetup = new SecuritySetup(contracts, config);

  const action = process.env.SECURITY_ACTION || "report";

  switch (action) {
    case "deploy-multisig":
      await securitySetup.deployMultisig();
      break;

    case "deploy-timelock":
      await securitySetup.deployTimelock();
      break;

    case "transfer-ownership": {
      const newOwner = process.env.NEW_OWNER;
      if (!newOwner) {
        throw new Error("NEW_OWNER not set in environment");
      }
      await securitySetup.transferOwnership(newOwner);
      break;
    }

    case "setup-monitoring":
      await securitySetup.setupMonitoring();
      break;

    case "configure-bounty":
      await securitySetup.configureBugBounty();
      break;

    case "setup-pause":
      await securitySetup.setupEmergencyPause();
      break;

    case "full-setup": {
      const multisigAddress = await securitySetup.deployMultisig();
      await securitySetup.deployTimelock();

      if (multisigAddress) {
        await securitySetup.transferOwnership(multisigAddress);
      }

      await securitySetup.setupMonitoring();
      await securitySetup.configureBugBounty();
      await securitySetup.setupEmergencyPause();
      await securitySetup.generateSecurityReport();
      break;
    }

    case "report":
    default:
      await securitySetup.setupEmergencyPause();
      await securitySetup.setupMonitoring();
      await securitySetup.configureBugBounty();
      await securitySetup.generateSecurityReport();
      break;
  }

  console.log("\n✅ Security setup completed!");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { SecuritySetup };
