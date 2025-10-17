import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CCIP_BRIDGE_ABI } from "@/lib/integrations/ccip";
import { CONTRACT_ADDRESSES } from "../contracts";

export function useSendCrossChainCoverage() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const sendCoverage = async (
    chainId: number,
    destinationChain: bigint,
    coverageAmount: bigint,
    duration: bigint,
    asset: string,
    fee: bigint
  ) => {
    const addresses = CONTRACT_ADDRESSES[chainId];
    if (!addresses?.ccipBridge) throw new Error("CCIP bridge not deployed on this chain");

    return writeContract({
      address: addresses.ccipBridge,
      abi: CCIP_BRIDGE_ABI,
      functionName: "sendCrossChainCoverage",
      args: [destinationChain, coverageAmount, duration, asset],
      value: fee,
    });
  };

  return {
    sendCoverage,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useEstimateCCIPFee(
  chainId: number,
  destinationChain: bigint,
  coverageAmount: bigint,
  duration: bigint
) {
  const addresses = CONTRACT_ADDRESSES[chainId];

  return useReadContract({
    address: addresses?.ccipBridge,
    abi: CCIP_BRIDGE_ABI,
    functionName: "estimateCCIPFee",
    args: [destinationChain, coverageAmount, duration],
  });
}

export function useGetPendingCoverage(chainId: number, messageId: `0x${string}`) {
  const addresses = CONTRACT_ADDRESSES[chainId];

  return useReadContract({
    address: addresses?.ccipBridge,
    abi: CCIP_BRIDGE_ABI,
    functionName: "getPendingCoverage",
    args: [messageId],
  });
}
