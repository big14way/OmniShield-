"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { formatAddress } from "@/lib/utils";
import Link from "next/link";

export function Header() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, chains } = useSwitchChain();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getChainName = (id: number) => {
    switch (id) {
      case 1:
        return "Ethereum";
      case 11155111:
        return "Sepolia";
      case 296:
        return "Hedera";
      default:
        return `Chain ${id}`;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🛡️ OmniShield
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/coverage"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Coverage
            </Link>
            <Link
              href="/liquidity"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Liquidity
            </Link>
            <Link
              href="/claims"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Claims
            </Link>
            <Link
              href="/stats"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Stats
            </Link>
          </nav>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {!mounted ? (
              <div className="px-6 py-2 bg-gray-200 rounded-lg font-medium animate-pulse">
                Loading...
              </div>
            ) : (
              <>
                {/* Chain Switcher */}
                {isConnected && (
                  <div className="relative group">
                    <button className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      {getChainName(chainId)}
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block">
                      {chains.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => switchChain({ chainId: chain.id })}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {chain.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connect/Disconnect Button */}
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      {formatAddress(address!)}
                    </div>
                    <button
                      onClick={() => disconnect()}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                      Connect Wallet
                    </button>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block">
                      {connectors.map((connector) => (
                        <button
                          key={connector.uid}
                          onClick={() => connect({ connector })}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                        >
                          <span>{connector.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
