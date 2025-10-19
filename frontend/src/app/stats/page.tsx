"use client";

import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useUserPolicies } from "@/lib/web3/hooks";

export default function StatsPage() {
  const { isConnected } = useAccount();
  const { policies, claims, isLoading } = useUserPolicies();

  const totalCoverageAmount = policies.reduce((sum, p) => sum + p.coverageAmount, BigInt(0));
  const totalPremiumPaid = policies.reduce((sum, p) => sum + p.premium, BigInt(0));
  const activePolicies = policies.filter((p) => p.active).length;
  const totalClaims = claims.length;

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">Stats Dashboard</h2>
          <p className="text-gray-600">Connect your wallet to view your statistics</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">📊 Your Statistics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🛡️</div>
            <div className="text-blue-100 text-sm">Policies</div>
          </div>
          <div className="text-3xl font-bold mb-1">{activePolicies}</div>
          <div className="text-blue-100 text-sm">Active Policies</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">💰</div>
            <div className="text-green-100 text-sm">Coverage</div>
          </div>
          <div className="text-3xl font-bold mb-1">
            {formatEther(totalCoverageAmount).slice(0, 8)}
          </div>
          <div className="text-green-100 text-sm">Total ETH Coverage</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">💸</div>
            <div className="text-purple-100 text-sm">Premiums</div>
          </div>
          <div className="text-3xl font-bold mb-1">{formatEther(totalPremiumPaid).slice(0, 8)}</div>
          <div className="text-purple-100 text-sm">Total Premium Paid</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">📋</div>
            <div className="text-orange-100 text-sm">Claims</div>
          </div>
          <div className="text-3xl font-bold mb-1">{totalClaims}</div>
          <div className="text-orange-100 text-sm">Total Claims Submitted</div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold">Your Policies</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Policy ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Coverage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Premium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {policies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No policies found. Purchase coverage to get started!
                  </td>
                </tr>
              ) : (
                policies.map((policy) => (
                  <tr key={policy.id.toString()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">#{policy.id.toString()}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatEther(policy.coverageAmount)} ETH
                    </td>
                    <td className="px-6 py-4 text-sm">{formatEther(policy.premium)} ETH</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(Number(policy.startTime) * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(Number(policy.endTime) * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          policy.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {policy.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claims Table */}
      {claims.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold">Your Claims</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Claim ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Policy ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    TX Hash
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {claims.map((claim) => (
                  <tr key={claim.id.toString()} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">#{claim.id.toString()}</td>
                    <td className="px-6 py-4 text-sm">#{claim.policyId.toString()}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {formatEther(claim.amount)} ETH
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(Number(claim.timestamp) * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {claim.txHash ? (
                        <a
                          href={`https://hashscan.io/testnet/transaction/${claim.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {claim.txHash.slice(0, 10)}...
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
