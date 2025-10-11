import { ethers } from "hardhat";

async function main() {
  console.log("Starting OmniShield deployment...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  console.log("Deploying RiskEngine...");
  const RiskEngine = await ethers.getContractFactory("RiskEngine");
  const riskEngine = await RiskEngine.deploy();
  await riskEngine.waitForDeployment();
  const riskEngineAddress = await riskEngine.getAddress();
  console.log("RiskEngine deployed to:", riskEngineAddress);

  console.log("\nDeploying InsurancePool...");
  const InsurancePool = await ethers.getContractFactory("InsurancePool");
  const insurancePool = await InsurancePool.deploy(riskEngineAddress);
  await insurancePool.waitForDeployment();
  const insurancePoolAddress = await insurancePool.getAddress();
  console.log("InsurancePool deployed to:", insurancePoolAddress);

  console.log("\nDeploying ClaimsProcessor...");
  const ClaimsProcessor = await ethers.getContractFactory("ClaimsProcessor");
  const claimsProcessor = await ClaimsProcessor.deploy(insurancePoolAddress);
  await claimsProcessor.waitForDeployment();
  const claimsProcessorAddress = await claimsProcessor.getAddress();
  console.log("ClaimsProcessor deployed to:", claimsProcessorAddress);

  console.log("\nDeploying HederaBridge...");
  const HederaBridge = await ethers.getContractFactory("HederaBridge");
  const hederaBridge = await HederaBridge.deploy();
  await hederaBridge.waitForDeployment();
  const hederaBridgeAddress = await hederaBridge.getAddress();
  console.log("HederaBridge deployed to:", hederaBridgeAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("RiskEngine:", riskEngineAddress);
  console.log("InsurancePool:", insurancePoolAddress);
  console.log("ClaimsProcessor:", claimsProcessorAddress);
  console.log("HederaBridge:", hederaBridgeAddress);
  console.log("\nDeployment completed successfully!");

  console.log("\n=== Verification Commands ===");
  console.log(`npx hardhat verify --network <network-name> ${riskEngineAddress}`);
  console.log(`npx hardhat verify --network <network-name> ${insurancePoolAddress} ${riskEngineAddress}`);
  console.log(`npx hardhat verify --network <network-name> ${claimsProcessorAddress} ${insurancePoolAddress}`);
  console.log(`npx hardhat verify --network <network-name> ${hederaBridgeAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
