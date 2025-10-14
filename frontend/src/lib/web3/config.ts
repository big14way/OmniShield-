import { http, createConfig } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

// Hedera Testnet configuration
export const hederaTestnet = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.hashio.io/api"] },
    public: { http: ["https://testnet.hashio.io/api"] },
  },
  blockExplorers: {
    default: { name: "Hashscan", url: "https://hashscan.io/testnet" },
  },
  testnet: true,
} as const;

export const config = createConfig({
  chains: [mainnet, sepolia, hederaTestnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hederaTestnet.id]: http(),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
