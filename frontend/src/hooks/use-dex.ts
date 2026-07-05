"use client";

/**
 * Hooks for interacting with the MockDEX contract.
 *
 * Provides:
 * - Swap rate + reserve reads
 * - Swap execution (mETH ↔ mUSDC)
 * - Output calculation utilities
 */
import {
  useAccount,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { DEX_ABI } from "@/lib/dex-abi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { useCallback } from "react";

// ================================================================
// Types
// ================================================================

export interface DexInfo {
  /** Swap rate: mUSDC per 1 mETH (scaled by 1e18) */
  swapRate: bigint | undefined;
  /** mETH reserve in the DEX pool */
  ethReserve: bigint | undefined;
  /** mUSDC reserve in the DEX pool */
  usdcReserve: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  isDeployed: boolean;
}

export interface SwapState {
  swap: (args: {
    fromToken: "mETH" | "mUSDC";
    amountIn: bigint;
    minOut: bigint;
  }) => void;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  hash: `0x${string}` | undefined;
}

// ================================================================
// useDexInfo — read swap rate + reserves
// ================================================================

/**
 * Reads the current swap rate and reserves from the MockDEX contract.
 */
export function useDexInfo(): DexInfo {
  const isDeployed =
    CONTRACT_ADDRESSES.dex !==
    "0x0000000000000000000000000000000000000000";

  const { data, isLoading, isError } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI,
        functionName: "swapRate",
      },
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI,
        functionName: "ethReserve",
      },
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI,
        functionName: "usdcReserve",
      },
    ],
    query: {
      enabled: isDeployed,
      refetchInterval: 10_000,
    },
  });

  return {
    swapRate: data?.[0]?.result as bigint | undefined,
    ethReserve: data?.[1]?.result as bigint | undefined,
    usdcReserve: data?.[2]?.result as bigint | undefined,
    isLoading,
    isError,
    isDeployed,
  };
}

// ================================================================
// useSwap — execute swap transactions
// ================================================================

/**
 * Hook that provides swap execution (both directions) + tx state.
 */
export function useSwap(): SwapState {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const swap = useCallback(
    (args: {
      fromToken: "mETH" | "mUSDC";
      amountIn: bigint;
      minOut: bigint;
    }) => {
      const { fromToken, amountIn, minOut } = args;

      if (fromToken === "mETH") {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapETHForUSDC",
          args: [amountIn, minOut],
        });
      } else {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapUSDCForETH",
          args: [amountIn, minOut],
        });
      }
    },
    [writeContract],
  );

  return { swap, isPending, isConfirming, isConfirmed, hash };
}

// ================================================================
// Pure utility functions
// ================================================================

/**
 * Calculates the expected output amount for a swap.
 *
 * - Selling mETH → mUSDC: output = (amountIn * swapRate) / 1e18
 * - Selling mUSDC → mETH: output = (amountIn * 1e18) / swapRate
 */
export function calculateOutput(
  amountIn: bigint,
  swapRate: bigint,
  fromIsETH: boolean,
): bigint {
  if (amountIn === 0n) return 0n;
  if (fromIsETH) {
    return (amountIn * swapRate) / 10n ** 18n;
  } else {
    return (amountIn * 10n ** 18n) / swapRate;
  }
}

/**
 * Applies slippage tolerance to an expected output.
 * slippage is in basis points (e.g., 50 = 0.5%).
 *
 * Returns: output * (10000 - slippageBps) / 10000
 */
export function applySlippage(
  expectedOutput: bigint,
  slippageBps: number,
): bigint {
  if (expectedOutput === 0n) return 0n;
  const basisPoints = 10000n;
  const slippageFactor = BigInt(10000 - slippageBps);
  return (expectedOutput * slippageFactor) / basisPoints;
}

/**
 * Formats a BigInt with 18 decimals to a human-readable string.
 */
export function formatDexBalance(value: bigint): string {
  const divisor = 10n ** 18n;
  const integerPart = value / divisor;
  const remainder = value % divisor;

  // Get first 4 decimal digits
  const decimalPart = remainder.toString().padStart(18, "0").slice(0, 4);
  const trimmedDecimal = decimalPart.replace(/0+$/, "");

  // Format integer with commas
  const formattedInt = integerPart.toLocaleString("en-US");

  if (trimmedDecimal.length === 0) {
    return formattedInt;
  }

  return `${formattedInt}.${trimmedDecimal}`;
}

/**
 * Formats the swap rate into a display string.
 * e.g. 1700 * 10**18 → "1,700.00"
 */
export function formatRate(rate: bigint | undefined): string {
  if (!rate) return "—";
  const formatted = formatDexBalance(rate);
  // Trim to 2 decimal places for rate display
  const parts = formatted.split(".");
  if (parts.length === 2 && parts[1].length > 2) {
    return `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  return formatted;
}

/**
 * Calculates price impact as a percentage string.
 * For a swap of amountIn against the reserve:
 *   impact % = (amountIn / (reserve + amountIn)) * 100
 */
export function calculatePriceImpact(
  amountIn: bigint,
  reserve: bigint,
): number {
  if (amountIn === 0n || reserve === 0n) return 0;
  const total = reserve + amountIn;
  // Calculate percentage scaled by 10000 for precision
  const impactBps = Number((amountIn * 10000n) / total);
  return impactBps / 100; // Convert to percentage
}
