import { ethers } from "hardhat";

async function main() {
  // Connect to Hedera testnet
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");

  // The user's wallet address from the transaction
  const userAddress = "0x85e271306a058020f0ebb30c45afd073400e85e5";

  // Contract addresses - Updated to fixed contract
  const poolAddress = "0xCA8c8688914e0F7096c920146cd0Ad85cD7Ae8b9";
  // Old broken contract: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf"
  const riskEngineAddress = "0x22753E4264FDDc6181dc7cce468904A80a363E44";

  // Get contracts
  const poolAbi = [
    "function calculatePremium(uint256 coverageAmount, uint256 duration) public view returns (uint256)",
    "function createPolicy(uint256 coverageAmount, uint256 duration) external payable returns (uint256)",
  ];

  const riskEngineAbi = [
    "function calculateRisk(address user, uint256 coverageAmount) external view returns (uint256)",
    "function isEligibleForCoverage(address user, uint256 coverageAmount) external view returns (bool)",
  ];

  const pool = new ethers.Contract(poolAddress, poolAbi, provider);
  const riskEngine = new ethers.Contract(riskEngineAddress, riskEngineAbi, provider);

  // Test parameters from the frontend
  const coverageAmount = ethers.parseEther("1.0"); // 1 HBAR
  const duration = 30 * 24 * 60 * 60; // 30 days

  console.log("=== Testing with user address:", userAddress);
  console.log("Coverage amount:", ethers.formatEther(coverageAmount), "HBAR");
  console.log("Duration:", duration / (24 * 60 * 60), "days");
  console.log("");

  // 1. Check eligibility
  try {
    const eligible = await riskEngine.isEligibleForCoverage(userAddress, coverageAmount);
    console.log("✅ Eligible for coverage:", eligible);
  } catch (error: any) {
    console.log("❌ Eligibility check failed:", error.message);
  }

  // 2. Check risk score
  try {
    const riskScore = await riskEngine.calculateRisk(userAddress, coverageAmount);
    console.log("✅ Risk score:", riskScore.toString());
  } catch (error: any) {
    console.log("❌ Risk calculation failed:", error.message);
  }

  // 3. Calculate premium
  try {
    const premium = await pool.calculatePremium(coverageAmount, duration);
    console.log("✅ Premium calculated:", premium.toString(), "wei");
    console.log("   Premium in HBAR:", ethers.formatEther(premium));

    const requiredValue = premium + premium / 10n; // 110%
    console.log("   Required value (110%):", ethers.formatEther(requiredValue), "HBAR");
  } catch (error: any) {
    console.log("❌ Premium calculation failed:", error.message);
    console.log("   Error data:", error.data);
  }

  // 4. Check user balance
  try {
    const balance = await provider.getBalance(userAddress);
    console.log("✅ User balance:", ethers.formatEther(balance), "HBAR");
  } catch (error: any) {
    console.log("❌ Balance check failed:", error.message);
  }

  // 5. Check pool balance
  try {
    const poolBalance = await provider.getBalance(poolAddress);
    console.log("✅ Pool balance:", ethers.formatEther(poolBalance), "HBAR");
  } catch (error: any) {
    console.log("❌ Pool balance check failed:", error.message);
  }

  // 6. Try static call to simulate the transaction
  console.log("\n=== Simulating createPolicy transaction ===");
  try {
    const premium = await pool.calculatePremium(coverageAmount, duration);
    const valueToSend = premium + premium / 10n;

    console.log("Simulating with value:", ethers.formatEther(valueToSend), "HBAR");

    // Create a signer with the user's address (for simulation only)
    const impersonatedProvider = await ethers.getImpersonatedSigner(userAddress);
    const poolWithSigner = pool.connect(impersonatedProvider);

    const result = await poolWithSigner.createPolicy.staticCall(coverageAmount, duration, {
      value: valueToSend,
    });
    console.log("✅ Static call succeeded! Policy ID would be:", result.toString());
  } catch (error: any) {
    console.log("❌ Static call failed!");
    console.log("   Error:", error.message);
    if (error.data) {
      console.log("   Error data:", error.data);
      // Try to decode the error
      try {
        const errorInterface = new ethers.Interface([
          "error InsufficientHbarBalance()",
          "error InsufficientPoolLiquidity()",
          "error InvalidCoverageAmount()",
          "error InvalidDuration()",
        ]);
        const decodedError = errorInterface.parseError(error.data);
        console.log("   Decoded error:", decodedError?.name);
      } catch {
        console.log("   Could not decode error");
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
