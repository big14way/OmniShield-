"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CCIPService } from "@/lib/integrations/ccip";
import { formatCurrency } from "@/lib/utils";

export function CrossChainCoverage() {
  const { address, isConnected, chain } = useAccount();
  const [selectedChain, setSelectedChain] = useState<string>("");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [asset, setAsset] = useState("ETH");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const supportedChains = CCIPService.getSupportedChains();

  const handleCrossChainCoverage = async () => {
    if (!coverageAmount || !selectedChain || !address) return;

    try {
      const chainConfig = CCIPService.getSupportedChains().find(
        (c) => c.chainSelector === selectedChain
      );

      if (!chainConfig) return;

      const estimatedFee = await CCIPService.estimateCrossChainFee(
        chain?.id || 0,
        chainConfig.chainId,
        parseEther(coverageAmount)
      );

      writeContract({
        address: "0x0000000000000000000000000000000000000000",
        abi: [
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
        ],
        functionName: "sendCrossChainCoverage",
        args: [BigInt(selectedChain), parseEther(coverageAmount), BigInt(duration * 86400), asset],
        value: estimatedFee,
      });
    } catch (error) {
      console.error("Cross-chain coverage error:", error);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-50 rounded-xl p-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-gray-600">Please connect your wallet to purchase cross-chain coverage</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Cross-Chain Coverage</h2>
        <p className="text-gray-600">
          Purchase insurance coverage on one chain and protect assets on another using Chainlink
          CCIP
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-blue-600 text-white p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-2">🌉 Powered by Chainlink CCIP</h3>
        <p className="text-sm opacity-90">
          Secure cross-chain messaging enables seamless coverage across multiple blockchain networks
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Purchase Cross-Chain Coverage</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Destination Chain</label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select destination chain</option>
              {supportedChains.map((chain) => (
                <option key={chain.chainId} value={chain.chainSelector}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Asset to Cover</label>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ETH">Ethereum (ETH)</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="HBAR">Hedera (HBAR)</option>
              <option value="USDC">USD Coin (USDC)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Coverage Amount</label>
            <input
              type="number"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Duration (Days)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {coverageAmount && selectedChain && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Coverage Amount</span>
                <span className="font-medium">
                  {coverageAmount} {asset}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">{duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Premium</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(parseFloat(coverageAmount) * 0.05)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CCIP Bridge Fee</span>
                <span className="font-medium">~0.001 ETH</span>
              </div>
            </div>
          )}

          <button
            onClick={handleCrossChainCoverage}
            disabled={!coverageAmount || !selectedChain || isPending || isConfirming}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? "Processing..." : "Purchase Cross-Chain Coverage"}
          </button>

          {isSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              ✅ Cross-chain coverage request sent successfully!
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">How Cross-Chain Coverage Works</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <div className="font-medium">Purchase on Source Chain</div>
              <div className="text-sm text-gray-600">
                Buy coverage on your preferred chain with your preferred payment method
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <div className="font-medium">CCIP Message Routing</div>
              <div className="text-sm text-gray-600">
                Chainlink CCIP securely transmits your coverage details across chains
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <div className="font-medium">Coverage Active on Destination</div>
              <div className="text-sm text-gray-600">
                Your assets are now protected on the destination chain
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <div className="font-medium">Submit Claims Anywhere</div>
              <div className="text-sm text-gray-600">
                File claims on either chain and receive payouts automatically
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {supportedChains.map((chain) => (
          <div
            key={chain.chainId}
            className={`bg-white p-4 rounded-xl border-2 ${
              chain.enabled ? "border-green-200" : "border-gray-200"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="font-semibold">{chain.name}</div>
              {chain.enabled && (
                <div className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</div>
              )}
            </div>
            <div className="text-xs text-gray-600">Chain ID: {chain.chainId}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
