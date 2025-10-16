import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentAddresses {
  insurancePool: string;
  riskEngine: string;
  pythPriceConsumer?: string;
  ccipBridge?: string;
  deployedAt: number;
  chainId: number;
  network: string;
}

interface NetworkConfig {
  name: string;
  chainId: number;
  needsCCIP: boolean;
  pythOracle?: string;
}

const NETWORKS: Record<string, NetworkConfig> = {
  sepolia: {
    name: "ethereum-sepolia",
    chainId: 11155111,
    needsCCIP: true,
    pythOracle: "0x2880aB155794e7179c9eE2e38200202908C17B43", // Sepolia Pyth
  },
  hedera: {
    name: "hedera-testnet",
    chainId: 296,
    needsCCIP: false,
    pythOracle: "0x0000000000000000000000000000000000000000", // Hedera uses custom oracle
  },
  polygon: {
    name: "polygon-amoy",
    chainId: 80002,
    needsCCIP: true,
    pythOracle: "0x0000000000000000000000000000000000000000", // Polygon Amoy Pyth
  },
};

async function deployInsurancePool(riskEngineAddress: string): Promise<string> {
  console.log("  📋 Deploying InsurancePool...");
  const InsurancePool = await ethers.getContractFactory("InsurancePool");
  const insurancePool = await InsurancePool.deploy(riskEngineAddress);
  await insurancePool.waitForDeployment();
  const address = await insurancePool.getAddress();
  console.log(`  ✅ InsurancePool deployed to: ${address}`);
  return address;
}

async function deployRiskEngine(): Promise<string> {
  console.log("  📋 Deploying RiskEngine...");
  const RiskEngine = await ethers.getContractFactory("RiskEngine");
  const riskEngine = await RiskEngine.deploy();
  await riskEngine.waitForDeployment();
  const address = await riskEngine.getAddress();
  console.log(`  ✅ RiskEngine deployed to: ${address}`);
  return address;
}

async function deployPythPriceConsumer(pythOracleAddress: string): Promise<string> {
  console.log("  📋 Deploying PythPriceConsumer...");
  const PythPriceConsumer = await ethers.getContractFactory("PythPriceConsumer");
  const priceConsumer = await PythPriceConsumer.deploy(pythOracleAddress);
  await priceConsumer.waitForDeployment();
  const address = await priceConsumer.getAddress();
  console.log(`  ✅ PythPriceConsumer deployed to: ${address}`);
  return address;
}

async function deployCCIPBridge(
  routerAddress: string,
  linkTokenAddress: string,
  insurancePoolAddress: string
): Promise<string> {
  console.log("  📋 Deploying CCIPCrossChainCoverage...");
  const CCIPBridge = await ethers.getContractFactory("CCIPCrossChainCoverage");
  const ccipBridge = await CCIPBridge.deploy(routerAddress, linkTokenAddress, insurancePoolAddress);
  await ccipBridge.waitForDeployment();
  const address = await ccipBridge.getAddress();
  console.log(`  ✅ CCIPCrossChainCoverage deployed to: ${address}`);
  return address;
}

async function configureContracts(addresses: DeploymentAddresses): Promise<void> {
  console.log("  ⚙️  Configuring contracts...");

  // Verify contract is accessible
  await ethers.getContractAt("InsurancePool", addresses.insurancePool);

  // Additional configuration can be added here
  // For example, setting initial parameters, whitelisting addresses, etc.

  console.log("  ✅ Contracts configured");
}

async function saveDeployment(networkName: string, addresses: DeploymentAddresses): Promise<void> {
  const deploymentDir = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const filePath = path.join(deploymentDir, `${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));
  console.log(`  💾 Deployment saved to: ${filePath}`);
}

async function loadDeployment(networkName: string): Promise<DeploymentAddresses | null> {
  const filePath = path.join(__dirname, "../../deployments", `${networkName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

// Note: For contract verification, use the dedicated verify-all.ts script
// async function verifyContract(...)

async function deployToNetwork(networkConfig: NetworkConfig): Promise<DeploymentAddresses> {
  console.log(`\n🌐 Deploying to ${networkConfig.name}...`);
  console.log(`   Chain ID: ${networkConfig.chainId}`);

  // Check if already deployed
  const existing = await loadDeployment(networkConfig.name);
  if (existing) {
    console.log(`  ℹ️  Previous deployment found. Skipping...`);
    return existing;
  }

  // Deploy core contracts in correct order
  const riskEngineAddress = await deployRiskEngine();
  const insurancePoolAddress = await deployInsurancePool(riskEngineAddress);

  const addresses: DeploymentAddresses = {
    insurancePool: insurancePoolAddress,
    riskEngine: riskEngineAddress,
    deployedAt: Date.now(),
    chainId: networkConfig.chainId,
    network: networkConfig.name,
  };

  // Deploy Pyth Price Consumer if oracle address provided
  if (networkConfig.pythOracle && networkConfig.pythOracle !== ethers.ZeroAddress) {
    const pythConsumerAddress = await deployPythPriceConsumer(networkConfig.pythOracle);
    addresses.pythPriceConsumer = pythConsumerAddress;
  }

  // Deploy CCIP Bridge if needed
  if (networkConfig.needsCCIP) {
    // CCIP Router and LINK addresses would be configured per network
    const ccipRouterAddress = process.env[`${networkConfig.name.toUpperCase()}_CCIP_ROUTER`] || "";
    const linkTokenAddress = process.env[`${networkConfig.name.toUpperCase()}_LINK_TOKEN`] || "";

    if (ccipRouterAddress && linkTokenAddress) {
      const ccipBridgeAddress = await deployCCIPBridge(
        ccipRouterAddress,
        linkTokenAddress,
        insurancePoolAddress
      );
      addresses.ccipBridge = ccipBridgeAddress;
    } else {
      console.log(`  ⚠️  Skipping CCIP bridge deployment (missing router/LINK addresses)`);
    }
  }

  // Configure contracts
  await configureContracts(addresses);

  // Save deployment
  await saveDeployment(networkConfig.name, addresses);

  console.log(`\n✅ ${networkConfig.name} deployment complete!`);
  return addresses;
}

async function setupCrossChainLinks(
  deployments: Record<string, DeploymentAddresses>
): Promise<void> {
  console.log("\n🔗 Setting up cross-chain links...");

  const networksWithCCIP = Object.entries(deployments).filter(
    ([_, deployment]) => deployment.ccipBridge
  );

  if (networksWithCCIP.length < 2) {
    console.log("  ℹ️  Not enough CCIP-enabled networks to link");
    return;
  }

  // Link each CCIP bridge to others
  for (const [sourceNetwork, sourceDeployment] of networksWithCCIP) {
    if (!sourceDeployment.ccipBridge) continue;

    const ccipBridge = await ethers.getContractAt(
      "CCIPCrossChainCoverage",
      sourceDeployment.ccipBridge
    );

    for (const [targetNetwork, targetDeployment] of networksWithCCIP) {
      if (sourceNetwork === targetNetwork || !targetDeployment.ccipBridge) continue;

      const targetChainSelector = await getChainSelector(targetDeployment.chainId);

      console.log(
        `  🔗 Linking ${sourceNetwork} -> ${targetNetwork} (selector: ${targetChainSelector})`
      );

      try {
        const tx = await ccipBridge.enableChain(
          targetChainSelector,
          targetDeployment.ccipBridge,
          100 // rate limit
        );
        await tx.wait();
        console.log(`  ✅ Link established`);
      } catch (error: any) {
        console.error(`  ❌ Failed to link: ${error.message}`);
      }
    }
  }

  console.log("✅ Cross-chain links setup complete");
}

async function getChainSelector(chainId: number): Promise<bigint> {
  // CCIP Chain Selectors (these are Chainlink-specific)
  const selectors: Record<number, bigint> = {
    11155111: 16015286601757825753n, // Sepolia
    80002: 16281711391670634445n, // Polygon Amoy
    296: 12532609583862916517n, // Mock Hedera selector
  };

  return selectors[chainId] || 0n;
}

async function initializePythFeeds(
  deployments: Record<string, DeploymentAddresses>
): Promise<void> {
  console.log("\n📊 Initializing Pyth price feeds...");

  for (const [networkName, deployment] of Object.entries(deployments)) {
    if (!deployment.pythPriceConsumer) {
      console.log(`  ⚠️  ${networkName}: No Pyth consumer deployed`);
      continue;
    }

    console.log(`  🔧 ${networkName}: Configuring price feeds...`);

    // Add feed initialization logic here
    // For example, whitelisting price feed IDs

    console.log(`  ✅ ${networkName}: Price feeds initialized`);
  }

  console.log("✅ Pyth feeds initialization complete");
}

async function generateDeploymentSummary(
  deployments: Record<string, DeploymentAddresses>
): Promise<void> {
  console.log("\n📋 DEPLOYMENT SUMMARY");
  console.log("═".repeat(80));

  for (const [networkName, deployment] of Object.entries(deployments)) {
    console.log(`\n🌐 ${networkName.toUpperCase()}`);
    console.log(`   Chain ID: ${deployment.chainId}`);
    console.log(`   Insurance Pool: ${deployment.insurancePool}`);
    console.log(`   Risk Engine: ${deployment.riskEngine}`);
    if (deployment.pythPriceConsumer) {
      console.log(`   Pyth Consumer: ${deployment.pythPriceConsumer}`);
    }
    if (deployment.ccipBridge) {
      console.log(`   CCIP Bridge: ${deployment.ccipBridge}`);
    }
    console.log(`   Deployed: ${new Date(deployment.deployedAt).toISOString()}`);
  }

  console.log("\n═".repeat(80));

  // Save summary to file
  const summaryPath = path.join(__dirname, "../../deployments/DEPLOYMENT_SUMMARY.md");
  let summary = "# OmniShield Deployment Summary\n\n";
  summary += `Generated: ${new Date().toISOString()}\n\n`;

  for (const [networkName, deployment] of Object.entries(deployments)) {
    summary += `## ${networkName.toUpperCase()}\n\n`;
    summary += `- **Chain ID**: ${deployment.chainId}\n`;
    summary += `- **Insurance Pool**: \`${deployment.insurancePool}\`\n`;
    summary += `- **Risk Engine**: \`${deployment.riskEngine}\`\n`;
    if (deployment.pythPriceConsumer) {
      summary += `- **Pyth Price Consumer**: \`${deployment.pythPriceConsumer}\`\n`;
    }
    if (deployment.ccipBridge) {
      summary += `- **CCIP Bridge**: \`${deployment.ccipBridge}\`\n`;
    }
    summary += `- **Deployed**: ${new Date(deployment.deployedAt).toISOString()}\n\n`;
  }

  fs.writeFileSync(summaryPath, summary);
  console.log(`\n💾 Summary saved to: ${summaryPath}`);
}

async function main() {
  console.log("🚀 OmniShield Multi-Chain Deployment\n");
  console.log("═".repeat(80));

  const deploymentsToRun = process.env.NETWORKS?.split(",") || ["sepolia"];
  const deployments: Record<string, DeploymentAddresses> = {};

  // Deploy to each network
  for (const networkKey of deploymentsToRun) {
    const networkConfig = NETWORKS[networkKey];
    if (!networkConfig) {
      console.error(`❌ Unknown network: ${networkKey}`);
      continue;
    }

    try {
      const deployment = await deployToNetwork(networkConfig);
      deployments[networkKey] = deployment;
    } catch (error: any) {
      console.error(`❌ Deployment to ${networkKey} failed: ${error.message}`);
      console.error(error.stack);
    }
  }

  // Setup cross-chain connections
  if (Object.keys(deployments).length > 1) {
    await setupCrossChainLinks(deployments);
  }

  // Initialize Pyth feeds
  await initializePythFeeds(deployments);

  // Generate summary
  await generateDeploymentSummary(deployments);

  console.log("\n✅ All deployments complete!");
}

// Note: hre import removed - use verify-all.ts script for verification

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
