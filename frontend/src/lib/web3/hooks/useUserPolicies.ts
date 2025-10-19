import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { CONTRACT_ADDRESSES, INSURANCE_POOL_ABI } from "../contracts";
import type { Log } from "viem";

export interface Policy {
  id: bigint;
  holder: string;
  coverageAmount: bigint;
  premium: bigint;
  startTime: bigint;
  endTime: bigint;
  active: boolean;
  txHash: string;
}

export interface Claim {
  id: bigint;
  policyId: bigint;
  amount: bigint;
  timestamp: bigint;
  txHash: string;
}

export function useUserPolicies() {
  const { address, chain } = useAccount();
  const publicClient = usePublicClient();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !chain || !publicClient) return;

    const fetchPolicies = async () => {
      setIsLoading(true);
      try {
        const contractAddress = CONTRACT_ADDRESSES[chain.id]?.insurancePool;
        if (!contractAddress || contractAddress === "0x0000000000000000000000000000000000000000")
          return;

        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();

        // For Hedera, we can only query the last 7 days of logs
        // The Hedera RPC has a 7-day (604800 seconds) limit on log queries
        // To be safe, we'll query only the last 5 days worth of blocks
        // Hedera blocks are produced approximately every 2-3 seconds
        // 5 days = 432000 seconds, at ~2 seconds per block = ~216000 blocks
        // Use 200k blocks to be conservative
        const isHedera = chain.id === 296; // Hedera testnet
        const fromBlock = isHedera ? currentBlock - BigInt(200000) : ("earliest" as const);

        const policyCreatedLogs = (await publicClient.getLogs({
          address: contractAddress,
          event: {
            type: "event",
            name: "PolicyCreated",
            inputs: [
              { type: "uint256", name: "policyId", indexed: true },
              { type: "address", name: "holder", indexed: true },
              { type: "uint256", name: "coverageAmount" },
              { type: "uint256", name: "premium" },
            ],
          },
          args: {
            holder: address,
          },
          fromBlock,
          toBlock: "latest",
        })) as Log[];

        const policiesData: Policy[] = await Promise.all(
          policyCreatedLogs.map(async (log: Log) => {
            const args = (log as { args?: Record<string, unknown> }).args;
            const policyId = args?.policyId as bigint;

            const policyData = (await publicClient.readContract({
              address: contractAddress,
              abi: INSURANCE_POOL_ABI,
              functionName: "getPolicy",
              args: [policyId],
            })) as {
              holder: string;
              coverageAmount: bigint;
              premium: bigint;
              startTime: bigint;
              endTime: bigint;
              active: boolean;
            };

            return {
              id: policyId,
              ...policyData,
              txHash: log.transactionHash || "",
            };
          })
        );

        setPolicies(policiesData);

        const claimLogs = (await publicClient.getLogs({
          address: contractAddress,
          event: {
            type: "event",
            name: "PolicyClaimed",
            inputs: [
              { type: "uint256", name: "policyId", indexed: true },
              { type: "uint256", name: "amount" },
            ],
          },
          fromBlock,
          toBlock: "latest",
        })) as Log[];

        const claimsData: Claim[] = claimLogs
          .map((log: Log, index: number) => {
            const args = (log as { args?: Record<string, unknown> }).args;
            return {
              id: BigInt(index),
              policyId: args?.policyId as bigint,
              amount: args?.amount as bigint,
              timestamp: BigInt(Date.now() / 1000),
              txHash: log.transactionHash || "",
            };
          })
          .filter((claim) => policiesData.some((policy) => policy.id === claim.policyId));

        setClaims(claimsData);
      } catch (error) {
        console.error("Error fetching policies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolicies();
  }, [address, chain, publicClient]);

  return { policies, claims, isLoading };
}
