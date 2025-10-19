import { sepolia } from "wagmi/chains";
import { hederaTestnet } from "./config";

export interface ContractAddresses {
  insurancePool: `0x${string}`;
  riskEngine: `0x${string}`;
  claimsProcessor: `0x${string}`;
  hederaBridge: `0x${string}`;
  pythPriceConsumer?: `0x${string}`;
  ccipBridge?: `0x${string}`;
}

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [sepolia.id]: {
    insurancePool: "0x0000000000000000000000000000000000000000",
    riskEngine: "0x0000000000000000000000000000000000000000",
    claimsProcessor: "0x0000000000000000000000000000000000000000",
    hederaBridge: "0x0000000000000000000000000000000000000000",
    pythPriceConsumer: "0x0000000000000000000000000000000000000000",
    ccipBridge: "0x0000000000000000000000000000000000000000",
  },
  [hederaTestnet.id]: {
    insurancePool: "0xd6e1afe5cA8D00A2EFC01B89997abE2De47fdfAf", // Updated with liquidity functions
    riskEngine: "0x5bf5b11053e734690269C6B9D438F8C9d48F528A",
    claimsProcessor: "0x3aAde2dCD2Df6a8cAc689EE797591b2913658659",
    hederaBridge: "0xab16A69A5a8c12C732e0DEFF4BE56A70bb64c926",
    pythPriceConsumer: "0xA2aa501b19aff244D90cc15a4Cf739D2725B5729",
  },
};

export const INSURANCE_POOL_ABI = [
  {
    inputs: [
      { name: "coverageAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    name: "createPolicy",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "coverageAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    name: "calculatePremium",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "policyId", type: "uint256" }],
    name: "getPolicy",
    outputs: [
      {
        components: [
          { name: "holder", type: "address" },
          { name: "coverageAmount", type: "uint256" },
          { name: "premium", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "policyId", type: "uint256" },
      { name: "claimAmount", type: "uint256" },
    ],
    name: "submitClaim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalPoolBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "addLiquidity",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "withdrawLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "provider", type: "address" }],
    name: "getLiquidityProviderBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "policyId", type: "uint256" },
      { indexed: true, name: "holder", type: "address" },
      { indexed: false, name: "coverageAmount", type: "uint256" },
      { indexed: false, name: "premium", type: "uint256" },
    ],
    name: "PolicyCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "provider", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "LiquidityAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "provider", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "LiquidityWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "policyId", type: "uint256" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "PolicyClaimed",
    type: "event",
  },
] as const;

export const RISK_ENGINE_ABI = [
  {
    inputs: [
      { name: "coverageAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "calculateRiskScore",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
