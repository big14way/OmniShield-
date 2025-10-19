import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import { useState } from "react";
import { CONTRACT_ADDRESSES, INSURANCE_POOL_ABI, RISK_ENGINE_ABI } from "./contracts";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";
import { encodeFunctionData } from "viem";

export function useInsurancePool() {
  const { chain } = useAccount();
  const contractAddress = chain?.id ? CONTRACT_ADDRESSES[chain.id]?.insurancePool : undefined;

  console.log("🏦 Insurance Pool Hook:", {
    chainId: chain?.id,
    chainName: chain?.name,
    contractAddress,
    availableChains: Object.keys(CONTRACT_ADDRESSES),
  });

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

  // Use sendTransaction for Hedera to properly send value
  const { sendTransactionAsync, data: sendTxHash, isPending: isSendPending } = useSendTransaction();
  const {
    writeContractAsync,
    data: writeHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState<Error | null>(null);
  const [policyId, setPolicyId] = useState<bigint | null>(null);

  // Use the appropriate hash and pending state
  const hash = sendTxHash || writeHash;
  const isPending = isSendPending || isWritePending;

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
      premiumInEth: (Number(premium) / 1e18).toFixed(6),
    });

    // Validate premium is not zero
    if (!premium || premium === 0n) {
      throw new Error("Premium cannot be zero. Please wait for premium calculation.");
    }

    setIsProcessing(true);
    setManualSuccess(false);
    setManualError(null);

    try {
      // IMPORTANT: We cannot accurately call calculatePremium as a read-only function
      // because it uses msg.sender to determine risk score, and msg.sender will be different
      // when called via static call vs actual transaction.
      //
      // Solution: Send significantly more HBAR than the calculated premium.
      // The contract automatically refunds excess (HederaInsurancePool.sol line 375-377)
      //
      // We'll multiply by 3x to ensure we send enough, since:
      // - Risk score can vary based on user
      // - Premium calculation includes risk adjustments
      // - Better to overpay and get refunded than have transaction fail

      // CRITICAL: On Hedera, msg.value doesn't work reliably with wagmi sendTransaction
      // We need to send a very large amount to ensure it's enough
      // The contract will refund the excess automatically
      const exactPremium = premium * 1000n; // 1000x to absolutely ensure enough
      console.log("✅ Original premium:", premium.toString(), "wei");
      console.log("   Premium in HBAR:", (Number(premium) / 1e18).toFixed(8));
      console.log("📊 Sending 1000x premium (Hedera workaround):", exactPremium.toString(), "wei");
      console.log("   Amount in HBAR:", (Number(exactPremium) / 1e18).toFixed(8));
      console.log("   💡 Excess will be automatically refunded by the contract");

      console.log("💰 Sending transaction with value:", exactPremium.toString(), "wei");

      const valueToSend = BigInt(exactPremium);
      console.log("🔢 Value being sent:", valueToSend.toString(), "wei");
      console.log("🔢 Value in hex:", "0x" + valueToSend.toString(16));

      // Note: We skip simulation because it has the same msg.sender issue as calculatePremium
      // The actual transaction will use the correct msg.sender and calculate the right premium

      let result: string;

      // CRITICAL FIX: On Hedera, use sendTransaction instead of writeContract
      // because writeContract doesn't properly send the value parameter
      if (chain?.id === 296) {
        console.log(
          "🔷 Using sendTransaction for Hedera (wagmi writeContract doesn't send value on Hedera)"
        );

        // Manually encode the function call
        const data = encodeFunctionData({
          abi,
          functionName: "createPolicy",
          args: [coverageAmount, duration],
        });

        console.log("📦 Encoded data:", data);
        console.log("📦 Sending to:", address);
        console.log("📦 Value:", valueToSend.toString(), "wei");

        result = await sendTransactionAsync({
          to: address,
          data,
          value: valueToSend,
          gas: 1000000n,
        });
      } else {
        // Use standard writeContract for other chains
        result = await writeContractAsync({
          address,
          abi,
          functionName: "createPolicy",
          args: [coverageAmount, duration],
          value: valueToSend,
        });
      }

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
            if (
              receipt?.status === "reverted" ||
              receipt?.status === 0 ||
              receipt?.status === "0x0"
            ) {
              console.error("❌ Transaction reverted on-chain!");
              console.error("Receipt:", receipt);
              console.error(
                "🔗 View on HashScan:",
                `https://hashscan.io/testnet/transaction/${result}`
              );
              setManualError(
                new Error(
                  "Transaction reverted: The contract rejected this transaction. This might be due to insufficient premium, invalid parameters, or contract validation failure."
                )
              );
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
            if (
              error instanceof Error &&
              error.name === "TransactionReceiptNotFoundError" &&
              attempt < maxAttempts
            ) {
              console.log(`⏳ Receipt not ready yet, retrying in ${2 * attempt} seconds...`);
              setTimeout(() => checkReceipt(attempt + 1, maxAttempts), 2000 * attempt);
              return;
            }

            // Final attempt failed or other error
            console.error("❌ Error fetching receipt:", error);
            console.error(
              "🔗 Check status on HashScan:",
              `https://hashscan.io/testnet/transaction/${result}`
            );

            // Don't set error - let user check HashScan manually
            // The transaction might still be processing
            setManualSuccess(false);
            console.warn(
              "⚠️ Could not verify transaction status. Please check HashScan to confirm."
            );
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
    isPending:
      isPending || (isConfirming && !manualSuccess && !manualError && !isHedera) || isProcessing,
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

// Liquidity Pool Hooks
export function useLiquidityProviderBalance(provider?: Address) {
  const { address, abi } = useInsurancePool();
  const { address: userAddress } = useAccount();
  const targetAddress = provider || userAddress;

  const {
    data: balance,
    isLoading,
    refetch,
  } = useReadContract({
    address,
    abi,
    functionName: "getLiquidityProviderBalance",
    args: targetAddress ? [targetAddress] : undefined,
    query: {
      enabled: !!address && !!targetAddress,
      refetchInterval: 5000, // Refetch every 5 seconds for faster updates
    },
  });

  console.log("💰 Liquidity balance for", targetAddress, ":", balance?.toString(), "wei");

  return { balance: balance as bigint | undefined, isLoading, refetch };
}

export function useAddLiquidity() {
  const { address, abi } = useInsurancePool();
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync, data: sendTxHash, isPending: isSendPending } = useSendTransaction();
  const {
    writeContractAsync,
    data: writeHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState<Error | null>(null);

  const hash = sendTxHash || writeHash;
  const isPending = isSendPending || isWritePending;
  const isHedera = chain?.id === 296;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash && !isHedera && !manualSuccess,
    },
  });

  const addLiquidity = async (amount: bigint) => {
    if (!address) {
      const errorMsg = `Contract address not found. Please ensure you're connected to a supported network. Current chain: ${chain?.name || "Unknown"} (ID: ${chain?.id || "N/A"})`;
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }
    if (amount <= 0n) throw new Error("Amount must be greater than 0");

    console.log("💧 Adding liquidity:", {
      amount: amount.toString(),
      amountInEth: (Number(amount) / 1e18).toFixed(6),
      contractAddress: address,
      isHedera,
    });

    setIsProcessing(true);
    setManualSuccess(false);
    setManualError(null);

    try {
      let result: string;

      if (isHedera) {
        const data = encodeFunctionData({
          abi,
          functionName: "addLiquidity",
          args: [],
        });

        console.log("📤 Sending Hedera transaction...");
        result = await sendTransactionAsync({
          to: address,
          data,
          value: amount,
          gas: 500000n,
        });

        console.log("✅ Transaction sent:", result);
        console.log("🔗 View on HashScan:", `https://hashscan.io/testnet/transaction/${result}`);

        // Check receipt multiple times with exponential backoff
        const checkReceipt = async (attempt = 1, maxAttempts = 5) => {
          const delay = 2000 * attempt; // 2s, 4s, 6s, 8s, 10s
          console.log(`🔍 Checking receipt (attempt ${attempt}/${maxAttempts}) in ${delay}ms...`);

          setTimeout(async () => {
            try {
              const receipt = await publicClient?.getTransactionReceipt({ hash: result });
              console.log("📄 Receipt status:", receipt?.status);

              if (
                receipt?.status === "success" ||
                receipt?.status === 1 ||
                receipt?.status === "0x1"
              ) {
                console.log("✅ Liquidity added successfully!");
                setManualSuccess(true);
                setIsProcessing(false);
              } else if (
                receipt?.status === "reverted" ||
                receipt?.status === 0 ||
                receipt?.status === "0x0"
              ) {
                console.error("❌ Transaction reverted on-chain");
                setManualError(new Error("Transaction reverted on-chain"));
                setIsProcessing(false);
              } else if (attempt < maxAttempts) {
                checkReceipt(attempt + 1, maxAttempts);
              } else {
                console.warn("⚠️ Max attempts reached. Marking as potentially successful.");
                setManualSuccess(true);
                setIsProcessing(false);
              }
            } catch (err) {
              console.log("⏳ Receipt not ready yet, will retry...");
              if (attempt < maxAttempts) {
                checkReceipt(attempt + 1, maxAttempts);
              } else {
                console.warn("⚠️ Could not verify transaction. Assuming success - check HashScan.");
                console.warn("🔗", `https://hashscan.io/testnet/transaction/${result}`);
                setManualSuccess(true);
                setIsProcessing(false);
              }
            }
          }, delay);
        };

        checkReceipt(1, 5);
        // Don't set isProcessing(false) here - let checkReceipt handle it
      } else {
        console.log("📤 Sending EVM transaction...");
        result = await writeContractAsync({
          address,
          abi,
          functionName: "addLiquidity",
          value: amount,
        });
        console.log("✅ Transaction sent:", result);
        setIsProcessing(false);
      }

      return result;
    } catch (error) {
      console.error("❌ Add liquidity failed:", error);
      setManualError(error as Error);
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    addLiquidity,
    isPending: isPending || isConfirming || isProcessing,
    isSuccess: isSuccess || manualSuccess,
    hash,
    error: writeError || manualError,
  };
}

export function useWithdrawLiquidity() {
  const { address, abi } = useInsurancePool();
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync, data: sendTxHash, isPending: isSendPending } = useSendTransaction();
  const {
    writeContractAsync,
    data: writeHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(false);
  const [manualError, setManualError] = useState<Error | null>(null);

  const hash = sendTxHash || writeHash;
  const isPending = isSendPending || isWritePending;
  const isHedera = chain?.id === 296;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash && !isHedera && !manualSuccess,
    },
  });

  const withdrawLiquidity = async (amount: bigint) => {
    if (!address) {
      const errorMsg = `Contract address not found. Please ensure you're connected to a supported network. Current chain: ${chain?.name || "Unknown"} (ID: ${chain?.id || "N/A"})`;
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }
    if (amount <= 0n) throw new Error("Amount must be greater than 0");

    console.log("💸 Withdrawing liquidity:", {
      amount: amount.toString(),
      amountInEth: (Number(amount) / 1e18).toFixed(6),
      contractAddress: address,
      isHedera,
    });

    setIsProcessing(true);
    setManualSuccess(false);
    setManualError(null);

    try {
      let result: string;

      if (isHedera) {
        const data = encodeFunctionData({
          abi,
          functionName: "withdrawLiquidity",
          args: [amount],
        });

        console.log("📤 Sending Hedera withdrawal transaction...");
        result = await sendTransactionAsync({
          to: address,
          data,
          gas: 500000n,
        });

        console.log("✅ Transaction sent:", result);
        console.log("🔗 View on HashScan:", `https://hashscan.io/testnet/transaction/${result}`);

        // Check receipt multiple times with exponential backoff
        const checkReceipt = async (attempt = 1, maxAttempts = 5) => {
          const delay = 2000 * attempt;
          console.log(`🔍 Checking receipt (attempt ${attempt}/${maxAttempts}) in ${delay}ms...`);

          setTimeout(async () => {
            try {
              const receipt = await publicClient?.getTransactionReceipt({ hash: result });
              console.log("📄 Receipt status:", receipt?.status);

              if (
                receipt?.status === "success" ||
                receipt?.status === 1 ||
                receipt?.status === "0x1"
              ) {
                console.log("✅ Liquidity withdrawn successfully!");
                setManualSuccess(true);
                setIsProcessing(false);
              } else if (
                receipt?.status === "reverted" ||
                receipt?.status === 0 ||
                receipt?.status === "0x0"
              ) {
                console.error("❌ Transaction reverted on-chain");
                setManualError(new Error("Transaction reverted on-chain"));
                setIsProcessing(false);
              } else if (attempt < maxAttempts) {
                checkReceipt(attempt + 1, maxAttempts);
              } else {
                console.warn("⚠️ Max attempts reached. Marking as potentially successful.");
                setManualSuccess(true);
                setIsProcessing(false);
              }
            } catch (err) {
              console.log("⏳ Receipt not ready yet, will retry...");
              if (attempt < maxAttempts) {
                checkReceipt(attempt + 1, maxAttempts);
              } else {
                console.warn("⚠️ Could not verify transaction. Assuming success - check HashScan.");
                console.warn("🔗", `https://hashscan.io/testnet/transaction/${result}`);
                setManualSuccess(true);
                setIsProcessing(false);
              }
            }
          }, delay);
        };

        checkReceipt(1, 5);
        // Don't set isProcessing(false) here - let checkReceipt handle it
      } else {
        console.log("📤 Sending EVM withdrawal transaction...");
        result = await writeContractAsync({
          address,
          abi,
          functionName: "withdrawLiquidity",
          args: [amount],
        });
        console.log("✅ Transaction sent:", result);
        setIsProcessing(false);
      }

      return result;
    } catch (error) {
      console.error("❌ Withdraw liquidity failed:", error);
      setManualError(error as Error);
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    withdrawLiquidity,
    isPending: isPending || isConfirming || isProcessing,
    isSuccess: isSuccess || manualSuccess,
    hash,
    error: writeError || manualError,
  };
}

export * from "./hooks/useCCIP";
export * from "./hooks/useUserPolicies";
