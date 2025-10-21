import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying FIXED HederaInsurancePool to Hedera Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "HBAR\n"
  );

  // Use existing RiskEngine from previous deployment
  const riskEngineAddress = "0x22753E4264FDDc6181dc7cce468904A80a363E44";
  const treasuryAddress = deployer.address;
  const htsTokenAddress = ethers.ZeroAddress;
  const consensusTopicId = ethers.ZeroHash;

  console.log("📋 Configuration:");
  console.log("  Risk Engine:", riskEngineAddress);
  console.log("  Treasury:", treasuryAddress);
  console.log("  HTS Token:", htsTokenAddress);
  console.log("  Consensus Topic:", consensusTopicId);
  console.log("");

  console.log("⏳ Deploying HederaInsurancePoolFixed...");
  const HederaInsurancePoolFixed = await ethers.getContractFactory("HederaInsurancePoolFixed");
  const insurancePool = await HederaInsurancePoolFixed.deploy(
    riskEngineAddress,
    treasuryAddress,
    htsTokenAddress,
    consensusTopicId
  );

  await insurancePool.waitForDeployment();
  const address = await insurancePool.getAddress();

  console.log("✅ HederaInsurancePoolFixed deployed at:", address);
  console.log("");

  // Test the contract
  console.log("🧪 Testing the fixed contract...");
  const coverageAmount = ethers.parseEther("10");
  const duration = BigInt(30 * 24 * 60 * 60);
  const testValue = ethers.parseEther("0.1"); // Send 0.1 HBAR

  console.log("  Coverage:", ethers.formatEther(coverageAmount), "HBAR");
  console.log("  Duration:", duration.toString(), "seconds (30 days)");
  console.log("  Sending:", ethers.formatEther(testValue), "HBAR");
  console.log("");

  try {
    console.log("  Testing staticCall...");
    const policyId = await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
      value: testValue,
    });
    console.log("  ✅ SUCCESS! Would create policy ID:", policyId.toString());
    console.log("");

    console.log("  Creating actual policy...");
    const tx = await insurancePool.createPolicy(coverageAmount, duration, {
      value: testValue,
      gasLimit: 1000000,
    });
    console.log("  📤 Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("  ✅ Transaction confirmed!");
    console.log("  ⛽ Gas used:", receipt?.gasUsed.toString());
    console.log("");
  } catch (error: any) {
    console.log("  ❌ Test failed:", error.message);
  }

  console.log("🎉 Deployment complete!");
  console.log("");
  console.log("📝 Next steps:");
  console.log("  1. Update frontend/src/lib/web3/contracts.ts");
  console.log("  2. Change insurancePool address to:", address);
  console.log("  3. Test the purchase flow in the frontend");
  console.log("");
  console.log("🔗 View on HashScan:");
  console.log("  https://hashscan.io/testnet/contract/" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
