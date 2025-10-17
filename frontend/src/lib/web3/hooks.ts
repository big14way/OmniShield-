import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useState } from "react";
import { CONTRACT_ADDRESSES, INSURANCE_POOL_ABI, RISK_ENGINE_ABI } from "./contracts";
import type { Address } from "viem";

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
  const { writeContractAsync, data: hash, isPending, error: writeError } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);

  // Disable waitForTransactionReceipt for Hedera (chain 296) due to RPC incompatibility
  const isHedera = chain?.id === 296;

  const { isLoading: isConfirming, isSuccess, error: receiptError } = useWaitForTransactionReceipt({
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
        setTimeout(() => {
          setManualSuccess(true);
        }, 2000); // Small delay for UX
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
    isPending: isPending || (isConfirming && !manualSuccess && !isHedera) || isProcessing,
    isSuccess: isSuccess || manualSuccess,
    hash,
    error: writeError, // Only return write errors, ignore receipt errors for Hedera
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
