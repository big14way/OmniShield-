import { ethers } from "hardhat";

async function main() {
  const userAddress = "0x85e271306a058020f0ebb30c45afd073400e85e5";
  const insurancePoolAddress = "0xA7c59f010700930003b33aB25a7a0679C860f29c";
  const riskEngineAddress = "0x22753E4264FDDc6181dc7cce468904A80a363E44";

  console.log("🔍 Debugging for user:", userAddress);
  console.log("InsurancePool:", insurancePoolAddress);
  console.log("RiskEngine:", riskEngineAddress);

  const insurancePool = await ethers.getContractAt("InsurancePool", insurancePoolAddress);
  const riskEngine = await ethers.getContractAt("RiskEngine", riskEngineAddress);

  // Test parameters that should match frontend
  const coverageAmount = ethers.parseEther("10");
  const duration = 30 * 24 * 60 * 60;

  console.log("\n📊 Parameters:");
  console.log("Coverage:", ethers.formatEther(coverageAmount), "ETH");
  console.log("Coverage Wei:", coverageAmount.toString());
  console.log("Duration:", duration, "seconds");

  // Step 1: Check if contract is paused
  console.log("\n1️⃣ Checking if contract is paused...");
  const paused = await insurancePool.paused();
  console.log("Paused:", paused);
  if (paused) {
    console.log("❌ CONTRACT IS PAUSED - This is the problem!");
    return;
  }

  // Step 2: Check coverage amount > 0
  console.log("\n2️⃣ Checking coverage amount > 0...");
  console.log("Coverage > 0:", coverageAmount > 0n);

  // Step 3: Check duration > 0
  console.log("\n3️⃣ Checking duration > 0...");
  console.log("Duration > 0:", duration > 0);

  // Step 4: Check eligibility
  console.log("\n4️⃣ Checking eligibility...");
  const profile = await riskEngine.getRiskProfile(userAddress);
  console.log("Risk Profile:", {
    isActive: profile.isActive,
    riskScore: profile.riskScore.toString(),
    lastUpdated: profile.lastUpdated.toString(),
  });

  const eligible = await riskEngine.isEligibleForCoverage(userAddress, coverageAmount);
  console.log("Eligible:", eligible);
  if (!eligible) {
    console.log("❌ NOT ELIGIBLE - This is the problem!");
    return;
  }

  // Step 5: Calculate premium
  console.log("\n5️⃣ Calculating premium...");
  const premium = await insurancePool.calculatePremium(coverageAmount, duration);
  console.log("Premium:", ethers.formatEther(premium), "ETH");
  console.log("Premium Wei:", premium.toString());

  // Step 6: Check if premium matches what's being sent
  console.log("\n6️⃣ Frontend should send EXACTLY:");
  console.log("Function: createPolicy(uint256,uint256)");
  console.log("Arg 1 (coverageAmount):", coverageAmount.toString());
  console.log("Arg 2 (duration):", duration.toString());
  console.log("Value (msg.value):", premium.toString());

  // Step 7: Try to simulate the call
  console.log("\n7️⃣ Simulating transaction...");
  try {
    // Use staticCall to simulate without sending transaction
    const result = await insurancePool.createPolicy.staticCall(coverageAmount, duration, {
      value: premium,
      from: userAddress,
    });
    console.log("✅ Static call succeeded! Would create policy:", result.toString());
    console.log("\nThis means the contract SHOULD work.");
    console.log("The issue might be in how the frontend encodes the transaction.");
  } catch (error: any) {
    console.error("❌ Static call failed!");
    console.error("Error:", error.message);

    if (error.data) {
      console.error("Error data:", error.data);

      // Try to decode if it's a require/revert message
      try {
        if (typeof error.data === "string" && error.data.startsWith("0x08c379a0")) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
            ["string"],
            "0x" + error.data.slice(10)
          );
          console.error("\n🔴 REVERT REASON:", decoded[0]);
        }
      } catch {
        // Ignore decode errors
      }
    }

    console.log("\n🔍 This is the root cause of the revert!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
