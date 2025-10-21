import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Testing contract state and msg.value handling...\n");

  // Updated to fixed contract address
  const insurancePoolAddress = "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9";
  // Old broken contract: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"

  const insurancePool = await ethers.getContractAt("HederaInsurancePool", insurancePoolAddress);

  console.log("📊 Contract State:");
  console.log(
    "  Total Pool Balance:",
    ethers.formatEther(await insurancePool.totalPoolBalance()),
    "HBAR"
  );

  const coverageAmount = ethers.parseEther("10");
  const duration = BigInt(30 * 24 * 60 * 60);

  console.log("\n🧮 Premium Calculation:");
  console.log("  Coverage Amount:", ethers.formatEther(coverageAmount), "HBAR");
  console.log("  Coverage Amount (wei):", coverageAmount.toString());
  console.log("  Duration:", duration.toString(), "seconds");

  const premium = await insurancePool.calculatePremium(coverageAmount, duration);
  console.log("  Calculated Premium:", ethers.formatEther(premium), "HBAR");
  console.log("  Premium (wei):", premium.toString());

  // Try to decode the error to understand what's happening
  console.log("\n🔍 Testing with various msg.value amounts...");

  // Test with a very small value first
  const testValues = [
    ethers.parseUnits("1", 8), // 1 tinybar
    ethers.parseUnits("100", 8), // 100 tinybars
    ethers.parseUnits("1", 18), // 1 HBAR in wei
    ethers.parseEther("0.1"), // 0.1 HBAR
    premium, // Exact premium
    premium * 2n, // 2x premium
    coverageAmount, // Full coverage
  ];

  for (const value of testValues) {
    console.log(`\n  Testing with ${ethers.formatEther(value)} HBAR (${value.toString()} wei)...`);
    try {
      const result = await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
        value: value,
        gasLimit: 1000000,
      });
      console.log(`    ✅ SUCCESS! Policy ID would be: ${result}`);
      break;
    } catch (error: any) {
      console.log(`    ❌ Failed:`, error.errorName || error.message?.substring(0, 100));
      if (error.data) {
        console.log(`       Error data: ${error.data}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
