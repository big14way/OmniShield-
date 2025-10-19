import { ethers } from "hardhat";

/**
 * This script attempts to make a purchase directly with ethers.js
 * to test if the issue is with wagmi/viem or with the contract itself
 */
async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing purchase with signer:", signer.address);
  
  const insurancePool = await ethers.getContractAt(
    "InsurancePool",
    "0xA7c59f010700930003b33aB25a7a0679C860f29c"
  );
  
  const coverageAmount = ethers.parseEther("1"); // Try with 1 ETH first
  const duration = 7 * 24 * 60 * 60; // 7 days
  
  console.log("\n📊 Test Parameters:");
  console.log("Coverage:", ethers.formatEther(coverageAmount), "ETH");
  console.log("Duration:", duration, "seconds");
  
  // Calculate premium
  const premium = await insurancePool.calculatePremium(coverageAmount, duration);
  console.log("Premium:", ethers.formatEther(premium), "ETH");
  console.log("Premium Wei:", premium.toString());
  
  // Check balance
  const balance = await ethers.provider.getBalance(signer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < premium) {
    console.error("❌ Insufficient balance!");
    return;
  }
  
  console.log("\n🚀 Attempting purchase...");
  console.log("Sending", ethers.formatEther(premium), "ETH with transaction");
  
  try {
    // ATTEMPT 1: Standard way
    const tx = await insurancePool.createPolicy(coverageAmount, duration, {
      value: premium,
      gasLimit: 1000000,
    });
    
    console.log("✅ Transaction submitted:", tx.hash);
    console.log("⏳ Waiting for confirmation...");
    
    const receipt = await tx.wait();
    
    if (receipt?.status === 1) {
      console.log("✅ SUCCESS! Transaction confirmed!");
      console.log("Block:", receipt.blockNumber);
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Parse events
      for (const log of receipt.logs) {
        try {
          const parsed = insurancePool.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          if (parsed?.name === "PolicyCreated") {
            console.log("\n🎉 Policy Created!");
            console.log("Policy ID:", parsed.args[0].toString());
            console.log("Holder:", parsed.args[1]);
            console.log("Coverage:", ethers.formatEther(parsed.args[2]), "ETH");
            console.log("Premium:", ethers.formatEther(parsed.args[3]), "ETH");
          }
        } catch {
          // Skip logs we can't parse
        }
      }
    } else {
      console.error("❌ Transaction reverted!");
      console.error("Receipt:", receipt);
    }
    
  } catch (error: any) {
    console.error("\n❌ Transaction failed!");
    console.error("Error:", error.message);
    
    if (error.receipt) {
      console.error("Receipt status:", error.receipt.status);
      console.error("Gas used:", error.receipt.gasUsed.toString());
    }
    
    if (error.data) {
      console.error("Error data:", error.data);
    }
    
    // Try to decode revert reason
    if (error.data && typeof error.data === "string" && error.data.startsWith("0x08c379a0")) {
      try {
        const reason = ethers.AbiCoder.defaultAbiCoder().decode(
          ["string"],
          "0x" + error.data.slice(10)
        );
        console.error("\n🔴 Revert reason:", reason[0]);
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
