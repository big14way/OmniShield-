"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import {
  usePoolBalance,
  useLiquidityProviderBalance,
  useAddLiquidity,
  useWithdrawLiquidity,
} from "@/lib/web3/hooks";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function LiquidityPool() {
  const { isConnected, chain, address: userAddress } = useAccount();
  
  const { balance: poolBalance } = usePoolBalance();
  const { balance: userLiquidityBalance, refetch: refetchBalance } = useLiquidityProviderBalance();
  const {
    addLiquidity,
    isPending: isAdding,
    isSuccess: addSuccess,
    hash: addHash,
  } = useAddLiquidity();
  const {
    withdrawLiquidity,
    isPending: isWithdrawing,
    isSuccess: withdrawSuccess,
    hash: withdrawHash,
  } = useWithdrawLiquidity();

  // State declarations MUST come before useEffect that use them
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log("🔗 Account State:", {
      isConnected,
      chainId: chain?.id,
      chainName: chain?.name,
      userAddress,
    });
  }, [isConnected, chain?.id, chain?.name, userAddress]);

  // Refetch balance when transactions succeed
  useEffect(() => {
    if (addSuccess && addHash) {
      console.log("✅ Add liquidity successful!", addHash);
      setSuccessMessage(`Successfully added ${addAmount} HBAR to liquidity pool!`);
      setLastTxHash(addHash);
      setError(null);
      
      // Close modal after short delay
      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddAmount("");
      }, 1500);
      
      // Refetch balance multiple times
      const refetchInterval = setInterval(() => {
        refetchBalance();
      }, 2000);

      // Clear after 10 seconds
      setTimeout(() => clearInterval(refetchInterval), 10000);

      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);

      return () => clearInterval(refetchInterval);
    }
  }, [addSuccess, addHash, addAmount, refetchBalance]);

  useEffect(() => {
    if (withdrawSuccess && withdrawHash) {
      console.log("✅ Withdraw liquidity successful!", withdrawHash);
      setSuccessMessage(`Successfully withdrew ${withdrawAmount} HBAR from liquidity pool!`);
      setLastTxHash(withdrawHash);
      setError(null);
      
      // Close modal after short delay
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawAmount("");
      }, 1500);
      
      // Refetch balance multiple times
      const refetchInterval = setInterval(() => {
        refetchBalance();
      }, 2000);

      // Clear after 10 seconds
      setTimeout(() => clearInterval(refetchInterval), 10000);

      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);

      return () => clearInterval(refetchInterval);
    }
  }, [withdrawSuccess, withdrawHash, withdrawAmount, refetchBalance]);

  const stats = {
    tvl: poolBalance ? parseFloat(formatEther(poolBalance)) : 0,
    apy: 12.5,
    utilization: 65.3,
    yourPosition: userLiquidityBalance ? parseFloat(formatEther(userLiquidityBalance)) : 0,
    yourShare:
      poolBalance && userLiquidityBalance && poolBalance > 0n
        ? (parseFloat(formatEther(userLiquidityBalance)) / parseFloat(formatEther(poolBalance))) *
          100
        : 0,
  };

  const handleAddLiquidity = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      console.log("🚀 Starting add liquidity process...", {
        isConnected,
        chainId: chain?.id,
        chainName: chain?.name,
        amount: addAmount,
      });
      const amount = parseEther(addAmount);
      console.log("💧 Calling addLiquidity with", amount.toString(), "wei");
      await addLiquidity(amount);
      console.log("✅ Transaction submitted, waiting for confirmation...");
      // Don't close modal yet - let useEffect close it after success
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to add liquidity";
      setError(errorMsg);
      console.error("❌ Add liquidity error:", err);
      // Keep modal open to show error
    }
  };

  const handleWithdrawLiquidity = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      const amount = parseEther(withdrawAmount);
      console.log("💸 Calling withdrawLiquidity with", amount.toString(), "wei");
      await withdrawLiquidity(amount);
      console.log("✅ Transaction submitted, waiting for confirmation...");
      // Don't close modal yet - let useEffect close it after success
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to withdraw liquidity";
      setError(errorMsg);
      console.error("❌ Withdraw liquidity error:", err);
      // Keep modal open to show error
    }
  };

  const isHedera = chain?.id === 296;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Liquidity Pool</h2>
        <p className="text-gray-600">Provide liquidity and earn premiums from coverage purchases</p>
      </div>

      {/* Pool Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm opacity-90 mb-1">Total Value Locked</div>
          <div className="text-3xl font-bold">{formatCurrency(stats.tvl)}</div>
          <div className="text-sm opacity-75 mt-2">
            {poolBalance ? `${formatEther(poolBalance)} ${isHedera ? "HBAR" : "ETH"}` : "0"}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm opacity-90 mb-1">APY</div>
          <div className="text-3xl font-bold">{formatPercent(stats.apy)}</div>
          <div className="text-sm opacity-75 mt-2">Based on 30-day average</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm opacity-90 mb-1">Pool Utilization</div>
          <div className="text-3xl font-bold">{formatPercent(stats.utilization)}</div>
          <div className="text-sm opacity-75 mt-2">
            {formatCurrency(stats.tvl * (stats.utilization / 100))} active coverage
          </div>
        </div>
      </div>

      {/* Connection Prompt */}
      {!isConnected && (
        <div className="bg-blue-50 border-2 border-blue-200 p-8 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-6">
            Connect your wallet to provide liquidity and start earning
          </p>
          <ConnectButton />
        </div>
      )}

      {/* Wrong Network Warning */}
      {isConnected && !chain?.id && (
        <div className="bg-yellow-50 border-2 border-yellow-300 p-8 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-4 text-yellow-800">⚠️ Network Not Detected</h3>
          <p className="text-gray-700 mb-4">
            Your wallet is connected but we cannot detect the network. Please ensure your wallet is
            properly connected.
          </p>
          <p className="text-sm text-gray-600">
            Try disconnecting and reconnecting your wallet.
          </p>
        </div>
      )}

      {/* Unsupported Network Warning */}
      {isConnected && chain?.id && chain?.id !== 296 && (
        <div className="bg-orange-50 border-2 border-orange-300 p-8 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-4 text-orange-800">
            ⚠️ Unsupported Network
          </h3>
          <p className="text-gray-700 mb-4">
            You&apos;re connected to <strong>{chain?.name || "Unknown Network"}</strong> (Chain ID:{" "}
            {chain?.id}), but this pool is only available on <strong>Hedera Testnet</strong>.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Please switch to Hedera Testnet in your wallet to use the liquidity pool.
          </p>
          <div className="mt-4 p-4 bg-white rounded-lg text-left max-w-md mx-auto">
            <p className="text-sm font-semibold mb-2">To add Hedera Testnet to MetaMask:</p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>Network Name: Hedera Testnet</li>
              <li>RPC URL: https://testnet.hashio.io/api</li>
              <li>Chain ID: 296</li>
              <li>Currency Symbol: HBAR</li>
              <li>Block Explorer: https://hashscan.io/testnet</li>
            </ul>
          </div>
        </div>
      )}

      {/* Contract Update Notice */}
      {isConnected && chain?.id === 296 && userLiquidityBalance === undefined && (
        <div className="bg-yellow-50 border-2 border-yellow-400 p-6 rounded-xl">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Contract Update Required
              </h3>
              <p className="text-yellow-800 mb-3">
                The liquidity pool functions are missing from the currently deployed contract.
                The contract needs to be redeployed with the updated code that includes:
              </p>
              <ul className="list-disc list-inside text-yellow-800 text-sm space-y-1 mb-3">
                <li><code className="bg-yellow-100 px-1 py-0.5 rounded">addLiquidity()</code></li>
                <li><code className="bg-yellow-100 px-1 py-0.5 rounded">withdrawLiquidity()</code></li>
                <li><code className="bg-yellow-100 px-1 py-0.5 rounded">getLiquidityProviderBalance()</code></li>
              </ul>
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm">
                <p className="font-semibold text-yellow-900 mb-1">📋 To Fix:</p>
                <p className="text-yellow-800">
                  Please see <code className="bg-white px-1 py-0.5 rounded font-mono text-xs">LIQUIDITY_FIX_INSTRUCTIONS.md</code> 
                  {" "}for deployment steps, or contact the development team.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Your Position */}
      {isConnected && chain?.id === 296 && userLiquidityBalance !== undefined && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100">
          <h3 className="text-lg font-semibold mb-4">Your Position</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Liquidity Provided</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.yourPosition)}</div>
              <div className="text-xs text-gray-500 mt-1">
                {userLiquidityBalance ? formatEther(userLiquidityBalance) : "0"}{" "}
                {isHedera ? "HBAR" : "ETH"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Pool Share</div>
              <div className="text-2xl font-bold">{formatPercent(stats.yourShare)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Est. Annual Earnings</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.yourPosition * (stats.apy / 100))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Available to Withdraw</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.yourPosition * 0.8)}</div>
              <div className="text-xs text-gray-500 mt-1">80% (20% locked in active coverage)</div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 mb-1">Transaction Failed</h4>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 mb-1">Transaction Confirmed!</h4>
                  <p className="text-green-700 text-sm mb-2">{successMessage}</p>
                  {isHedera && lastTxHash && (
                    <a
                      href={`https://hashscan.io/testnet/transaction/${lastTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium underline inline-flex items-center gap-1"
                    >
                      View on HashScan →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {(isAdding || isWithdrawing) && (
            <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800 mb-1">
                    {isAdding ? "Adding Liquidity..." : "Withdrawing..."}
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Please confirm the transaction in your wallet and wait for confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              disabled={isAdding}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isAdding ? "Adding..." : "Add Liquidity"}
            </button>
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              disabled={isWithdrawing || !userLiquidityBalance || userLiquidityBalance === 0n}
              className="flex-1 py-3 bg-white border-2 border-gray-300 font-semibold rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              {isWithdrawing ? "Withdrawing..." : "Withdraw"}
            </button>
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <h3 className="text-lg font-semibold mb-4">How Liquidity Provision Works</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <div className="font-medium">Deposit {isHedera ? "HBAR" : "ETH or USDC"}</div>
              <div className="text-sm text-gray-600">
                Your funds are used to underwrite insurance coverage
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <div className="font-medium">Earn Premiums</div>
              <div className="text-sm text-gray-600">
                Receive a share of premiums paid by coverage purchasers
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <div className="font-medium">Automated Risk Management</div>
              <div className="text-sm text-gray-600">
                Smart contracts handle claims and payouts automatically
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <div>
              <div className="font-medium">Withdraw Anytime</div>
              <div className="text-sm text-gray-600">
                Withdraw your liquidity plus earned premiums (subject to utilization)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Liquidity Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add Liquidity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount ({isHedera ? "HBAR" : "ETH"})
                </label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected APY</span>
                  <span className="font-medium">{formatPercent(stats.apy)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Annual Earnings</span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(addAmount || "0") * (stats.apy / 100))}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setError(null);
                  }}
                  className="flex-1 py-3 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLiquidity}
                  disabled={!addAmount || parseFloat(addAmount) <= 0 || isAdding}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? "Adding..." : "Add Liquidity"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Liquidity Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Withdraw Liquidity</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount ({isHedera ? "HBAR" : "ETH"})
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                  max={userLiquidityBalance ? formatEther(userLiquidityBalance) : "0"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Available: {userLiquidityBalance ? formatEther(userLiquidityBalance) : "0"}{" "}
                  {isHedera ? "HBAR" : "ETH"}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsWithdrawModalOpen(false);
                    setError(null);
                  }}
                  className="flex-1 py-3 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawLiquidity}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isWithdrawing}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
