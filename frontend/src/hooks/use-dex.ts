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
import type { Abi } from "viem";

// ================================================================
// Types
// ================================================================

/** Supported token symbols for swaps */
export type SwapTokenSymbol = "mETH" | "mBTC" | "mUSDC";

export interface DexInfo {
  /** ETH swap rate: mUSDC per 1 mETH (scaled by 1e18) */
  ethSwapRate: bigint | undefined;
  /** BTC swap rate: mUSDC per 1 mBTC (scaled by 1e18) */
  btcSwapRate: bigint | undefined;
  /** mETH reserve in the DEX pool */
  ethReserve: bigint | undefined;
  /** mBTC reserve in the DEX pool */
  btcReserve: bigint | undefined;
  /** mUSDC reserve in the DEX pool */
  usdcReserve: bigint | undefined;
  isLoading: boolean;
  isError: boolean;
  isDeployed: boolean;
}

export interface SwapState {
  swap: (args: {
    fromToken: SwapTokenSymbol;
    toToken: SwapTokenSymbol;
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
 * Reads all swap rates and reserves from the MockDEX contract.
 */
export function useDexInfo(): DexInfo {
  const isDeployed =
    CONTRACT_ADDRESSES.dex !==
    "0x0000000000000000000000000000000000000000";

  const queryEnabled = isDeployed;

  const { data, isLoading, isError } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI as Abi,
        functionName: "getEthRate",
      } as const,
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI as Abi,
        functionName: "getBtcRate",
      } as const,
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI as Abi,
        functionName: "ethReserve",
      } as const,
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI as Abi,
        functionName: "btcReserve",
      } as const,
      {
        address: CONTRACT_ADDRESSES.dex,
        abi: DEX_ABI as Abi,
        functionName: "usdcReserve",
      } as const,
    ],
    query: {
      enabled: queryEnabled,
      refetchInterval: 10_000,
    },
  });

  return {
    ethSwapRate: data?.[0]?.result as bigint | undefined,
    btcSwapRate: data?.[1]?.result as bigint | undefined,
    ethReserve: data?.[2]?.result as bigint | undefined,
    btcReserve: data?.[3]?.result as bigint | undefined,
    usdcReserve: data?.[4]?.result as bigint | undefined,
    isLoading,
    isError,
    isDeployed,
  };
}

// ================================================================
// useSwap — execute swap transactions
// ================================================================

/**
 * Hook that provides swap execution (all pairs) + tx state.
 * Supported pairs:
 *   - mETH ↔ mUSDC (swapETHForUSDC / swapUSDCForETH)
 *   - mBTC ↔ mUSDC (swapBTCForUSDC / swapUSDCForBTC)
 */
export function useSwap(): SwapState {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const swap = useCallback(
    (args: {
      fromToken: SwapTokenSymbol;
      toToken: SwapTokenSymbol;
      amountIn: bigint;
      minOut: bigint;
    }) => {
      const { fromToken, toToken, amountIn, minOut } = args;

      // mETH → mUSDC
      if (fromToken === "mETH" && toToken === "mUSDC") {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapETHForUSDC",
          args: [amountIn, minOut],
        });
      }
      // mBTC → mUSDC
      else if (fromToken === "mBTC" && toToken === "mUSDC") {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapBTCForUSDC",
          args: [amountIn, minOut],
        });
      }
      // mUSDC → mETH
      else if (fromToken === "mUSDC" && toToken === "mETH") {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapUSDCForETH",
          args: [amountIn, minOut],
        });
      }
      // mUSDC → mBTC
      else if (fromToken === "mUSDC" && toToken === "mBTC") {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapUSDCForBTC",
          args: [amountIn, minOut],
        });
      }
      // mETH → mBTC (cross-rate via USDC)
      else if (fromToken === "mETH" && toToken === "mBTC") {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapETHForBTC",
          args: [amountIn, minOut],
        });
      }
      // mBTC → mETH (cross-rate via USDC)
      else if (fromToken === "mBTC" && toToken === "mETH") {
        writeContract({
          address: CONTRACT_ADDRESSES.dex,
          abi: DEX_ABI,
          functionName: "swapBTCForETH",
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
 * - Selling an asset (e.g. mETH) for mUSDC: output = (amountIn * rate) / 1e18
 * - Selling mUSDC for an asset: output = (amountIn * 1e18) / rate
 */
export function calculateOutput(
  amountIn: bigint,
  rate: bigint,
  isSellingAsset: boolean,
): bigint {
  if (amountIn === 0n) return 0n;
  if (isSellingAsset) {
    return (amountIn * rate) / 10n ** 18n;
  } else {
    return (amountIn * 10n ** 18n) / rate;
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
 * e.g. 1700 * 10**18 → "1,700"
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
 * Resolves the swap direction and rate for a given pair.
 * Returns { rate, isSellingAsset, fromReserve, toReserve } where:
 *   - isSellingAsset: true if selling mETH/mBTC, false if selling mUSDC
 *   - rate: the appropriate swap rate
 */
export function getSwapInfo(
  fromSymbol: string,
  toSymbol: string,
  ethSwapRate: bigint | undefined,
  btcSwapRate: bigint | undefined,
  ethReserve: bigint | undefined,
  btcReserve: bigint | undefined,
  usdcReserve: bigint | undefined,
): {
  rate: bigint | undefined;
  isSellingAsset: boolean;
  fromReserve: bigint | undefined;
  toReserve: bigint | undefined;
} {
  if (fromSymbol === "mETH" && toSymbol === "mUSDC") {
    return {
      rate: ethSwapRate,
      isSellingAsset: true,
      fromReserve: ethReserve,
      toReserve: usdcReserve,
    };
  }
  if (fromSymbol === "mBTC" && toSymbol === "mUSDC") {
    return {
      rate: btcSwapRate,
      isSellingAsset: true,
      fromReserve: btcReserve,
      toReserve: usdcReserve,
    };
  }
  if (fromSymbol === "mUSDC" && toSymbol === "mETH") {
    return {
      rate: ethSwapRate,
      isSellingAsset: false,
      fromReserve: usdcReserve,
      toReserve: ethReserve,
    };
  }
  if (fromSymbol === "mUSDC" && toSymbol === "mBTC") {
    return {
      rate: btcSwapRate,
      isSellingAsset: false,
      fromReserve: usdcReserve,
      toReserve: btcReserve,
    };
  }
  // mETH → mBTC (cross-rate via USDC)
  if (fromSymbol === "mETH" && toSymbol === "mBTC") {
    const crossRate =
      ethSwapRate && btcSwapRate && btcSwapRate !== 0n
        ? (ethSwapRate * 10n ** 18n) / btcSwapRate
        : undefined;
    return {
      rate: crossRate,
      isSellingAsset: true,
      fromReserve: ethReserve,
      toReserve: btcReserve,
    };
  }
  // mBTC → mETH (cross-rate via USDC)
  if (fromSymbol === "mBTC" && toSymbol === "mETH") {
    const crossRate =
      btcSwapRate && ethSwapRate && ethSwapRate !== 0n
        ? (btcSwapRate * 10n ** 18n) / ethSwapRate
        : undefined;
    return {
      rate: crossRate,
      isSellingAsset: true,
      fromReserve: btcReserve,
      toReserve: ethReserve,
    };
  }
  return {
    rate: undefined,
    isSellingAsset: true,
    fromReserve: undefined,
    toReserve: undefined,
  };
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
