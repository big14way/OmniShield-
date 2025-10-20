export interface ChainConfig {
  chainId: number;
  chainSelector: string;
  name: string;
  enabled: boolean;
}

export interface CrossChainCoverageRequest {
  destinationChain: string;
  coverageAmount: bigint;
  duration: number;
  asset: string;
  coverageType: string;
}

export interface CrossChainCoverageStatus {
  messageId: string;
  status: "pending" | "sent" | "received" | "failed";
  sourceChain: number;
  destinationChain: number;
  timestamp: number;
}

export class CCIPService {
  private static readonly CHAIN_SELECTORS: Record<number, string> = {
    11155111: "16015286601757825753",
    296: "14767482510784806043",
    80002: "16281711391670634445",
  };

  private static readonly SUPPORTED_CHAINS: ChainConfig[] = [
    {
      chainId: 11155111,
      chainSelector: "16015286601757825753",
      name: "Ethereum Sepolia",
      enabled: true,
    },
    {
      chainId: 296,
      chainSelector: "14767482510784806043",
      name: "Hedera Testnet",
      enabled: true,
    },
    {
      chainId: 80002,
      chainSelector: "16281711391670634445",
      name: "Polygon Amoy",
      enabled: false,
    },
  ];

  static getSupportedChains(): ChainConfig[] {
    return this.SUPPORTED_CHAINS.filter((chain) => chain.enabled);
  }

  static getChainSelector(chainId: number): string | null {
    return this.CHAIN_SELECTORS[chainId] || null;
  }

  static getChainBySelector(selector: string): ChainConfig | null {
    return this.SUPPORTED_CHAINS.find((chain) => chain.chainSelector === selector) || null;
  }

  static isChainSupported(chainId: number): boolean {
    const chain = this.SUPPORTED_CHAINS.find((c) => c.chainId === chainId);
    return chain?.enabled || false;
  }

  static async estimateCrossChainFee(
    _sourceChainId: number,
    _destinationChainId: number,
    _amount: bigint
  ): Promise<bigint> {
    const baseGas = 200000n;
    const gasPrice = 100000000n;
    const ccipFee = 100000000000000n;

    return baseGas * gasPrice + ccipFee;
  }
}

export const CCIP_BRIDGE_ABI = [
  {
    inputs: [
      { name: "destinationChain", type: "uint64" },
      { name: "coverageAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
      { name: "asset", type: "string" },
    ],
    name: "sendCrossChainCoverage",
    outputs: [{ name: "messageId", type: "bytes32" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "destinationChain", type: "uint64" },
      { name: "coverageAmount", type: "uint256" },
      { name: "duration", type: "uint256" },
    ],
    name: "estimateCCIPFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "messageId", type: "bytes32" }],
    name: "getPendingCoverage",
    outputs: [
      {
        components: [
          { name: "holder", type: "address" },
          { name: "coverageAmount", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "premium", type: "uint256" },
          { name: "sourceChain", type: "uint64" },
          { name: "timestamp", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "messageId", type: "bytes32" },
      { indexed: false, name: "destinationChain", type: "uint64" },
      { indexed: false, name: "fee", type: "uint256" },
    ],
    name: "CrossChainCoverageSent",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "messageId", type: "bytes32" },
      { indexed: false, name: "sourceChain", type: "uint64" },
    ],
    name: "CrossChainCoverageReceived",
    type: "event",
  },
] as const;
