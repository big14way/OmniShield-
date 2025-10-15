import hre from "hardhat";
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

async function loadDeployment(networkName: string): Promise<DeploymentAddresses | null> {
  const filePath = path.join(__dirname, "../../deployments", `${networkName}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

async function verifyContract(
  address: string,
  constructorArgs: any[],
  contractName: string
): Promise<boolean> {
  console.log(`\n🔍 Verifying ${contractName} at ${address}...`);
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: constructorArgs,
    });
    console.log(`✅ ${contractName} verified successfully`);
    return true;
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`ℹ️  ${contractName} already verified`);
      return true;
    } else {
      console.error(`❌ ${contractName} verification failed: ${error.message}`);
      return false;
    }
  }
}

async function verifyDeployment(networkName: string, deployment: DeploymentAddresses) {
  console.log(`\n🌐 Verifying contracts on ${networkName.toUpperCase()}`);
  console.log("═".repeat(80));

  const results: Record<string, boolean> = {};

  // Verify RiskEngine (no constructor args)
  results.riskEngine = await verifyContract(deployment.riskEngine, [], "RiskEngine");

  // Verify InsurancePool (takes riskEngine address)
  results.insurancePool = await verifyContract(
    deployment.insurancePool,
    [deployment.riskEngine],
    "InsurancePool"
  );

  // Verify PythPriceConsumer if deployed
  if (deployment.pythPriceConsumer) {
    // Get Pyth oracle address from environment
    const pythOracle = process.env[`${networkName.toUpperCase()}_PYTH_ORACLE`] || "";
    if (pythOracle) {
      results.pythPriceConsumer = await verifyContract(
        deployment.pythPriceConsumer,
        [pythOracle],
        "PythPriceConsumer"
      );
    } else {
      console.log("⚠️  Skipping PythPriceConsumer verification (missing oracle address)");
    }
  }

  // Verify CCIP Bridge if deployed
  if (deployment.ccipBridge) {
    const ccipRouter = process.env[`${networkName.toUpperCase()}_CCIP_ROUTER`] || "";
    const linkToken = process.env[`${networkName.toUpperCase()}_LINK_TOKEN`] || "";

    if (ccipRouter && linkToken) {
      results.ccipBridge = await verifyContract(
        deployment.ccipBridge,
        [ccipRouter, linkToken, deployment.insurancePool],
        "CCIPCrossChainCoverage"
      );
    } else {
      console.log("⚠️  Skipping CCIP Bridge verification (missing router/LINK addresses)");
    }
  }

  // Summary
  console.log(`\n📊 ${networkName.toUpperCase()} Verification Summary:`);
  const verified = Object.values(results).filter((v) => v).length;
  const total = Object.keys(results).length;
  console.log(`   ✅ ${verified}/${total} contracts verified`);

  return results;
}

async function main() {
  console.log("🔍 OmniShield Contract Verification\n");
  console.log("═".repeat(80));

  const networksToVerify = process.env.NETWORKS?.split(",") || ["sepolia"];
  const allResults: Record<string, Record<string, boolean>> = {};

  for (const networkName of networksToVerify) {
    const deployment = await loadDeployment(networkName);

    if (!deployment) {
      console.error(`❌ No deployment found for ${networkName}`);
      console.log(`   Run deployment first: npm run deploy:${networkName}`);
      continue;
    }

    try {
      const results = await verifyDeployment(networkName, deployment);
      allResults[networkName] = results;
    } catch (error: any) {
      console.error(`❌ Verification failed for ${networkName}: ${error.message}`);
    }
  }

  // Overall summary
  console.log("\n═".repeat(80));
  console.log("📋 OVERALL VERIFICATION SUMMARY\n");

  for (const [network, results] of Object.entries(allResults)) {
    const verified = Object.values(results).filter((v) => v).length;
    const total = Object.keys(results).length;
    const status = verified === total ? "✅" : "⚠️";
    console.log(`${status} ${network.toUpperCase()}: ${verified}/${total} contracts verified`);
  }

  console.log("\n✅ Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
