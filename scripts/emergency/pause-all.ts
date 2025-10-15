import { ethers } from "hardhat";
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

interface EmergencyAction {
  timestamp: number;
  action: "pause" | "unpause";
  contract: string;
  network: string;
  executor: string;
  reason?: string;
  txHash: string;
}

async function loadDeployment(networkName: string): Promise<DeploymentAddresses | null> {
  const filePath = path.join(__dirname, "../../deployments", `${networkName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

async function saveEmergencyAction(networkName: string, action: EmergencyAction): Promise<void> {
  const emergencyDir = path.join(__dirname, "../../deployments/emergency");
  if (!fs.existsSync(emergencyDir)) {
    fs.mkdirSync(emergencyDir, { recursive: true });
  }

  const filePath = path.join(emergencyDir, `${networkName}-emergency.json`);
  let actions: EmergencyAction[] = [];

  if (fs.existsSync(filePath)) {
    actions = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  actions.push(action);
  fs.writeFileSync(filePath, JSON.stringify(actions, null, 2));
}

async function pauseContract(
  contractAddress: string,
  contractName: string,
  networkName: string,
  reason?: string
): Promise<string | null> {
  console.log(`\n⏸️  Pausing ${contractName}...`);
  console.log(`   Address: ${contractAddress}`);
  if (reason) {
    console.log(`   Reason: ${reason}`);
  }

  try {
    const contract = await ethers.getContractAt("InsurancePool", contractAddress);
    const [signer] = await ethers.getSigners();

    // Check if already paused
    const isPaused = await contract.paused();
    if (isPaused) {
      console.log("   ℹ️  Contract already paused");
      return null;
    }

    // Pause the contract
    const tx = await contract.pause();
    console.log(`   📝 Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log(`   ✅ Contract paused successfully`);

    // Save emergency action
    await saveEmergencyAction(networkName, {
      timestamp: Date.now(),
      action: "pause",
      contract: contractName,
      network: networkName,
      executor: signer.address,
      reason,
      txHash: tx.hash,
    });

    return tx.hash;
  } catch (error: any) {
    console.error(`   ❌ Pause failed: ${error.message}`);
    return null;
  }
}

async function unpauseContract(
  contractAddress: string,
  contractName: string,
  networkName: string
): Promise<string | null> {
  console.log(`\n▶️  Unpausing ${contractName}...`);
  console.log(`   Address: ${contractAddress}`);

  try {
    const contract = await ethers.getContractAt("InsurancePool", contractAddress);
    const [signer] = await ethers.getSigners();

    // Check if already unpaused
    const isPaused = await contract.paused();
    if (!isPaused) {
      console.log("   ℹ️  Contract already unpaused");
      return null;
    }

    // Unpause the contract
    const tx = await contract.unpause();
    console.log(`   📝 Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log(`   ✅ Contract unpaused successfully`);

    // Save emergency action
    await saveEmergencyAction(networkName, {
      timestamp: Date.now(),
      action: "unpause",
      contract: contractName,
      network: networkName,
      executor: signer.address,
      txHash: tx.hash,
    });

    return tx.hash;
  } catch (error: any) {
    console.error(`   ❌ Unpause failed: ${error.message}`);
    return null;
  }
}

async function checkContractStatus(contractAddress: string, contractName: string): Promise<void> {
  console.log(`\n🔍 Checking ${contractName} status...`);
  console.log(`   Address: ${contractAddress}`);

  try {
    const contract = await ethers.getContractAt("InsurancePool", contractAddress);

    const isPaused = await contract.paused();
    const owner = await contract.owner();
    const poolBalance = await contract.totalPoolBalance();

    console.log(`   Status: ${isPaused ? "⏸️  PAUSED" : "▶️  ACTIVE"}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   Pool Balance: ${ethers.formatEther(poolBalance)} ETH`);
  } catch (error: any) {
    console.error(`   ❌ Status check failed: ${error.message}`);
  }
}

async function main() {
  console.log("🚨 OmniShield Emergency Response Tool\n");
  console.log("═".repeat(80));

  const networkName = process.env.NETWORK || "sepolia";
  const action = process.env.ACTION || "pause"; // pause, unpause, status
  const reason = process.env.REASON;

  console.log(`Network: ${networkName}`);
  console.log(`Action: ${action}`);

  const deployment = await loadDeployment(networkName);
  if (!deployment) {
    console.error(`❌ No deployment found for ${networkName}`);
    process.exit(1);
  }

  if (action === "pause") {
    console.log("\n⚠️  EMERGENCY PAUSE INITIATED");
    if (reason) {
      console.log(`Reason: ${reason}`);
    }

    const confirm = process.env.CONFIRM_EMERGENCY;
    if (confirm !== "yes") {
      console.log("\n❌ Set CONFIRM_EMERGENCY=yes to proceed");
      console.log("   This is a safety measure to prevent accidental execution");
      process.exit(1);
    }

    // Pause InsurancePool
    await pauseContract(deployment.insurancePool, "InsurancePool", networkName, reason);

    // Pause CCIP Bridge if deployed
    if (deployment.ccipBridge) {
      await pauseContract(deployment.ccipBridge, "CCIPBridge", networkName, reason);
    }

    console.log("\n🚨 EMERGENCY PAUSE COMPLETE");
    console.log("   All pausable contracts have been paused");
  } else if (action === "unpause") {
    console.log("\n▶️  RESUMING OPERATIONS");

    const confirm = process.env.CONFIRM_EMERGENCY;
    if (confirm !== "yes") {
      console.log("\n❌ Set CONFIRM_EMERGENCY=yes to proceed");
      process.exit(1);
    }

    // Unpause InsurancePool
    await unpauseContract(deployment.insurancePool, "InsurancePool", networkName);

    // Unpause CCIP Bridge if deployed
    if (deployment.ccipBridge) {
      await unpauseContract(deployment.ccipBridge, "CCIPBridge", networkName);
    }

    console.log("\n✅ OPERATIONS RESUMED");
  } else if (action === "status") {
    console.log("\n📊 Contract Status Report");

    await checkContractStatus(deployment.insurancePool, "InsurancePool");

    if (deployment.ccipBridge) {
      await checkContractStatus(deployment.ccipBridge, "CCIPBridge");
    }
  } else {
    console.error(`❌ Unknown action: ${action}`);
    console.log("   Valid actions: pause, unpause, status");
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
