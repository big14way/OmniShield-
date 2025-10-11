import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-contract-sizer";
import "solidity-coverage";
import "hardhat-gas-reporter";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66 
  ? process.env.PRIVATE_KEY 
  : "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const HEDERA_TESTNET_RPC = process.env.HEDERA_TESTNET_RPC || "https://testnet.hashio.io/api";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false,
    },
    
    "ethereum-sepolia": {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ""}`,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasPrice: "auto",
    },
    
    "hedera-testnet": {
      url: HEDERA_TESTNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 296,
      gasPrice: "auto",
    },
    
    "polygon-amoy": {
      url: "https://rpc-amoy.polygon.technology",
      accounts: [PRIVATE_KEY],
      chainId: 80002,
      gasPrice: "auto",
    },
  },
  
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
      hederaTestnet: "NONE",
    },
    customChains: [
      {
        network: "hederaTestnet",
        chainId: 296,
        urls: {
          apiURL: "https://server-testnet.hashscan.io/api",
          browserURL: "https://hashscan.io/testnet",
        },
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
  },
  
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  mocha: {
    timeout: 40000,
  },
};

export default config;
