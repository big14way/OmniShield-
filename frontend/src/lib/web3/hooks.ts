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

  const { data: premium, isLoading } = useReadContract({
    address,
    abi,
    functionName: "calculatePremium",
    args: [coverageAmount, duration],
    query: {
      enabled: !!address && coverageAmount > 0n && duration > 0n,
    },
  });

  return { premium: premium as bigint | undefined, isLoading };
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
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const [isProcessing, setIsProcessing] = useState(false);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseCoverage = async (coverageAmount: bigint, duration: bigint, premium: bigint) => {
    if (!address) throw new Error("Contract address not found");

    setIsProcessing(true);
    try {
      const result = await writeContractAsync({
        address,
        abi,
        functionName: "createPolicy",
        args: [coverageAmount, duration],
        value: premium,
      });
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    purchaseCoverage,
    isPending: isPending || isConfirming || isProcessing,
    isSuccess,
    hash,
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
