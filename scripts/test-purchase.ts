import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing with address:", signer.address);
  
  const insurancePool = await ethers.getContractAt(
    "InsurancePool",
    "0xA7c59f010700930003b33aB25a7a0679C860f29c"
  );
  
  const riskEngine = await ethers.getContractAt(
    "RiskEngine",
    "0x22753E4264FDDc6181dc7cce468904A80a363E44"
  );
  
  // Test parameters
  const coverageAmount = ethers.parseEther("10"); // 10 ETH/HBAR
  const duration = 30 * 24 * 60 * 60; // 30 days in seconds
  
  console.log("\n📊 Testing Parameters:");
  console.log("Coverage Amount:", ethers.formatEther(coverageAmount), "ETH");
  console.log("Duration:", duration, "seconds (30 days)");
  
  // Check risk profile
  console.log("\n🔍 Checking Risk Profile...");
  const profile = await riskEngine.getRiskProfile(signer.address);
  console.log("Risk Profile:", {
    isActive: profile.isActive,
    riskScore: profile.riskScore.toString(),
    lastUpdated: profile.lastUpdated.toString(),
  });
  
  // Check eligibility
  console.log("\n✅ Checking Eligibility...");
  try {
    const eligible = await riskEngine.isEligibleForCoverage(signer.address, coverageAmount);
    console.log("Eligible:", eligible);
    
    if (!eligible) {
      console.log("❌ NOT ELIGIBLE - This is why the transaction is reverting!");
      console.log("Risk score is too high for this coverage amount");
    }
  } catch (error) {
    console.error("Error checking eligibility:", error);
  }
  
  // Calculate premium
  console.log("\n💰 Calculating Premium...");
  try {
    const premium = await insurancePool.calculatePremium(coverageAmount, duration);
    console.log("Premium:", ethers.formatEther(premium), "ETH");
    console.log("Premium Wei:", premium.toString());
    
    // Check if we can afford it
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("Your Balance:", ethers.formatEther(balance), "ETH");
    console.log("Can Afford:", balance >= premium);
  } catch (error) {
    console.error("Error calculating premium:", error);
  }
  
  // Try with smaller amount
  console.log("\n🔄 Testing with smaller coverage (1 ETH)...");
  const smallCoverage = ethers.parseEther("1");
  try {
    const eligible = await riskEngine.isEligibleForCoverage(signer.address, smallCoverage);
    console.log("Eligible for 1 ETH:", eligible);
    
    const premium = await insurancePool.calculatePremium(smallCoverage, duration);
    console.log("Premium for 1 ETH:", ethers.formatEther(premium), "ETH");
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
