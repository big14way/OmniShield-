import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking RiskEngine configuration...\n");

  // Updated to fixed contract address
  const insurancePoolAddress = "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9";
  // Old broken contract: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"
  const riskEngineAddress = "0x22753E4264FDDc6181dc7cce468904A80a363E44";

  const [signer] = await ethers.getSigners();

  console.log("📍 Contract Addresses:");
  console.log("  Insurance Pool:", insurancePoolAddress);
  console.log("  Risk Engine:", riskEngineAddress);
  console.log("  User:", signer.address);
  console.log("");

  const insurancePool = await ethers.getContractAt("HederaInsurancePool", insurancePoolAddress);
  const riskEngine = await ethers.getContractAt("RiskEngine", riskEngineAddress);

  console.log("🔍 RiskEngine State:");
  try {
    const riskEngineFromPool = await insurancePool.riskEngine();
    console.log("  Risk Engine from Pool:", riskEngineFromPool);
    console.log(
      "  Matches deployment:",
      riskEngineFromPool.toLowerCase() === riskEngineAddress.toLowerCase()
    );
  } catch (error: any) {
    console.log("  ❌ Error reading riskEngine:", error.message);
  }

  console.log("\n🧮 Testing Risk Calculation:");
  const coverageAmount = ethers.parseEther("10");

  try {
    const riskScore = await riskEngine.calculateRisk(signer.address, coverageAmount);
    console.log("  Risk Score:", riskScore.toString());
  } catch (error: any) {
    console.log("  ❌ Error calculating risk:", error.message);
  }

  console.log("\n🔍 Testing isEligibleForCoverage:");
  try {
    const isEligible = await riskEngine.isEligibleForCoverage(signer.address, coverageAmount);
    console.log("  Is Eligible:", isEligible);
  } catch (error: any) {
    console.log("  ❌ Error checking eligibility:", error.message);
  }

  console.log("\n📊 Testing Full Premium Calculation:");
  const duration = BigInt(30 * 24 * 60 * 60);

  try {
    console.log("  Calling calculatePremium from view...");
    const premium = await insurancePool.calculatePremium(coverageAmount, duration);
    console.log("  ✅ Premium:", ethers.formatEther(premium), "HBAR");
    console.log("  ✅ Premium (wei):", premium.toString());
  } catch (error: any) {
    console.log("  ❌ Error calculating premium:", error.message);
    if (error.data) {
      console.log("     Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
