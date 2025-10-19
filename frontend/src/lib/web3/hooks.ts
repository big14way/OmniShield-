import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import { CONTRACT_ADDRESSES, INSURANCE_POOL_ABI, RISK_ENGINE_ABI } from "./contracts";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

export function useInsurancePool() {
  const { chain } = useAccount();
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id]?.insurancePool : undefined;

  return {
    address: contractAddress,
    abi: INSURANCE_POOL_ABI,
  };
}

export function usePremiumCalculator(coverageAmount: bigint, duration: bigint) {
  const { address, abi } = useInsurancePool();

  const isValidAddress = address && address !== "0x0000000000000000000000000000000000000000";

  const { data: premium, isLoading } = useReadContract({
    address: isValidAddress ? address : undefined,
    abi,
    functionName: "calculatePremium",
    args: [coverageAmount, duration],
    query: {
      enabled: !!isValidAddress && coverageAmount > 0n && duration > 0n,
    },
  });

  return { premium: premium as bigint | undefined, isLoading, isValidChain: !!isValidAddress };
}

export function usePolicy(policyId: bigint) {
  const { address, abi } = useInsurancePool();

  const {
    data: policy,
    isLoading,
    refetch,
  } = useReadContract({
    address,
    abi,
    functionName: "getPolicy",
    args: [policyId],
    query: {
      enabled: !!address && policyId > 0n,
    },
  });

  return { policy, isLoading, refetch };
}

export function usePoolBalance() {
  const { address, abi } = useInsurancePool();

  const { data: balance, isLoading } = useReadContract({
    address,
    abi,
    functionName: "totalPoolBalance",
    query: {
      enabled: !!address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  return { balance: balance as bigint | undefined, isLoading };
}

export function usePurchaseCoverage() {
  const { address, abi } = useInsurancePool();
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync, data: hash, isPending, error: writeError } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState<Error | null>(null);
  const [policyId, setPolicyId] = useState<bigint | null>(null);

  // Disable waitForTransactionReceipt for Hedera (chain 296) due to RPC incompatibility
  const isHedera = chain?.id === 296;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash && !isHedera && !manualSuccess,
    },
  });

  const purchaseCoverage = async (coverageAmount: bigint, duration: bigint, premium: bigint) => {
    if (!address) {
      console.error("❌ Contract address not found");
      throw new Error("Contract address not found");
    }

    console.log("📝 Preparing transaction...", {
      address,
      coverageAmount: coverageAmount.toString(),
      duration: duration.toString(),
      premium: premium.toString(),
    });

    setIsProcessing(true);
    setManualSuccess(false);
    
    try {
      const result = await writeContractAsync({
        address,
        abi,
        functionName: "createPolicy",
        args: [coverageAmount, duration],
        value: premium,
      });
      
      console.log("✅ Transaction hash:", result);
      
      // For Hedera, mark as success immediately since we can't wait for receipt
      // User can verify on HashScan using the transaction hash link
      if (chain?.id === 296) {
        console.log("🔷 Hedera transaction - marking success immediately");
        console.log("🔗 Verify on HashScan:", `https://hashscan.io/testnet/tx/${result}`);
        
        // Fetch transaction receipt to check if it actually succeeded
        // Retry up to 3 times with increasing delays for Hedera processing
        const checkReceipt = async (attempt = 1, maxAttempts = 3) => {
          try {
            console.log(`🔍 Checking receipt (attempt ${attempt}/${maxAttempts})...`);
            const receipt = await publicClient?.getTransactionReceipt({ hash: result });
            console.log("📄 Transaction receipt:", receipt);
            
            // Check transaction status
            if (receipt?.status === 'reverted' || receipt?.status === 0 || receipt?.status === '0x0') {
              console.error("❌ Transaction reverted on-chain!");
              console.error("Receipt:", receipt);
              console.error("🔗 View on HashScan:", `https://hashscan.io/testnet/transaction/${result}`);
              setManualError(new Error("Transaction reverted: The contract rejected this transaction. This might be due to insufficient premium, invalid parameters, or contract validation failure."));
              setManualSuccess(false);
              return;
            }
            
            // Transaction succeeded!
            console.log("✅ Transaction confirmed on-chain with status:", receipt?.status);
            setManualSuccess(true);
            
            // Look for PolicyCreated event
            if (receipt?.logs && receipt.logs.length > 0) {
              for (const log of receipt.logs) {
                // PolicyCreated event signature: PolicyCreated(uint256,address,uint256,uint256)
                // First topic is event signature, second is policyId (indexed)
                if (log.topics.length >= 2) {
                  const extractedPolicyId = BigInt(log.topics[1]);
                  console.log("🎫 Policy ID from event:", extractedPolicyId.toString());
                  setPolicyId(extractedPolicyId);
                  break;
                }
              }
            }
            
            if (!policyId && receipt?.logs.length === 0) {
              console.warn("⚠️ No events emitted - transaction may have failed silently");
            }
          } catch (error) {
            // Receipt not found yet - retry if attempts remain
            if (error instanceof Error && error.name === 'TransactionReceiptNotFoundError' && attempt < maxAttempts) {
              console.log(`⏳ Receipt not ready yet, retrying in ${2 * attempt} seconds...`);
              setTimeout(() => checkReceipt(attempt + 1, maxAttempts), 2000 * attempt);
              return;
            }
            
            // Final attempt failed or other error
            console.error("❌ Error fetching receipt:", error);
            console.error("🔗 Check status on HashScan:", `https://hashscan.io/testnet/transaction/${result}`);
            
            // Don't set error - let user check HashScan manually
            // The transaction might still be processing
            setManualSuccess(false);
            console.warn("⚠️ Could not verify transaction status. Please check HashScan to confirm.");
          }
        };
        
        // Start checking after 5 seconds
        setTimeout(() => checkReceipt(1, 3), 5000);
      }
      
      return result;
    } catch (error) {
      console.error("❌ Transaction failed:", error);
      setManualSuccess(false);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Log status changes (skip receipt errors on Hedera)
  if (hash && isConfirming && !isHedera) {
    console.log("⏳ Waiting for confirmation...", hash);
  }
  if ((isSuccess || manualSuccess) && hash) {
    console.log("🎉 Transaction confirmed!", hash);
  }
  if (writeError) {
    console.error("❌ Transaction error:", writeError);
  }

  return {
    purchaseCoverage,
    isPending: isPending || (isConfirming && !manualSuccess && !manualError && !isHedera) || isProcessing,
    isSuccess: isSuccess || manualSuccess,
    hash,
    policyId,
    error: writeError || manualError,
  };
}

export function useSubmitClaim() {
  const { address, abi } = useInsurancePool();
  const { writeContractAsync, data: hash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const submitClaim = async (policyId: bigint, claimAmount: bigint) => {
    if (!address) throw new Error("Contract address not found");

    return await writeContractAsync({
      address,
      abi,
      functionName: "submitClaim",
      args: [policyId, claimAmount],
    });
  };

  return {
    submitClaim,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  };
}

export function useRiskScore(coverageAmount: bigint, duration: bigint, userAddress?: Address) {
  const { chain } = useAccount();
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id]?.riskEngine : undefined;

  const { data: riskScore, isLoading } = useReadContract({
    address: contractAddress,
    abi: RISK_ENGINE_ABI,
    functionName: "calculateRiskScore",
    args: [coverageAmount, duration, userAddress || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!contractAddress && coverageAmount > 0n && duration > 0n && !!userAddress,
    },
  });

  return { riskScore: riskScore as bigint | undefined, isLoading };
}

export * from "./hooks/useCCIP";
export * from "./hooks/useUserPolicies";
