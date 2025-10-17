"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { usePremiumCalculator, usePurchaseCoverage } from "@/lib/web3/hooks";
import { useAssetPrice } from "@/lib/hooks/usePrices";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { TransactionStatus } from "@/components/common/TransactionStatus";

const ASSETS = [
  { symbol: "ETH", name: "Ethereum", icon: "⟠" },
  { symbol: "BTC", name: "Bitcoin", icon: "₿" },
  { symbol: "HBAR", name: "Hedera", icon: "ℏ" },
];

const COVERAGE_TYPES = [
  {
    id: "price_protection",
    name: "Price Protection",
    description: "Coverage against price drops > 20%",
    icon: "📉",
  },
  {
    id: "smart_contract",
    name: "Smart Contract",
    description: "Protection against contract exploits",
    icon: "🔒",
  },
  {
    id: "rug_pull",
    name: "Rug Pull Protection",
    description: "Coverage against project abandonment",
    icon: "🛡️",
  },
];

export function PurchaseCoverage() {
  const { isConnected } = useAccount();
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [coverageAmount, setCoverageAmount] = useState("10");
  const [duration, setDuration] = useState(30); // days
  const [selectedType, setSelectedType] = useState(COVERAGE_TYPES[0]);

  const { price: assetPrice } = useAssetPrice(selectedAsset.symbol);
  const coverageAmountWei = parseEther(coverageAmount || "0");
  const durationSeconds = BigInt(duration * 24 * 60 * 60);

  const { premium, isLoading: isPremiumLoading } = usePremiumCalculator(
    coverageAmountWei,
    durationSeconds
  );

  const { purchaseCoverage, isPending, isSuccess, hash } = usePurchaseCoverage();

  const usdValue = assetPrice ? parseFloat(coverageAmount || "0") * assetPrice.price : 0;

  const handlePurchase = async () => {
    if (!premium || !isConnected) return;

    try {
      await purchaseCoverage(coverageAmountWei, durationSeconds, premium);
    } catch (error) {
      console.error("Failed to purchase coverage:", error);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      setCoverageAmount("10");
      setDuration(30);
    }
  }, [isSuccess]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">Purchase Coverage</h2>
        <p className="text-gray-600">Protect your crypto assets with parametric insurance</p>
      </div>

      {/* Asset Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Asset</label>
        <div className="grid grid-cols-3 gap-3">
          {ASSETS.map((asset) => (
            <button
              key={asset.symbol}
              onClick={() => setSelectedAsset(asset)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedAsset.symbol === asset.symbol
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-3xl mb-1">{asset.icon}</div>
              <div className="font-medium">{asset.symbol}</div>
              <div className="text-xs text-gray-500">{asset.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Coverage Amount Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Coverage Amount</label>
        <div className="relative">
          <input
            type="number"
            value={coverageAmount}
            onChange={(e) => setCoverageAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-4 top-3 text-gray-500 font-medium">
            {selectedAsset.symbol}
          </div>
        </div>
        {usdValue > 0 && (
          <div className="mt-2 text-sm text-gray-600">≈ {formatCurrency(usdValue)}</div>
        )}
      </div>

      {/* Duration Slider */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Coverage Period: {formatDuration(duration)}
        </label>
        <input
          type="range"
          min="7"
          max="365"
          step="1"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>7 days</span>
          <span>1 year</span>
        </div>
      </div>

      {/* Coverage Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Coverage Type</label>
        <div className="space-y-2">
          {COVERAGE_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                selectedType.id === type.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-gray-500">{type.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Premium Calculator */}
      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Coverage Amount</span>
          <span className="font-medium">
            {coverageAmount} {selectedAsset.symbol}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium">{formatDuration(duration)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Coverage Type</span>
          <span className="font-medium">{selectedType.name}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-lg">Premium</span>
            <div className="text-right">
              {isPremiumLoading ? (
                <div className="text-gray-400">Calculating...</div>
              ) : premium ? (
                <>
                  <div className="font-bold text-xl">{formatEther(premium)} ETH</div>
                  <div className="text-sm text-gray-500">
                    ≈{" "}
                    {assetPrice
                      ? formatCurrency(parseFloat(formatEther(premium)) * assetPrice.price)
                      : "---"}
                  </div>
                </>
              ) : (
                <div className="text-gray-400">---</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Button */}
      <button
        onClick={handlePurchase}
        disabled={!isConnected || !premium || isPending || isPremiumLoading}
        className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {!isConnected
          ? "Connect Wallet"
          : isPending
          ? "Processing..."
          : isPremiumLoading
          ? "Calculating Premium..."
          : "Purchase Coverage"}
      </button>

      <TransactionStatus
        hash={hash}
        isPending={isPending}
        isSuccess={isSuccess}
        successMessage="Coverage purchased successfully! Your policy is now active."
        pendingMessage="Purchasing coverage..."
      />
    </div>
  );
}
