"use client";

/**
 * Hook for reading mock token balances from deployed contracts.
 *
 * Uses wagmi's useReadContract to call balanceOf on each ERC20 token.
 * Returns a map of token symbol -> formatted balance.
 */
import { useReadContracts } from "wagmi";
import { type Abi } from "viem";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

/**
 * Minimal ERC20 ABI - only the functions we need:
 * - balanceOf(address)(uint256)
 * - decimals()(uint8)
 */
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8", internalType: "uint8" }],
    stateMutability: "view",
  },
] as const satisfies Abi;

/** Token config for balance queries */
const TOKENS_TO_READ = [
  { symbol: "mETH", address: CONTRACT_ADDRESSES.mETH },
  { symbol: "mBTC", address: CONTRACT_ADDRESSES.mBTC },
  { symbol: "mUSDC", address: CONTRACT_ADDRESSES.mUSDC },
] as const;

/** Return type for token balances */
export interface TokenBalance {
  symbol: string;
  /** Raw BigInt balance (18 decimals) */
  value: bigint;
  /** Formatted string (e.g. "10.5") */
  formatted: string;
}

/**
 * Reads mock token balances for the connected wallet.
 *
 * @returns Object with:
 *   - balances: TokenBalance[] for each mock token
 *   - isLoading: true while data is being fetched
 *   - isError: true if any read failed
 */
export function useTokenBalances() {
  const { address, isConnected } = useAccount();

  const contracts = TOKENS_TO_READ.map((token) => ({
    address: token.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address ?? "0x0"],
  }));

  const result = useReadContracts({
    contracts,
    query: {
      enabled: isConnected && !!address && contracts.some((c) => c.address !== "0x0000000000000000000000000000000000000000"),
      refetchInterval: 10_000, // Poll every 10s for balance updates
    },
  });

  if (!isConnected || !address) {
    return { balances: [], isLoading: false, isError: false };
  }

  const balances: TokenBalance[] = [];
  let hasError = false;

  for (let i = 0; i < TOKENS_TO_READ.length; i++) {
    const data = result.data?.[i];
    if (data?.error) {
      hasError = true;
      continue;
    }
    const value = data?.result as bigint | undefined;
    if (value !== undefined) {
      // Format with 4 decimal places
      const formatted = formatTokenBalance(value);
      balances.push({
        symbol: TOKENS_TO_READ[i].symbol,
        value,
        formatted,
      });
    }
  }

  return {
    balances,
    isLoading: result.isLoading,
    isError: hasError || result.isError,
  };
}

/**
 * Formats a BigInt token balance with 18 decimals to a readable string.
 * Example: 10500000000000000000n -> "10.5000"
 */
function formatTokenBalance(value: bigint): string {
  const divisor = 10n ** 18n;
  const integerPart = value / divisor;
  const remainder = value % divisor;

  // Get first 4 decimal digits
  const decimalPart = remainder.toString().padStart(18, "0").slice(0, 4);

  // Trim trailing zeros
  const trimmedDecimal = decimalPart.replace(/0+$/, "");

  if (trimmedDecimal.length === 0) {
    return integerPart.toString();
  }

  return `${integerPart.toString()}.${trimmedDecimal}`;
}
