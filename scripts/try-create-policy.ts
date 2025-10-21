import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using signer:", await signer.getAddress());
  console.log("Signer balance:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "HBAR");

  const poolAddress = "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf";
  const pool = await ethers.getContractAt("HederaInsurancePool", poolAddress);

  const coverageAmount = ethers.parseEther("1.0");
  const duration = 30 * 24 * 60 * 60;

  console.log("\nCalculating premium...");
  const premium = await pool.calculatePremium(coverageAmount, duration);
  console.log("Premium:", ethers.formatEther(premium), "HBAR");

  const valueToSend = premium + (premium / 10n);
  console.log("Sending:", ethers.formatEther(valueToSend), "HBAR (110%)");

  console.log("\nAttempting to create policy...");
  try {
    const tx = await pool.createPolicy(coverageAmount, duration, {
      value: valueToSend,
      gasLimit: 1000000,
    });
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt?.blockNumber);
    console.log("Gas used:", receipt?.gasUsed.toString());

    // Get the policy ID from the event
    const event = receipt?.logs.find((log: any) => {
      try {
        const parsed = pool.interface.parseLog(log);
        return parsed?.name === "PolicyCreated";
      } catch (e) {
        return false;
      }
    });

    if (event) {
      const parsed = pool.interface.parseLog(event);
      console.log("Policy ID:", parsed?.args[0].toString());
    }
  } catch (error: any) {
    console.log("❌ Transaction failed!");
    console.log("Error:", error.message);
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
