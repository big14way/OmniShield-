"use client";

import { useChainId } from "wagmi";
import { getTxUrl, getExplorerName, shortenTxHash } from "@/lib/utils/blockchain";

interface TransactionLinkProps {
  txHash: string;
  chainId?: number;
  className?: string;
  showIcon?: boolean;
}

export function TransactionLink({
  txHash,
  chainId,
  className = "",
  showIcon = true,
}: TransactionLinkProps) {
  const currentChainId = useChainId();
  const chain = chainId || currentChainId;
  const explorerUrl = getTxUrl(chain, txHash);
  const explorerName = getExplorerName(chain);

  return (
    <a
      href={explorerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline ${className}`}
    >
      <span>{shortenTxHash(txHash)}</span>
      {showIcon && (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
      <span className="sr-only">View on {explorerName}</span>
    </a>
  );
}
