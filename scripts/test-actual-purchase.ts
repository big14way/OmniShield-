import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing with signer:", signer.address);

  const insurancePool = await ethers.getContractAt(
    "InsurancePool",
    "0xA7c59f010700930003b33aB25a7a0679C860f29c"
  );

  const coverageAmount = ethers.parseEther("10");
  const duration = 30 * 24 * 60 * 60; // 30 days

  console.log("\n📊 Parameters:");
  console.log("Coverage:", ethers.formatEther(coverageAmount), "ETH");
  console.log("Duration:", duration, "seconds");

  // Calculate premium
  const premium = await insurancePool.calculatePremium(coverageAmount, duration);
  console.log("\nPremium:", ethers.formatEther(premium), "ETH");

  // Check balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  if (balance < premium) {
    console.log("❌ Insufficient balance!");
    return;
  }

  // Try to actually make the purchase
  console.log("\n🔄 Attempting to create policy...");
  try {
    const tx = await insurancePool.createPolicy(coverageAmount, duration, {
      value: premium,
      gasLimit: 500000,
    });

    console.log("✅ Transaction submitted:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Block:", receipt?.blockNumber);
    console.log("Gas used:", receipt?.gasUsed.toString());
    console.log("Status:", receipt?.status === 1 ? "SUCCESS" : "REVERTED");

    if (receipt?.logs) {
      console.log("\nEvents emitted:", receipt.logs.length);
      for (const log of receipt.logs) {
        try {
          const parsed = insurancePool.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          console.log("Event:", parsed?.name, parsed?.args);
        } catch {
          // Skip unparseable logs
        }
      }
    }
  } catch (error: any) {
    console.error("\n❌ Transaction failed!");
    console.error("Error:", error.message);

    if (error.reason) {
      console.error("Reason:", error.reason);
    }

    if (error.data) {
      console.error("Data:", error.data);
    }

    // Try to decode revert reason
    if (error.data && typeof error.data === "string") {
      try {
        // Check if it's a standard Error(string) revert
        if (error.data.startsWith("0x08c379a0")) {
          const reason = ethers.AbiCoder.defaultAbiCoder().decode(
            ["string"],
            "0x" + error.data.slice(10)
          );
          console.error("\n🔴 Revert reason:", reason[0]);
        }
      } catch {
        console.error("Could not decode revert reason");
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
