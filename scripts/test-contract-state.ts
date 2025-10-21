import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Checking HederaInsurancePool state...\n");

  // Updated to fixed contract address
  const insurancePoolAddress = "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9";
  // Old broken contract: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"
  const [signer] = await ethers.getSigners();

  const insurancePool = await ethers.getContractAt("HederaInsurancePool", insurancePoolAddress);

  console.log("📝 Using account:", signer.address);
  console.log("");

  // Check if contract is paused
  console.log("1️⃣ Checking if contract is paused...");
  try {
    const paused = await insurancePool.paused();
    console.log("   Paused:", paused);
  } catch {
    console.log("   Could not check paused status");
  }
  console.log("");

  // Check total pool balance
  console.log("2️⃣ Checking pool balance...");
  const poolBalance = await insurancePool.totalPoolBalance();
  console.log("   Total Pool Balance:", ethers.formatEther(poolBalance), "HBAR");
  console.log(
    "   Contract HBAR Balance:",
    ethers.formatEther(await ethers.provider.getBalance(insurancePoolAddress)),
    "HBAR"
  );
  console.log("");

  // Check if there's a minimum pool balance requirement
  console.log("3️⃣ Trying to add liquidity first...");
  try {
    const liquidityAmount = ethers.parseEther("50"); // Add 50 HBAR
    console.log("   Adding", ethers.formatEther(liquidityAmount), "HBAR liquidity...");

    const tx = await insurancePool.addLiquidity({ value: liquidityAmount });
    console.log("   Transaction sent:", tx.hash);
    await tx.wait();
    console.log("   ✅ Liquidity added successfully!");

    const newPoolBalance = await insurancePool.totalPoolBalance();
    console.log("   New Pool Balance:", ethers.formatEther(newPoolBalance), "HBAR");
  } catch (error: any) {
    console.log("   ❌ Failed to add liquidity:", error.message);
  }
  console.log("");

  // Now try creating policy again
  console.log("4️⃣ Trying createPolicy after adding liquidity...");
  const coverageAmount = ethers.parseEther("10");
  const duration = BigInt(30 * 24 * 60 * 60);
  const premium = await insurancePool.calculatePremium(coverageAmount, duration);

  console.log("   Premium:", ethers.formatEther(premium), "HBAR");
  console.log("   Sending 2x premium:", ethers.formatEther(premium * 2n), "HBAR");

  try {
    await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
      value: premium * 2n,
    });
    console.log("   ✅ Static call succeeded!");
  } catch (error: any) {
    console.log("   ❌ Static call failed:", error.message);
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
