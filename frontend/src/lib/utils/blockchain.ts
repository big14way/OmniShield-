export const BLOCK_EXPLORERS: Record<number, { name: string; url: string }> = {
  1: { name: "Etherscan", url: "https://etherscan.io" },
  11155111: { name: "Sepolia Etherscan", url: "https://sepolia.etherscan.io" },
  296: { name: "HashScan", url: "https://hashscan.io/testnet" },
  295: { name: "HashScan", url: "https://hashscan.io/mainnet" },
  137: { name: "PolygonScan", url: "https://polygonscan.com" },
  80002: { name: "PolygonScan Amoy", url: "https://amoy.polygonscan.com" },
};

export function getExplorerUrl(chainId: number): string {
  return BLOCK_EXPLORERS[chainId]?.url || "https://etherscan.io";
}

export function getExplorerName(chainId: number): string {
  return BLOCK_EXPLORERS[chainId]?.name || "Explorer";
}

export function getTxUrl(chainId: number, txHash: string): string {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

export function getAddressUrl(chainId: number, address: string): string {
  return `${getExplorerUrl(chainId)}/address/${address}`;
}

export function getContractUrl(chainId: number, address: string): string {
  return `${getExplorerUrl(chainId)}/contract/${address}`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortenTxHash(hash: string, chars = 6): string {
  if (!hash) return "";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
