"use client";

import { useEffect } from "react";
import { TransactionLink } from "./TransactionLink";

interface TransactionStatusProps {
  hash?: `0x${string}`;
  isPending?: boolean;
  isConfirming?: boolean;
  isSuccess?: boolean;
  onSuccess?: () => void;
  successMessage?: string;
  pendingMessage?: string;
}

export function TransactionStatus({
  hash,
  isPending,
  isConfirming,
  isSuccess,
  onSuccess,
  successMessage = "Transaction successful!",
  pendingMessage = "Processing transaction...",
}: TransactionStatusProps) {
  const isTransactionPending = isPending || isConfirming;
  const isTransactionSuccess = isSuccess;

  useEffect(() => {
    if (hash) {
      console.log("📊 Transaction status update:", {
        hash,
        pending: isTransactionPending,
        success: isTransactionSuccess,
      });
    }
  }, [hash, isTransactionPending, isTransactionSuccess]);

  useEffect(() => {
    if (isTransactionSuccess && onSuccess) {
      console.log("✅ Transaction successful, calling onSuccess callback");
      onSuccess();
    }
  }, [isTransactionSuccess, onSuccess]);

  if (!hash && !isTransactionPending && !isTransactionSuccess) {
    return null;
  }

  return (
    <div className="mt-4">
      {isTransactionPending && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">{pendingMessage}</p>
              {hash && (
                <div className="mt-1 text-xs text-yellow-700">
                  <TransactionLink txHash={hash} showIcon={true} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isTransactionSuccess && hash && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-2">{successMessage}</p>
              <div className="space-y-1">
                <div className="text-xs text-green-700">
                  <strong>Transaction Hash:</strong>
                </div>
                <div className="text-xs">
                  <TransactionLink txHash={hash} showIcon={true} />
                </div>
                <div className="text-xs text-green-600 mt-2">
                  👆 Click to view on HashScan
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
