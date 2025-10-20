import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("========================================");
  console.log("🌐 OmniShield Hedera Simple Deployment");
  console.log("========================================\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "HBAR\n");

  // Use existing RiskEngine address from env
  const riskEngineAddress =
    process.env.NEXT_PUBLIC_HEDERA_RISK_ENGINE || "0x22753E4264FDDc6181dc7cce468904A80a363E44";
  console.log("✅ Using existing RiskEngine:", riskEngineAddress);

  // Treasury account (using deployer address)
  const treasuryAccount = deployer.address;
  console.log("✅ Treasury account:", treasuryAccount);

  // Mock HTS token address (use zero address or mock)
  const htsTokenAddress = ethers.ZeroAddress;
  console.log("✅ HTS Token:", htsTokenAddress, "(using zero address)");

  // Mock consensus topic (32 bytes)
  const consensusTopicId = ethers.zeroPadValue("0x00", 32);
  console.log("✅ Consensus Topic:", consensusTopicId, "(using zero bytes)\n");

  console.log("🚀 Deploying HederaInsurancePool...\n");

  const HederaInsurancePool = await ethers.getContractFactory("HederaInsurancePool");

  const hederaPool = await HederaInsurancePool.deploy(
    riskEngineAddress,
    treasuryAccount,
    htsTokenAddress,
    consensusTopicId
  );

  await hederaPool.waitForDeployment();
  const contractAddress = await hederaPool.getAddress();

  console.log("========================================");
  console.log("✅ Deployment Successful!");
  console.log("========================================\n");
  console.log("📝 Contract Addresses:");
  console.log("   HederaInsurancePool:", contractAddress);
  console.log("   RiskEngine:", riskEngineAddress);
  console.log("   Treasury:", treasuryAccount);
  console.log("\n🔗 HashScan:");
  console.log(`   https://hashscan.io/testnet/contract/${contractAddress}`);

  // Save deployment info
  const deploymentInfo = {
    network: "hederaTestnet",
    chainId: 296,
    hederaInsurancePool: contractAddress,
    riskEngine: riskEngineAddress,
    treasury: treasuryAccount,
    htsToken: htsTokenAddress,
    consensusTopic: consensusTopicId,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const outputPath = path.join(deploymentsDir, "hedera-simple.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n💾 Deployment info saved to: ${outputPath}`);

  console.log("\n========================================");
  console.log("🎯 NEXT STEPS:");
  console.log("========================================");
  console.log(`\n1. Update frontend/src/lib/web3/contracts.ts:`);
  console.log(`   insurancePool: "${contractAddress}",`);
  console.log(`\n2. Restart frontend:`);
  console.log(`   cd frontend && rm -rf .next && npm run dev`);
  console.log(`\n3. Hard refresh browser: Cmd+Shift+R`);
  console.log("\n========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
