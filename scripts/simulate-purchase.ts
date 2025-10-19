import { ethers } from "hardhat";

async function main() {
  // User's address from the failing transaction
  const userAddress = "0x85e271306a058020f0ebb30c45afd073400e85e5";

  const insurancePool = await ethers.getContractAt(
    "InsurancePool",
    "0xA7c59f010700930003b33aB25a7a0679C860f29c"
  );

  const coverageAmount = ethers.parseEther("10");
  const duration = 30 * 24 * 60 * 60; // 30 days

  console.log("Simulating purchase...");
  console.log("User:", userAddress);
  console.log("Coverage:", ethers.formatEther(coverageAmount), "ETH");
  console.log("Duration:", duration, "seconds\n");

  // Calculate premium
  const premium = await insurancePool.calculatePremium(coverageAmount, duration);
  console.log("Premium:", ethers.formatEther(premium), "ETH");
  console.log("Premium Wei:", premium.toString(), "\n");

  // Try to estimate gas (this will fail if the transaction would revert)
  console.log("Attempting to estimate gas...");
  try {
    const gasEstimate = await insurancePool.createPolicy.estimateGas(coverageAmount, duration, {
      value: premium,
      from: userAddress,
    });
    console.log("✅ Gas estimate:", gasEstimate.toString());
    console.log("Transaction should succeed!");
  } catch (error: any) {
    console.error("\n❌ Gas estimation failed!");
    console.error("This means the transaction WILL revert.");
    console.error("\nError:", error.message);

    // Try to extract revert reason
    if (error.data) {
      try {
        const reason = ethers.toUtf8String("0x" + error.data.slice(138));
        console.error("Revert reason:", reason);
      } catch {
        console.error("Raw error data:", error.data);
      }
    }

    // Try with different premium amounts
    console.log("\n🔄 Testing with different premium amounts:");
    const premiums = [
      { label: "Calculated premium", value: premium },
      { label: "Calculated + 10%", value: (premium * 110n) / 100n },
      { label: "Calculated + 50%", value: (premium * 150n) / 100n },
      { label: "Calculated + 100%", value: premium * 2n },
    ];

    for (const { label, value } of premiums) {
      try {
        await insurancePool.createPolicy.estimateGas(coverageAmount, duration, {
          value,
          from: userAddress,
        });
        console.log(`✅ ${label} (${ethers.formatEther(value)} ETH) - SUCCESS!`);
      } catch {
        console.log(`❌ ${label} (${ethers.formatEther(value)} ETH) - still fails`);
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
