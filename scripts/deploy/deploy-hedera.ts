/**
 * Hedera Deployment Script for OmniShield Insurance Protocol
 *
 * This script deploys the HederaInsurancePool contract to Hedera network
 * using the Hedera SDK and configures HTS tokens and HCS topics.
 */

import {
  Client,
  PrivateKey,
  AccountId,
  ContractCreateFlow,
  ContractFunctionParameters,
  ContractExecuteTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  ContractCallQuery,
  Hbar,
  ContractId,
  TokenId,
  TopicId,
} from "@hashgraph/sdk";
import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// ============ Configuration ============

interface DeploymentConfig {
  network: "testnet" | "mainnet";
  operatorId: string;
  operatorKey: string;
  treasuryAccount: string;
  riskEngineAddress?: string;
}

interface DeploymentResult {
  hederaInsurancePool: string;
  riskEngine: string;
  htsToken: string;
  consensusTopic: string;
  network: string;
  deploymentTime: string;
}

// ============ Helper Functions ============

/**
 * Create Hedera client
 */
function createHederaClient(config: DeploymentConfig): Client {
  let client: Client;

  if (config.network === "testnet") {
    client = Client.forTestnet();
  } else {
    client = Client.forMainnet();
  }

  const operatorId = AccountId.fromString(config.operatorId);
  const operatorKey = PrivateKey.fromString(config.operatorKey);

  client.setOperator(operatorId, operatorKey);
  client.setDefaultMaxTransactionFee(new Hbar(100));
  client.setDefaultMaxQueryPayment(new Hbar(50));

  return client;
}

/**
 * Create HTS token for premiums
 */
async function createHtsToken(client: Client, treasuryAccount: AccountId): Promise<TokenId> {
  console.log("\n🪙 Creating HTS Token for Premiums...");

  const tokenCreateTx = new TokenCreateTransaction()
    .setTokenName("OmniShield Premium Token")
    .setTokenSymbol("OSPREM")
    .setDecimals(6)
    .setTokenType(TokenType.FungibleCommon)
    .setSupplyType(TokenSupplyType.Infinite)
    .setInitialSupply(0)
    .setTreasuryAccountId(treasuryAccount)
    .setAdminKey(client.operatorPublicKey!)
    .setSupplyKey(client.operatorPublicKey!)
    .setFreezeKey(client.operatorPublicKey!)
    .setWipeKey(client.operatorPublicKey!)
    .setMaxTransactionFee(new Hbar(50));

  const tokenCreateSubmit = await tokenCreateTx.execute(client);
  const tokenCreateReceipt = await tokenCreateSubmit.getReceipt(client);
  const tokenId = tokenCreateReceipt.tokenId!;

  console.log(`✅ HTS Token Created: ${tokenId.toString()}`);
  console.log(`   Name: OmniShield Premium Token`);
  console.log(`   Symbol: OSPREM`);
  console.log(`   Decimals: 6`);

  return tokenId;
}

/**
 * Create HCS topic for claim voting
 */
async function createConsensusTopic(client: Client): Promise<TopicId> {
  console.log("\n📋 Creating Hedera Consensus Service Topic...");

  const topicCreateTx = new TopicCreateTransaction()
    .setAdminKey(client.operatorPublicKey!)
    .setSubmitKey(client.operatorPublicKey!)
    .setTopicMemo("OmniShield Claim Voting Topic")
    .setMaxTransactionFee(new Hbar(5));

  const topicCreateSubmit = await topicCreateTx.execute(client);
  const topicCreateReceipt = await topicCreateSubmit.getReceipt(client);
  const topicId = topicCreateReceipt.topicId!;

  console.log(`✅ HCS Topic Created: ${topicId.toString()}`);
  console.log(`   Memo: OmniShield Claim Voting Topic`);

  // Submit initial message
  const messageSubmitTx = new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage("OmniShield Insurance Pool - Claim Voting Topic Initialized");

  await messageSubmitTx.execute(client);

  console.log(`✅ Initial message submitted to topic`);

  return topicId;
}

/**
 * Deploy RiskEngine contract (if not provided)
 */
async function deployRiskEngine(): Promise<string> {
  console.log("\n🔧 Deploying RiskEngine...");

  const RiskEngine = await ethers.getContractFactory("RiskEngine");
  const riskEngine = await RiskEngine.deploy();
  await riskEngine.waitForDeployment();

  const address = await riskEngine.getAddress();
  console.log(`✅ RiskEngine deployed to: ${address}`);

  return address;
}

/**
 * Deploy HederaInsurancePool via Hedera SDK
 */
async function deployHederaInsurancePool(
  client: Client,
  riskEngineAddress: string,
  treasuryAccount: string,
  htsTokenId: TokenId,
  consensusTopicId: TopicId
): Promise<ContractId> {
  console.log("\n🚀 Deploying HederaInsurancePool...");

  // Get contract bytecode
  const artifactPath = path.join(
    __dirname,
    "../../artifacts/contracts/hedera/HederaInsurancePool.sol/HederaInsurancePool.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const bytecode = artifact.bytecode;

  // Convert addresses to bytes32 for Hedera
  const riskEngineBytes = Buffer.from(riskEngineAddress.replace("0x", ""), "hex");
  const treasuryBytes = Buffer.from(treasuryAccount.replace("0x", ""), "hex");
  const htsTokenBytes = Buffer.from(htsTokenId.toSolidityAddress(), "hex");
  const consensusTopicBytes = Buffer.from(consensusTopicId.toString());

  // Create contract
  const contractCreateFlow = new ContractCreateFlow()
    .setBytecode(bytecode)
    .setGas(3000000)
    .setConstructorParameters(
      new ContractFunctionParameters()
        .addAddress(riskEngineBytes)
        .addAddress(treasuryBytes)
        .addAddress(htsTokenBytes)
        .addBytes32(Array.from(consensusTopicBytes))
    )
    .setMaxTransactionFee(new Hbar(100));

  const contractCreateSubmit = await contractCreateFlow.execute(client);
  const contractCreateReceipt = await contractCreateSubmit.getReceipt(client);
  const contractId = contractCreateReceipt.contractId!;

  console.log(`✅ HederaInsurancePool deployed: ${contractId.toString()}`);
  console.log(`   EVM Address: 0x${contractId.toSolidityAddress()}`);
  console.log(`   Risk Engine: ${riskEngineAddress}`);
  console.log(`   Treasury: ${treasuryAccount}`);
  console.log(`   HTS Token: ${htsTokenId.toString()}`);
  console.log(`   Consensus Topic: ${consensusTopicId.toString()}`);

  return contractId;
}

/**
 * Configure contract roles and permissions
 */
async function configureContractRoles(
  client: Client,
  contractId: ContractId,
  operatorAccount: AccountId
): Promise<void> {
  console.log("\n🔐 Configuring Contract Roles...");

  // Grant CLAIM_VOTER_ROLE to operator
  const claimVoterRoleHash = ethers.keccak256(ethers.toUtf8Bytes("CLAIM_VOTER_ROLE"));

  const grantRoleTx = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(100000)
    .setFunction(
      "grantRole",
      new ContractFunctionParameters()
        .addBytes32(Buffer.from(claimVoterRoleHash.replace("0x", ""), "hex"))
        .addAddress(Buffer.from(operatorAccount.toSolidityAddress(), "hex"))
    )
    .setMaxTransactionFee(new Hbar(5));

  await grantRoleTx.execute(client);

  console.log(`✅ CLAIM_VOTER_ROLE granted to ${operatorAccount.toString()}`);
}

/**
 * Verify contract on HashScan
 */
async function verifyOnHashScan(
  contractId: ContractId,
  network: string,
  constructorArgs: string[]
): Promise<void> {
  console.log("\n🔍 Contract Verification on HashScan...");
  console.log(`   Network: ${network}`);
  console.log(`   Contract ID: ${contractId.toString()}`);
  console.log(`   HashScan URL: https://hashscan.io/${network}/contract/${contractId.toString()}`);
  console.log(`\n   Constructor Arguments:`);
  constructorArgs.forEach((arg, i) => console.log(`   ${i + 1}. ${arg}`));
  console.log(`\n⚠️  Manual verification required on HashScan`);
}

/**
 * Query contract state via mirror node
 */
async function queryContractState(client: Client, contractId: ContractId): Promise<void> {
  console.log("\n📊 Querying Contract State...");

  try {
    // Query total pool balance
    const balanceQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(50000)
      .setFunction("totalPoolBalance");

    const balanceResult = await balanceQuery.execute(client);
    const balance = balanceResult.getUint256(0);

    console.log(`   Total Pool Balance: ${balance.toString()} wei`);

    // Query policy counter (private, so this might fail)
    console.log(`✅ Contract state query successful`);
  } catch {
    console.log(`⚠️  Could not query some contract state (private variables)`);
  }
}

/**
 * Save deployment results
 */
function saveDeploymentResults(result: DeploymentResult): void {
  const outputPath = path.join(__dirname, "../../deployments/hedera.json");
  const deploymentsDir = path.dirname(outputPath);

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Deployment results saved to: ${outputPath}`);
}

// ============ Main Deployment Function ============

async function main() {
  console.log("========================================");
  console.log("🌐 OmniShield Hedera Deployment");
  console.log("========================================");

  // Load configuration from environment
  const config: DeploymentConfig = {
    network: (process.env.HEDERA_NETWORK as "testnet" | "mainnet") || "testnet",
    operatorId: process.env.HEDERA_OPERATOR_ID || "",
    operatorKey: process.env.HEDERA_OPERATOR_KEY || "",
    treasuryAccount: process.env.HEDERA_TREASURY_ACCOUNT || "",
    riskEngineAddress: process.env.RISK_ENGINE_ADDRESS,
  };

  // Validate configuration
  if (!config.operatorId || !config.operatorKey || !config.treasuryAccount) {
    throw new Error(
      "Missing required environment variables: HEDERA_OPERATOR_ID, HEDERA_OPERATOR_KEY, HEDERA_TREASURY_ACCOUNT"
    );
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   Network: ${config.network}`);
  console.log(`   Operator: ${config.operatorId}`);
  console.log(`   Treasury: ${config.treasuryAccount}`);

  // Create Hedera client
  const client = createHederaClient(config);
  const operatorAccount = AccountId.fromString(config.operatorId);

  // Step 1: Create HTS Token
  const htsTokenId = await createHtsToken(client, AccountId.fromString(config.treasuryAccount));

  // Step 2: Create HCS Topic
  const consensusTopicId = await createConsensusTopic(client);

  // Step 3: Deploy RiskEngine (if not provided)
  let riskEngineAddress = config.riskEngineAddress;
  if (!riskEngineAddress) {
    riskEngineAddress = await deployRiskEngine();
  } else {
    console.log(`\n✅ Using existing RiskEngine: ${riskEngineAddress}`);
  }

  // Step 4: Deploy HederaInsurancePool
  const contractId = await deployHederaInsurancePool(
    client,
    riskEngineAddress,
    config.treasuryAccount,
    htsTokenId,
    consensusTopicId
  );

  // Step 5: Configure roles
  await configureContractRoles(client, contractId, operatorAccount);

  // Step 6: Query initial state
  await queryContractState(client, contractId);

  // Step 7: Verify on HashScan
  await verifyOnHashScan(contractId, config.network, [
    riskEngineAddress,
    config.treasuryAccount,
    htsTokenId.toString(),
    consensusTopicId.toString(),
  ]);

  // Save deployment results
  const result: DeploymentResult = {
    hederaInsurancePool: contractId.toString(),
    riskEngine: riskEngineAddress,
    htsToken: htsTokenId.toString(),
    consensusTopic: consensusTopicId.toString(),
    network: config.network,
    deploymentTime: new Date().toISOString(),
  };

  saveDeploymentResults(result);

  console.log("\n========================================");
  console.log("✅ Deployment Completed Successfully!");
  console.log("========================================");
  console.log(`\n📝 Summary:`);
  console.log(`   HederaInsurancePool: ${contractId.toString()}`);
  console.log(`   EVM Address: 0x${contractId.toSolidityAddress()}`);
  console.log(`   RiskEngine: ${riskEngineAddress}`);
  console.log(`   HTS Token: ${htsTokenId.toString()}`);
  console.log(`   Consensus Topic: ${consensusTopicId.toString()}`);
  console.log(`\n🔗 Links:`);
  console.log(
    `   HashScan: https://hashscan.io/${config.network}/contract/${contractId.toString()}`
  );
  console.log(
    `   Mirror Node: https://${config.network}.mirrornode.hedera.com/api/v1/contracts/${contractId.toString()}`
  );

  // Close client
  client.close();
}

// ============ Execute ============

main()
  .then(() => process.exit(0))
  .catch((_error) => {
    console.error("\n❌ Deployment failed:");
    console.error(_error);
    process.exit(1);
  });
