import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DEBUG: Testing createPolicy with different premium amounts...\n");

  // Updated to fixed contract address
  const insurancePoolAddress = "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9";
  // Old broken contract: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"
  const [signer] = await ethers.getSigners();

  console.log("📝 Using account:", signer.address);
  console.log(
    "💰 Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(signer.address)),
    "HBAR\n"
  );

  const insurancePool = await ethers.getContractAt("HederaInsurancePool", insurancePoolAddress);

  const coverageAmount = ethers.parseEther("10");
  const duration = BigInt(30 * 24 * 60 * 60);

  // Calculate premium from view function
  console.log("1️⃣ Calling calculatePremium view function...");
  const viewPremium = await insurancePool.calculatePremium(coverageAmount, duration);
  console.log("   Premium from view:", ethers.formatEther(viewPremium), "HBAR");
  console.log("   Wei:", viewPremium.toString());
  console.log("");

  // Test different multipliers
  const multipliers = [1, 2, 5, 10, 50, 100];

  for (const multiplier of multipliers) {
    const testValue = viewPremium * BigInt(multiplier);
    console.log(
      `\n🧪 Testing with ${multiplier}x premium (${ethers.formatEther(testValue)} HBAR)...`
    );

    try {
      await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
        value: testValue,
      });
      console.log(
        `   ✅ SUCCESS with ${multiplier}x! Transaction would work with ${ethers.formatEther(testValue)} HBAR`
      );
      break;
    } catch (error: any) {
      if (error.data === "0x000875f4") {
        console.log(`   ❌ InsufficientHbarBalance with ${multiplier}x`);
      } else {
        console.log(`   ❌ Different error:`, error.message);
        if (error.data) {
          console.log("      Data:", error.data);
        }
      }
    }
  }

  // Also try sending coverage amount
  console.log(
    `\n🧪 Testing with full coverage amount (${ethers.formatEther(coverageAmount)} HBAR)...`
  );
  try {
    await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
      value: coverageAmount,
    });
    console.log(`   ✅ SUCCESS! Transaction would work with full coverage amount`);
  } catch (error: any) {
    if (error.data === "0x000875f4") {
      console.log(`   ❌ InsufficientHbarBalance even with full coverage amount!`);
    } else {
      console.log(`   ❌ Error:`, error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
