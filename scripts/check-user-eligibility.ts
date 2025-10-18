import { ethers } from "hardhat";

async function main() {
  // This is the address from the failed transaction receipt
  const userAddress = "0x85e271306a058020f0ebb30c45afd073400e85e5";
  
  console.log("Checking eligibility for address:", userAddress);
  
  const insurancePool = await ethers.getContractAt(
    "InsurancePool",
    "0xA7c59f010700930003b33aB25a7a0679C860f29c"
  );
  
  const riskEngine = await ethers.getContractAt(
    "RiskEngine",
    "0x22753E4264FDDc6181dc7cce468904A80a363E44"
  );
  
  // Test with 10 ETH coverage
  const coverageAmount = ethers.parseEther("10");
  const duration = 30 * 24 * 60 * 60; // 30 days
  
  console.log("\n📊 Parameters:");
  console.log("Coverage:", ethers.formatEther(coverageAmount), "ETH");
  console.log("Duration:", duration, "seconds");
  
  // Check risk profile
  console.log("\n🔍 Risk Profile:");
  const profile = await riskEngine.getRiskProfile(userAddress);
  console.log("isActive:", profile.isActive);
  console.log("riskScore:", profile.riskScore.toString());
  console.log("lastUpdated:", profile.lastUpdated.toString());
  
  // Check eligibility
  console.log("\n✅ Eligibility Check:");
  const eligible = await riskEngine.isEligibleForCoverage(userAddress, coverageAmount);
  console.log("Eligible:", eligible);
  
  if (!eligible) {
    console.log("\n❌ USER IS NOT ELIGIBLE!");
    console.log("This is why the transaction reverts.");
    console.log("The risk score is too high for this coverage amount.");
    console.log("\nSolutions:");
    console.log("1. Try lower coverage amount (e.g., 1 ETH)");
    console.log("2. Contact admin to reset risk profile");
    console.log("3. Wait for risk score to decay over time");
  }
  
  // Calculate premium
  console.log("\n💰 Premium Calculation:");
  try {
    const premium = await insurancePool.calculatePremium(coverageAmount, duration);
    console.log("Premium:", ethers.formatEther(premium), "ETH");
    console.log("Premium Wei:", premium.toString());
  } catch (error: any) {
    console.error("Error calculating premium:", error.message);
  }
  
  // Test with smaller amounts
  console.log("\n🔄 Testing with different coverage amounts:");
  const testAmounts = ["1", "5", "10", "20"];
  
  for (const amount of testAmounts) {
    const coverage = ethers.parseEther(amount);
    try {
      const isEligible = await riskEngine.isEligibleForCoverage(userAddress, coverage);
      const premium = await insurancePool.calculatePremium(coverage, duration);
      console.log(`${amount} ETH: ${isEligible ? '✅' : '❌'} (Premium: ${ethers.formatEther(premium)} ETH)`);
    } catch (error: any) {
      console.log(`${amount} ETH: ❌ Error - ${error.message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
