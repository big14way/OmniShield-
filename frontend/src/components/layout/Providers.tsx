"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { config, hederaTestnet } from "@/lib/web3/config";
import { useState, useEffect, type ReactNode } from "react";
import { reconnect } from "wagmi/actions";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Reconnect on mount to restore previous connection
  useEffect(() => {
    reconnect(config).catch((error) => {
      console.log("Failed to reconnect:", error);
    });
  }, []);

  return (
    <WagmiProvider config={config} reconnectOnMount={true}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={hederaTestnet}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
