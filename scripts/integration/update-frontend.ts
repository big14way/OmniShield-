import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  insurancePool: string;
  riskEngine: string;
  claimsProcessor?: string;
  pythPriceConsumer?: string;
  ccipBridge?: string;
  deployedAt: number;
  chainId: number;
  network: string;
}

const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

function log(message: string, color: keyof typeof colors = "cyan"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message: string): void {
  log(`✅ ${message}`, "green");
}

function warning(message: string): void {
  log(`⚠️  ${message}`, "yellow");
}

async function main() {
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║         Frontend Integration Script                       ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  const network = process.env.NETWORK || "sepolia";
  const deploymentPath = path.join(__dirname, "../../deployments", `${network}.json`);

  // Check if deployment file exists
  if (!fs.existsSync(deploymentPath)) {
    warning(`Deployment file not found: ${deploymentPath}`);
    log("\nRun deployment first:", "cyan");
    log(`  npm run deploy:${network}\n`);
    process.exit(1);
  }

  // Read deployment addresses
  const deployment: DeploymentAddresses = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));

  log("Deployment found:", "cyan");
  log(`  Network: ${deployment.network}`);
  log(`  Chain ID: ${deployment.chainId}`);
  log(`  InsurancePool: ${deployment.insurancePool}`);
  log(`  RiskEngine: ${deployment.riskEngine}`);
  if (deployment.pythPriceConsumer) {
    log(`  PythPriceConsumer: ${deployment.pythPriceConsumer}`);
  }

  // Update frontend contracts.ts
  const contractsPath = path.join(__dirname, "../../frontend/src/lib/web3/contracts.ts");

  if (!fs.existsSync(contractsPath)) {
    warning("Frontend contracts.ts not found. Skipping update.");
  } else {
    let contractsContent = fs.readFileSync(contractsPath, "utf-8");

    // Prepare addresses based on network
    const addressMap: Record<string, string> = {
      sepolia: "sepolia.id",
      "ethereum-sepolia": "sepolia.id",
      hedera: "hederaTestnet.id",
      "hedera-testnet": "hederaTestnet.id",
      polygon: "polygon.id",
      "polygon-amoy": "polygon.id",
    };

    const networkKey = addressMap[network] || "sepolia.id";

    // Create new addresses object
    const newAddresses = `  [${networkKey}]: {
    insurancePool: "${deployment.insurancePool}" as \`0x\${string}\`,
    riskEngine: "${deployment.riskEngine}" as \`0x\${string}\`,
    pythPriceConsumer: "${deployment.pythPriceConsumer || "0x0000000000000000000000000000000000000000"}" as \`0x\${string}\`,${deployment.ccipBridge ? `\n    ccipBridge: "${deployment.ccipBridge}" as \`0x\${string}\`,` : ""}
  },`;

    // Update the file
    const addressesRegex = new RegExp(
      `\\[${networkKey}\\]:\\s*{[^}]*insurancePool:[^,]*,[^}]*}`,
      "s"
    );

    if (addressesRegex.test(contractsContent)) {
      contractsContent = contractsContent.replace(addressesRegex, newAddresses);
      success("Updated existing addresses in contracts.ts");
    } else {
      warning("Could not automatically update contracts.ts");
      log("\nManually update frontend/src/lib/web3/contracts.ts with:", "cyan");
      log(newAddresses);
    }

    fs.writeFileSync(contractsPath, contractsContent);
  }

  // Create/update frontend .env.local
  const frontendEnvPath = path.join(__dirname, "../../frontend/.env.local");
  const envExamplePath = path.join(__dirname, "../../frontend/.env.example");

  let envContent = "";

  if (fs.existsSync(frontendEnvPath)) {
    envContent = fs.readFileSync(frontendEnvPath, "utf-8");
    success("Found existing frontend/.env.local");
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, "utf-8");
    success("Created frontend/.env.local from example");
  } else {
    envContent = `# OmniShield Frontend Configuration\n\n`;
    success("Created new frontend/.env.local");
  }

  // Update contract addresses in env
  const networkPrefix = network.toUpperCase().replace(/-/g, "_");

  const updates: Record<string, string> = {
    [`NEXT_PUBLIC_${networkPrefix}_INSURANCE_POOL`]: deployment.insurancePool,
    [`NEXT_PUBLIC_${networkPrefix}_RISK_ENGINE`]: deployment.riskEngine,
  };

  if (deployment.pythPriceConsumer) {
    updates[`NEXT_PUBLIC_${networkPrefix}_PYTH_CONSUMER`] = deployment.pythPriceConsumer;
  }

  if (deployment.ccipBridge) {
    updates[`NEXT_PUBLIC_${networkPrefix}_CCIP_BRIDGE`] = deployment.ccipBridge;
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(frontendEnvPath, envContent);
  success("Updated frontend/.env.local with contract addresses");

  // Create deployment summary
  console.log("\n╔═══════════════════════════════════════════════════════════╗");
  console.log("║         Integration Complete!                              ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  log("Contract Addresses Updated:", "green");
  log(`  Network: ${deployment.network}`);
  log(`  InsurancePool: ${deployment.insurancePool}`);
  log(`  RiskEngine: ${deployment.riskEngine}`);
  if (deployment.pythPriceConsumer) {
    log(`  PythPriceConsumer: ${deployment.pythPriceConsumer}`);
  }

  log("\nNext Steps:", "cyan");
  log("  1. Start frontend: cd frontend && npm run dev");
  log("  2. Open: http://localhost:3000");
  log("  3. Connect wallet (MetaMask on Sepolia network)");
  log("  4. Test creating a policy");

  log("\nVerify deployment:", "cyan");
  log(`  https://sepolia.etherscan.io/address/${deployment.insurancePool}`);

  console.log("");
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
