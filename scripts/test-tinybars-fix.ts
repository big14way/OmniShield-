import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Testing tinybars conversion fix...\n");

  // Updated to fixed contract address
  const insurancePoolAddress = "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9";
  // Old broken contract: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"

  const insurancePool = await ethers.getContractAt("HederaInsurancePool", insurancePoolAddress);

  const coverageAmount = ethers.parseEther("10");
  const duration = BigInt(30 * 24 * 60 * 60);

  console.log("1️⃣ Calculate premium...");
  const premiumWei = await insurancePool.calculatePremium(coverageAmount, duration);
  console.log("   Premium (wei/18 decimals):", premiumWei.toString());
  console.log("   Premium in HBAR:", ethers.formatEther(premiumWei));

  // Convert to tinybars (8 decimals)
  const premiumTinybars = premiumWei / 10n ** 10n;
  console.log("   Premium (tinybars/8 decimals):", premiumTinybars.toString());
  console.log("   Premium in HBAR:", (Number(premiumTinybars) / 1e8).toFixed(8));
  console.log("");

  // Send 2x tinybars
  const valueToSend = premiumTinybars * 2n;
  console.log("2️⃣ Sending 2x premium in tinybars...");
  console.log("   Value:", valueToSend.toString(), "tinybars");
  console.log("   In HBAR:", (Number(valueToSend) / 1e8).toFixed(8));
  console.log("");

  console.log("3️⃣ Testing static call...");
  try {
    await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
      value: valueToSend,
    });
    console.log("   ✅ SUCCESS! Transaction would work!");
  } catch (error: any) {
    console.log("   ❌ Failed:", error.message);
    if (error.data) {
      console.log("   Error data:", error.data);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
