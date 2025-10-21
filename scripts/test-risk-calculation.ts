import { ethers } from "hardhat";

async function main() {
  console.log("🔍 DEBUG: Testing RiskEngine calculations...\n");

  const riskEngineAddress = "0x22753E4264FDDc6181dc7cce468904A80a363E44";
  const [signer] = await ethers.getSigners();

  console.log("📝 Using account:", signer.address);

  const riskEngine = await ethers.getContractAt("RiskEngine", riskEngineAddress);

  const coverageAmount = ethers.parseEther("10");

  console.log("1️⃣ Testing calculateRisk...");
  const riskScore = await riskEngine.calculateRisk(signer.address, coverageAmount);
  console.log("   Risk Score:", riskScore.toString());
  console.log("");

  console.log("2️⃣ Testing getRiskProfile...");
  const profile = await riskEngine.getRiskProfile(signer.address);
  console.log("   Profile:");
  console.log("     - riskScore:", profile.riskScore.toString());
  console.log("     - lastUpdated:", profile.lastUpdated.toString());
  console.log("     - isActive:", profile.isActive);
  console.log("");

  console.log("3️⃣ Testing isEligibleForCoverage...");
  const isEligible = await riskEngine.isEligibleForCoverage(signer.address, coverageAmount);
  console.log("   Eligible:", isEligible);
  console.log("");

  // Now manually calculate what premium SHOULD be
  console.log("4️⃣ Manual premium calculation:");
  const BASE_PREMIUM_RATE = 100n;
  const BASIS_POINTS = 10000n;
  const RISK_MULTIPLIER = 10n;
  const HEDERA_FEE_REDUCTION = 3000n;

  const basePremium = (coverageAmount * BASE_PREMIUM_RATE) / BASIS_POINTS;
  console.log("   Base Premium (1%):", ethers.formatEther(basePremium), "HBAR");

  const duration = BigInt(30 * 24 * 60 * 60);
  const durationFactor = duration / (24n * 60n * 60n); // days
  const durationAdjustment = (basePremium * durationFactor) / 365n;
  console.log("   Duration Adjustment:", ethers.formatEther(durationAdjustment), "HBAR");

  const riskAdjustment = (basePremium * riskScore * RISK_MULTIPLIER) / BASIS_POINTS / 1000n;
  console.log("   Risk Adjustment:", ethers.formatEther(riskAdjustment), "HBAR");

  const totalBeforeDiscount = basePremium + durationAdjustment + riskAdjustment;
  console.log("   Total Before Discount:", ethers.formatEther(totalBeforeDiscount), "HBAR");

  const discount = (totalBeforeDiscount * HEDERA_FEE_REDUCTION) / 10000n;
  const finalPremium = totalBeforeDiscount - discount;
  console.log("   30% Hedera Discount:", ethers.formatEther(discount), "HBAR");
  console.log("   FINAL PREMIUM:", ethers.formatEther(finalPremium), "HBAR");
  console.log("   FINAL PREMIUM (wei):", finalPremium.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
