import { http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  injectedWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";

// Hedera Testnet configuration
export const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  network: "hedera-testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.hashio.io/api"] },
    public: { http: ["https://testnet.hashio.io/api"] },
  },
  blockExplorers: {
    default: { name: "Hashscan", url: "https://hashscan.io/testnet" },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: "OmniShield Insurance",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "1eebe528ca0ce94a99ceaa2e915058d7",
  chains: [hederaTestnet, sepolia, mainnet],
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet],
    },
    {
      groupName: "Other",
      wallets: [injectedWallet],
    },
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [hederaTestnet.id]: http("https://testnet.hashio.io/api"),
  },
  ssr: true,
});

console.log("🔧 Wagmi Config Initialized:", {
  appName: "OmniShield Insurance",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? "From ENV" : "Fallback",
  chains: config.chains.map((c) => `${c.name} (${c.id})`),
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
