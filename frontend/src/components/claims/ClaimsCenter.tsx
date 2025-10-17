"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { usePolicy, useSubmitClaim, useUserPolicies } from "@/lib/web3/hooks";
import { TransactionStatus } from "@/components/common/TransactionStatus";

interface Claim {
  id: number;
  policyId: number;
  status: "pending" | "approved" | "rejected" | "paid";
  amount: string;
  date: string;
  txHash?: string;
}

export function ClaimsCenter() {
  const { isConnected } = useAccount();
  const [selectedPolicyId, setSelectedPolicyId] = useState<bigint>(1n);
  const [claimAmount, setClaimAmount] = useState("");

  const { policy } = usePolicy(selectedPolicyId);
  const { submitClaim, isPending, isSuccess, hash } = useSubmitClaim();
  const { policies, claims: userClaims, isLoading: isPoliciesLoading } = useUserPolicies();

  const activeCoverage = policies
    .filter((p) => p.active)
    .map((p) => ({
      id: Number(p.id),
      asset: "ETH",
      amount: formatEther(p.coverageAmount),
      type: "Insurance Policy",
      startDate: new Date(Number(p.startTime) * 1000).toLocaleDateString(),
      endDate: new Date(Number(p.endTime) * 1000).toLocaleDateString(),
      premium: formatEther(p.premium),
      status: "active" as const,
      txHash: p.txHash,
    }));

  const claims = userClaims.map((c) => ({
    id: Number(c.id),
    policyId: Number(c.policyId),
    status: "pending" as const,
    amount: formatEther(c.amount),
    date: new Date(Number(c.timestamp) * 1000).toLocaleDateString(),
    txHash: c.txHash,
  }));

  const handleSubmitClaim = async () => {
    if (!claimAmount || !selectedPolicyId) return;

    try {
      await submitClaim(selectedPolicyId, BigInt(claimAmount));
      setClaimAmount("");
    } catch (error) {
      console.error("Failed to submit claim:", error);
    }
  };

  const getStatusColor = (status: Claim["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-gray-50 rounded-xl p-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600">
            Please connect your wallet to view your coverage and claims
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Claims Center</h2>
        <p className="text-gray-600">Manage your active coverage and submit claims</p>
      </div>

      {/* Active Coverage Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Active Coverage {isPoliciesLoading && <span className="text-sm text-gray-500">(Loading...)</span>}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeCoverage.map((coverage) => (
            <div
              key={coverage.id}
              className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-2xl font-bold mb-1">
                    {coverage.amount} {coverage.asset}
                  </div>
                  <div className="text-sm text-gray-600">{coverage.type}</div>
                </div>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage Period</span>
                  <span className="font-medium">
                    {coverage.startDate} - {coverage.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Premium Paid</span>
                  <span className="font-medium">{coverage.premium} ETH</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPolicyId(BigInt(coverage.id))}
                className="w-full mt-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Claim
              </button>
            </div>
          ))}
        </div>

        {activeCoverage.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Active Coverage</h3>
            <p className="text-gray-600 mb-4">You don&apos;t have any active coverage policies</p>
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Purchase Coverage
            </button>
          </div>
        )}
      </div>

      {/* Submit Claim Form */}
      {selectedPolicyId > 0n && (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Submit New Claim</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Policy ID</label>
              <input
                type="number"
                value={selectedPolicyId.toString()}
                onChange={(e) => setSelectedPolicyId(BigInt(e.target.value || "0"))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Claim Amount (ETH)</label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {policy && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage Amount</span>
                  <span className="font-medium">{formatEther(policy.coverageAmount)} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Policy Status</span>
                  <span className={policy.active ? "text-green-600" : "text-red-600"}>
                    {policy.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmitClaim}
              disabled={!claimAmount || isPending || !policy?.active}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Submitting..." : "Submit Claim"}
            </button>

            <TransactionStatus
              hash={hash}
              isPending={isPending}
              isSuccess={isSuccess}
              successMessage="Claim submitted successfully!"
              pendingMessage="Submitting claim..."
            />
          </div>
        </div>
      )}

      {/* Claims History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Claims History</h3>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">#{claim.id}</td>
                  <td className="px-6 py-4 text-sm">#{claim.policyId}</td>
                  <td className="px-6 py-4 text-sm font-medium">{claim.amount} ETH</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{claim.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        claim.status
                      )}`}
                    >
                      {claim.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
