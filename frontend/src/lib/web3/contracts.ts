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
    insurancePool: "0xA7c59f010700930003b33aB25a7a0679C860f29c",
    riskEngine: "0x22753E4264FDDc6181dc7cce468904A80a363E44",
    claimsProcessor: "0xfaAddC93baf78e89DCf37bA67943E1bE8F37Bb8c",
    hederaBridge: "0x276C216D241856199A83bf27b2286659e5b877D3",
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
