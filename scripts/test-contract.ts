import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Testing HederaInsurancePool contract...\n");

  // Updated to fixed contract address
  const insurancePoolAddress = "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9";
  // Old broken contract: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"
  const riskEngineAddress = "0x22753E4264FDDc6181dc7cce468904A80a363E44";

  const [signer] = await ethers.getSigners();
  console.log("📝 Using account:", signer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(signer.address)),
    "HBAR\n"
  );

  // Get contract instances
  const insurancePool = await ethers.getContractAt("HederaInsurancePool", insurancePoolAddress);
  const riskEngine = await ethers.getContractAt("RiskEngine", riskEngineAddress);

  console.log("📋 Contract Addresses:");
  console.log("   InsurancePool:", insurancePoolAddress);
  console.log("   RiskEngine:", riskEngineAddress);
  console.log("");

  // Check if contracts exist
  const poolCode = await ethers.provider.getCode(insurancePoolAddress);
  const riskEngineCode = await ethers.provider.getCode(riskEngineAddress);

  console.log("✅ Contract Code Check:");
  console.log("   InsurancePool exists:", poolCode !== "0x");
  console.log("   RiskEngine exists:", riskEngineCode !== "0x");
  console.log("");

  // Test parameters (same as frontend would use)
  const coverageAmount = ethers.parseEther("10"); // 10 ETH worth
  const duration = BigInt(30 * 24 * 60 * 60); // 30 days in seconds

  console.log("🧪 Test Parameters:");
  console.log("   Coverage Amount:", ethers.formatEther(coverageAmount), "ETH");
  console.log("   Duration:", duration.toString(), "seconds (30 days)");
  console.log("");

  try {
    // Test 1: Check eligibility
    console.log("1️⃣ Testing isEligibleForCoverage...");
    const isEligible = await riskEngine.isEligibleForCoverage(signer.address, coverageAmount);
    console.log("   ✅ Eligible:", isEligible);
    console.log("");

    // Test 2: Calculate premium
    console.log("2️⃣ Testing calculatePremium...");
    const premium = await insurancePool.calculatePremium(coverageAmount, duration);
    console.log("   ✅ Premium:", ethers.formatEther(premium), "HBAR");
    console.log("   💵 Premium in wei:", premium.toString());
    console.log("");

    // Test 3: Check pool balance
    console.log("3️⃣ Checking pool balance...");
    const poolBalance = await insurancePool.totalPoolBalance();
    console.log("   Pool Balance:", ethers.formatEther(poolBalance), "HBAR");
    console.log("");

    // Test 4: Try to create policy (simulation)
    console.log("4️⃣ Simulating createPolicy transaction...");
    const premiumWith10PercentBuffer = premium + premium / 10n;
    console.log(
      "   Sending:",
      ethers.formatEther(premiumWith10PercentBuffer),
      "HBAR (110% of premium)"
    );

    try {
      // Try static call first to see if it would revert
      await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
        value: premiumWith10PercentBuffer,
      });
      console.log("   ✅ Static call succeeded - transaction should work!");
    } catch (error: any) {
      console.log("   ❌ Static call failed:");
      console.log("   Error:", error.message);

      // Try to get revert reason
      if (error.data) {
        console.log("   Revert data:", error.data);
      }
    }
  } catch (error: any) {
    console.error("\n❌ Error during testing:");
    console.error(error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
