"use client";

import { useState, useEffect } from "react";
import { useAccount, useSwitchChain, useBalance } from "wagmi";
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
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { switchChain } = useSwitchChain();
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [coverageAmount, setCoverageAmount] = useState("10");
  const [duration, setDuration] = useState(30); // days
  const [selectedType, setSelectedType] = useState(COVERAGE_TYPES[0]);

  const { price: assetPrice } = useAssetPrice(selectedAsset.symbol);
  const coverageAmountWei = parseEther(coverageAmount || "0");
  const durationSeconds = BigInt(duration * 24 * 60 * 60);

  const {
    premium,
    isLoading: isPremiumLoading,
    isValidChain,
  } = usePremiumCalculator(coverageAmountWei, durationSeconds);

  const {
    purchaseCoverage,
    isPending,
    isSuccess,
    hash,
    policyId,
    error: purchaseError,
  } = usePurchaseCoverage();

  const usdValue = assetPrice ? parseFloat(coverageAmount || "0") * assetPrice.price : 0;

  const hasValidAmount = coverageAmount && parseFloat(coverageAmount) > 0;
  const canPurchase =
    isConnected && isValidChain && hasValidAmount && !isPending && !isPremiumLoading;

  const handleSwitchToHedera = () => {
    switchChain?.({ chainId: 296 });
  };

  const handlePurchase = async () => {
    if (!premium || !isConnected) return;

    try {
      console.log("🔵 Starting purchase...", {
        coverageAmount: coverageAmount,
        coverageAmountWei: coverageAmountWei.toString(),
        duration: duration,
        durationSeconds: durationSeconds.toString(),
        premium: formatEther(premium),
        premiumWei: premium.toString(),
      });

      // Validate before sending
      if (coverageAmountWei === 0n) {
        alert("Coverage amount cannot be zero");
        return;
      }
      if (durationSeconds === 0n) {
        alert("Duration cannot be zero");
        return;
      }
      if (!premium || premium === 0n) {
        alert("Premium is not calculated yet. Please wait a moment and try again.");
        return;
      }

      // Check if user has enough balance (2x premium in wei)
      const requiredBalance = premium * 2n;
      const userBalance = balance?.value || 0n;

      if (userBalance < requiredBalance) {
        alert(
          `Insufficient HBAR balance!\n\n` +
            `Required: ${formatEther(requiredBalance)} HBAR\n` +
            `Your balance: ${formatEther(userBalance)} HBAR\n\n` +
            `Please get test HBAR from: https://portal.hedera.com/faucet`
        );
        return;
      }

      console.log("✅ All validations passed, proceeding with purchase...");
      console.log("🔍 Final check - Premium value:", {
        premium,
        premiumString: premium.toString(),
        premiumType: typeof premium,
        isZero: premium === 0n,
        userBalance: userBalance.toString(),
        requiredBalance: requiredBalance.toString(),
      });

      const txHash = await purchaseCoverage(coverageAmountWei, durationSeconds, premium);

      console.log("✅ Transaction submitted:", txHash);
    } catch (error) {
      console.error("❌ Failed to purchase coverage:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Transaction failed: ${errorMessage}`);
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

      {/* Network Warning - Show prominently if wrong network */}
      {isConnected && !isValidChain && (
        <div className="p-6 bg-red-50 border-2 border-red-300 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">Wrong Network!</h3>
              <p className="text-red-800 mb-4">
                You&apos;re currently on <strong>{chain?.name || "Unknown Network"}</strong>.
                OmniShield contracts are deployed on <strong>Hedera Testnet</strong>.
              </p>
              <button
                onClick={handleSwitchToHedera}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Switch to Hedera Testnet (Chain ID: 296)
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Debug Info */}
      {isConnected && (
        <div className="p-3 bg-gray-100 rounded-lg text-xs space-y-1">
          <div>
            <strong>Debug Info:</strong>
          </div>
          <div>• Connected: {isConnected ? "✅" : "❌"}</div>
          <div>
            • Current Chain: {chain?.name || "Unknown"} (ID: {chain?.id || "N/A"})
          </div>
          <div>• Valid Chain (Hedera 296): {isValidChain ? "✅" : "❌"}</div>
          <div>• Coverage Amount: {coverageAmount || "empty"}</div>
          <div>• Coverage Wei: {coverageAmountWei?.toString() || "null"}</div>
          <div>
            • Duration: {duration} days ({durationSeconds.toString()} seconds)
          </div>
          <div>• Premium Loading: {isPremiumLoading ? "⏳" : "✅"}</div>
          <div>• Premium: {premium ? formatEther(premium) : "null"} HBAR</div>
          <div>• Premium Wei: {premium?.toString() || "null"}</div>
          <div>• Premium Type: {premium ? typeof premium : "undefined"}</div>
          <div>• Premium === 0n: {premium === 0n ? "YES" : "NO"}</div>
          <div>• Can Purchase: {canPurchase ? "✅" : "❌"}</div>
        </div>
      )}

      {/* Transaction Button */}
      <button
        onClick={isConnected && !isValidChain ? handleSwitchToHedera : handlePurchase}
        disabled={!isConnected || (isValidChain && !canPurchase)}
        className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {!isConnected
          ? "Connect Wallet"
          : !isValidChain
            ? "Switch to Hedera Testnet"
            : isPending
              ? "Processing..."
              : isPremiumLoading
                ? "Calculating Premium..."
                : !hasValidAmount
                  ? "Enter coverage amount"
                  : premium && premium > 0n
                    ? `Purchase Coverage for ${formatEther(premium)} HBAR`
                    : "Purchase Coverage"}
      </button>

      {isConnected &&
        isValidChain &&
        !isPremiumLoading &&
        hasValidAmount &&
        (!premium || premium === 0n) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            ❌ Contract error: Unable to calculate premium. Please try again or contact support.
          </div>
        )}

      <TransactionStatus
        hash={hash}
        isPending={isPending}
        isSuccess={isSuccess}
        successMessage="Coverage purchased successfully! Your policy is now active."
        pendingMessage="Purchasing coverage..."
      />

      {isSuccess && policyId && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-semibold text-blue-900 mb-2">📋 Policy Created!</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Policy ID:</span>
              <span className="font-mono font-bold text-blue-900">#{policyId.toString()}</span>
            </div>
            <div className="text-xs text-blue-600">
              💡 Save this Policy ID to submit claims later
            </div>
          </div>
        </div>
      )}

      {purchaseError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          ❌ Transaction failed:{" "}
          {purchaseError instanceof Error ? purchaseError.message : "Unknown error"}
        </div>
      )}
    </div>
  );
}
