"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { usePoolBalance } from "@/lib/web3/hooks";
import { formatCurrency, formatPercent } from "@/lib/utils";

export function LiquidityPool() {
  const { isConnected } = useAccount();
  const { balance: poolBalance } = usePoolBalance();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");

  // Mock data - would come from API in production
  const stats = {
    tvl: poolBalance ? parseFloat(formatEther(poolBalance)) : 0,
    apy: 12.5,
    utilization: 65.3,
    yourPosition: 5000,
    yourShare: 2.3,
  };

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
          <div className="text-sm opacity-75 mt-2">↑ 5.2% this week</div>
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

      {/* Your Position */}
      {isConnected && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-100">
          <h3 className="text-lg font-semibold mb-4">Your Position</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Liquidity Provided</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.yourPosition)}</div>
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

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Liquidity
            </button>
            <button className="flex-1 py-3 bg-white border-2 border-gray-300 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
              Withdraw
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
              <div className="font-medium">Deposit ETH or USDC</div>
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
                <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.0"
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!addAmount || parseFloat(addAmount) <= 0}
                  className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Add Liquidity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
