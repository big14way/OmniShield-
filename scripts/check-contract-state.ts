import { ethers } from "hardhat";

async function main() {
  const insurancePool = await ethers.getContractAt(
    "InsurancePool",
    "0xA7c59f010700930003b33aB25a7a0679C860f29c"
  );

  console.log("Checking InsurancePool contract state...\n");

  // Check if paused
  const paused = await insurancePool.paused();
  console.log("Is Paused:", paused);

  if (paused) {
    console.log("\n❌ CONTRACT IS PAUSED!");
    console.log("This is why transactions are reverting.");
    console.log("The whenNotPaused modifier blocks createPolicy().");
    console.log("The contract owner needs to call unpause().");
  } else {
    console.log("✅ Contract is not paused");
  }

  // Get total pool balance
  const totalBalance = await insurancePool.totalPoolBalance();
  console.log("\nTotal Pool Balance:", ethers.formatEther(totalBalance), "ETH");

  // Get owner
  const owner = await insurancePool.owner();
  console.log("Owner:", owner);

  // Get RiskEngine address
  const riskEngine = await insurancePool.riskEngine();
  console.log("RiskEngine:", riskEngine);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
