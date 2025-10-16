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

async function loadDeployment(_networkName: string): Promise<DeploymentAddresses | null> {
  const filePath = path.join(__dirname, "../../deployments", `${_networkName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

async function emergencyWithdraw(
  contractAddress: string,
  recipient: string,
  _networkName: string
): Promise<void> {
  console.log("\n🚨 EMERGENCY WITHDRAWAL");
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   Recipient: ${recipient}`);

  // Connect to contract (for future emergency withdrawal implementation)
  const _contract = await ethers.getContractAt("InsurancePool", contractAddress);
  const [_signer] = await ethers.getSigners();

  // Check current balance
  const balance = await ethers.provider.getBalance(contractAddress);
  console.log(`   Contract Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.log("   ℹ️  No funds to withdraw");
    return;
  }

  try {
    // Attempt emergency withdrawal (requires emergency withdraw function)
    console.log("   🔄 Initiating withdrawal...");

    // Note: This requires an emergencyWithdraw function in the contract
    // If not available, funds can only be withdrawn through normal claim process

    console.log("   ⚠️  Emergency withdrawal requires special contract function");
    console.log("   📋 Consider pausing contract and processing claims normally");
  } catch (error: any) {
    console.error(`   ❌ Withdrawal failed: ${error.message}`);
  }
}

async function transferOwnership(
  contractAddress: string,
  newOwner: string,
  _networkName: string
): Promise<void> {
  console.log("\n👤 TRANSFERRING OWNERSHIP");
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   New Owner: ${newOwner}`);

  const contract = await ethers.getContractAt("InsurancePool", contractAddress);

  try {
    const currentOwner = await contract.owner();
    console.log(`   Current Owner: ${currentOwner}`);

    const tx = await contract.transferOwnership(newOwner);
    console.log(`   📝 Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log(`   ✅ Ownership transferred successfully`);
  } catch (error: any) {
    console.error(`   ❌ Transfer failed: ${error.message}`);
  }
}

async function main() {
  console.log("🚨 OmniShield Emergency Fund Management\n");
  console.log("═".repeat(80));

  const networkName = process.env.NETWORK || "sepolia";
  const action = process.env.ACTION || "status"; // withdraw, transfer
  const recipient = process.env.RECIPIENT;

  const deployment = await loadDeployment(networkName);
  if (!deployment) {
    console.error(`❌ No deployment found for ${networkName}`);
    process.exit(1);
  }

  if (action === "withdraw") {
    if (!recipient) {
      console.error("❌ RECIPIENT address required for withdrawal");
      process.exit(1);
    }

    const confirm = process.env.CONFIRM_EMERGENCY;
    if (confirm !== "yes") {
      console.log("\n❌ Set CONFIRM_EMERGENCY=yes to proceed");
      process.exit(1);
    }

    await emergencyWithdraw(deployment.insurancePool, recipient, networkName);
  } else if (action === "transfer") {
    if (!recipient) {
      console.error("❌ RECIPIENT address required for ownership transfer");
      process.exit(1);
    }

    const confirm = process.env.CONFIRM_EMERGENCY;
    if (confirm !== "yes") {
      console.log("\n❌ Set CONFIRM_EMERGENCY=yes to proceed");
      process.exit(1);
    }

    await transferOwnership(deployment.insurancePool, recipient, networkName);
  } else {
    console.log("📊 Fund Status Report");

    const balance = await ethers.provider.getBalance(deployment.insurancePool);
    const contract = await ethers.getContractAt("InsurancePool", deployment.insurancePool);
    const owner = await contract.owner();

    console.log(`\n   Contract: ${deployment.insurancePool}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`   Owner: ${owner}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
