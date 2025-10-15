import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  insurancePool: string;
  riskEngine: string;
  pythPriceConsumer?: string;
  ccipBridge?: string;
  deployedAt: number;
  chainId: number;
  network: string;
}

interface UpgradeRecord {
  timestamp: number;
  previousImplementation: string;
  newImplementation: string;
  proxyAddress: string;
  contractName: string;
  upgrader: string;
}

async function loadDeployment(networkName: string): Promise<DeploymentAddresses | null> {
  const filePath = path.join(__dirname, "../../deployments", `${networkName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

async function saveUpgradeRecord(networkName: string, record: UpgradeRecord): Promise<void> {
  const upgradesDir = path.join(__dirname, "../../deployments/upgrades");
  if (!fs.existsSync(upgradesDir)) {
    fs.mkdirSync(upgradesDir, { recursive: true });
  }

  const filePath = path.join(upgradesDir, `${networkName}-upgrades.json`);
  let upgrades: UpgradeRecord[] = [];

  if (fs.existsSync(filePath)) {
    upgrades = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  upgrades.push(record);
  fs.writeFileSync(filePath, JSON.stringify(upgrades, null, 2));
  console.log(`  💾 Upgrade record saved`);
}

async function upgradeInsurancePool(proxyAddress: string, networkName: string): Promise<string> {
  console.log("\n📋 Upgrading InsurancePool...");
  console.log(`   Proxy: ${proxyAddress}`);

  const [deployer] = await ethers.getSigners();

  // Get the new implementation
  const InsurancePoolV2 = await ethers.getContractFactory("InsurancePool");

  // Get current implementation address
  const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`   Current implementation: ${currentImpl}`);

  // Upgrade the proxy
  console.log("   🔄 Upgrading...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, InsurancePoolV2);
  await upgraded.waitForDeployment();

  // Get new implementation address
  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`   ✅ New implementation: ${newImpl}`);

  // Save upgrade record
  await saveUpgradeRecord(networkName, {
    timestamp: Date.now(),
    previousImplementation: currentImpl,
    newImplementation: newImpl,
    proxyAddress,
    contractName: "InsurancePool",
    upgrader: deployer.address,
  });

  return newImpl;
}

async function upgradeRiskEngine(proxyAddress: string, networkName: string): Promise<string> {
  console.log("\n📋 Upgrading RiskEngine...");
  console.log(`   Proxy: ${proxyAddress}`);

  const [deployer] = await ethers.getSigners();

  const RiskEngineV2 = await ethers.getContractFactory("RiskEngine");
  const currentImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`   Current implementation: ${currentImpl}`);

  console.log("   🔄 Upgrading...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, RiskEngineV2);
  await upgraded.waitForDeployment();

  const newImpl = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`   ✅ New implementation: ${newImpl}`);

  await saveUpgradeRecord(networkName, {
    timestamp: Date.now(),
    previousImplementation: currentImpl,
    newImplementation: newImpl,
    proxyAddress,
    contractName: "RiskEngine",
    upgrader: deployer.address,
  });

  return newImpl;
}

async function validateUpgrade(proxyAddress: string, contractName: string): Promise<boolean> {
  console.log(`\n🔍 Validating ${contractName} upgrade...`);

  try {
    const ContractFactory = await ethers.getContractFactory(contractName);
    await upgrades.validateUpgrade(proxyAddress, ContractFactory);
    console.log("   ✅ Upgrade validation passed");
    return true;
  } catch (error: any) {
    console.error(`   ❌ Upgrade validation failed: ${error.message}`);
    return false;
  }
}

async function proposeUpgrade(
  proxyAddress: string,
  contractName: string,
  multisigAddress: string
): Promise<void> {
  console.log(`\n📝 Proposing ${contractName} upgrade to multisig...`);
  console.log(`   Multisig: ${multisigAddress}`);

  const ContractFactory = await ethers.getContractFactory(contractName);

  try {
    const proposal = await upgrades.prepareUpgrade(proxyAddress, ContractFactory);
    console.log(`   ✅ Upgrade proposal prepared`);
    console.log(`   📋 New implementation: ${proposal}`);
    console.log(
      `\n   Next steps:\n   1. Submit this implementation address to multisig\n   2. Execute upgrade through multisig`
    );
  } catch (error: any) {
    console.error(`   ❌ Proposal failed: ${error.message}`);
  }
}

async function forceImportProxy(proxyAddress: string, contractName: string): Promise<void> {
  console.log(`\n🔄 Force importing ${contractName} proxy...`);

  const ContractFactory = await ethers.getContractFactory(contractName);

  try {
    await upgrades.forceImport(proxyAddress, ContractFactory);
    console.log("   ✅ Proxy imported successfully");
  } catch (error: any) {
    console.error(`   ❌ Import failed: ${error.message}`);
  }
}

async function main() {
  console.log("🔄 OmniShield Contract Upgrade Tool\n");
  console.log("═".repeat(80));

  const networkName = process.env.NETWORK || "sepolia";
  const action = process.env.ACTION || "upgrade"; // upgrade, validate, propose, import
  const contract = process.env.CONTRACT || "all"; // all, insurancePool, riskEngine

  console.log(`Network: ${networkName}`);
  console.log(`Action: ${action}`);
  console.log(`Contract: ${contract}`);

  const deployment = await loadDeployment(networkName);
  if (!deployment) {
    console.error(`❌ No deployment found for ${networkName}`);
    process.exit(1);
  }

  const multisig = process.env.MULTISIG_ADDRESS;

  if (action === "validate") {
    // Validate upgrades
    if (contract === "all" || contract === "insurancePool") {
      await validateUpgrade(deployment.insurancePool, "InsurancePool");
    }
    if (contract === "all" || contract === "riskEngine") {
      await validateUpgrade(deployment.riskEngine, "RiskEngine");
    }
  } else if (action === "propose") {
    // Propose upgrades to multisig
    if (!multisig) {
      console.error("❌ MULTISIG_ADDRESS environment variable required for propose action");
      process.exit(1);
    }

    if (contract === "all" || contract === "insurancePool") {
      await proposeUpgrade(deployment.insurancePool, "InsurancePool", multisig);
    }
    if (contract === "all" || contract === "riskEngine") {
      await proposeUpgrade(deployment.riskEngine, "RiskEngine", multisig);
    }
  } else if (action === "import") {
    // Force import existing proxies
    if (contract === "all" || contract === "insurancePool") {
      await forceImportProxy(deployment.insurancePool, "InsurancePool");
    }
    if (contract === "all" || contract === "riskEngine") {
      await forceImportProxy(deployment.riskEngine, "RiskEngine");
    }
  } else if (action === "upgrade") {
    // Perform upgrades
    console.log("\n⚠️  WARNING: This will upgrade contracts immediately!");
    console.log("   Ensure you have tested on testnet first.");

    const confirm = process.env.CONFIRM_UPGRADE;
    if (confirm !== "yes") {
      console.log("\n❌ Set CONFIRM_UPGRADE=yes to proceed");
      process.exit(1);
    }

    if (contract === "all" || contract === "insurancePool") {
      await upgradeInsurancePool(deployment.insurancePool, networkName);
    }
    if (contract === "all" || contract === "riskEngine") {
      await upgradeRiskEngine(deployment.riskEngine, networkName);
    }

    console.log("\n✅ Upgrades complete!");
  } else {
    console.error(`❌ Unknown action: ${action}`);
    console.log("   Valid actions: upgrade, validate, propose, import");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
