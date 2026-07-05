"use client";

/**
 * Hook for interacting with the Faucet contract.
 *
 * Provides:
 * - Claim info lookup (canClaim, timeRemaining, totalClaimed, lastClaimTime)
 * - Token address lookup
 * - Claim token write action
 * - Real-time cooldown countdown
 */
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { FAUCET_ABI } from "@/lib/faucet-abi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { useEffect, useState } from "react";

/** Token indices in the Faucet contract */
export const FAUCET_METH_INDEX = 0;
export const FAUCET_MBTC_INDEX = 1;

/** Return type for claim info */
export interface ClaimInfo {
  canClaim: boolean;
  timeRemaining: number; // seconds
  totalClaimed: bigint;
  lastClaimTime: number; // unix timestamp
}

/** Default claim info when not connected or query disabled */
const EMPTY_CLAIM_INFO: ClaimInfo = {
  canClaim: false,
  timeRemaining: 0,
  totalClaimed: 0n,
  lastClaimTime: 0,
};

/**
 * Hook that reads claim info for a connected user + token index,
 * and provides a live countdown for timeRemaining.
 */
export function useClaimInfo(tokenIndex: number) {
  const { address, isConnected } = useAccount();
  const isDeployed = CONTRACT_ADDRESSES.faucet !== "0x0000000000000000000000000000000000000000";

  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.faucet,
    abi: FAUCET_ABI,
    functionName: "getClaimInfo",
    args: [address ?? "0x0", BigInt(tokenIndex)],
    query: {
      enabled: isConnected && !!address && isDeployed,
      refetchInterval: 5_000, // Poll every 5s for updates
    },
  });

  // Live countdown for timeRemaining
  const [liveTimeRemaining, setLiveTimeRemaining] = useState(0);

  useEffect(() => {
    if (!data || !data[0]) {
      // data[0] = canClaim; if canClaim is true, timeRemaining should be 0
      setLiveTimeRemaining(0);
      return;
    }

    const contractTimeRemaining = Number(data[1]);
    setLiveTimeRemaining(contractTimeRemaining);

    if (contractTimeRemaining <= 0) return;

    // Tick every second when cooldown is active
    const interval = setInterval(() => {
      setLiveTimeRemaining((prev) => {
        if (prev <= 1) {
          refetch(); // Refetch when countdown reaches 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data, refetch]);

  if (!isConnected || !address || !isDeployed) {
    return { claimInfo: EMPTY_CLAIM_INFO, isLoading: false, isError: false, refetch };
  }

  const claimInfo: ClaimInfo = {
    canClaim: data ? data[0] : false,
    timeRemaining: liveTimeRemaining,
    totalClaimed: data ? data[2] : 0n,
    lastClaimTime: data ? Number(data[3]) : 0,
  };

  return { claimInfo, isLoading, isError, refetch };
}

/**
 * Hook that provides a write action to claim tokens.
 *
 * @returns { claimTokens, isConfirming, isConfirmed, txHash }
 */
export function useClaimTokens() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const [tokenIndex, setTokenIndex] = useState<number>(0);

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const claimTokens = (index: number) => {
    setTokenIndex(index);
    writeContract({
      address: CONTRACT_ADDRESSES.faucet,
      abi: FAUCET_ABI,
      functionName: "claimToken",
      args: [BigInt(index)],
    });
  };

  return {
    claimTokens,
    isPending,
    isConfirming,
    isConfirmed,
    txHash: hash,
    tokenIndex,
  };
}

/**
 * Reads the token address from the Faucet contract by index.
 */
export function useTokenAddress(tokenIndex: number) {
  const isDeployed = CONTRACT_ADDRESSES.faucet !== "0x0000000000000000000000000000000000000000";

  const { data } = useReadContract({
    address: CONTRACT_ADDRESSES.faucet,
    abi: FAUCET_ABI,
    functionName: "getTokenAddress",
    args: [BigInt(tokenIndex)],
    query: {
      enabled: isDeployed,
    },
  });

  return data as `0x${string}` | undefined;
}

/**
 * Formats a unix timestamp as a relative time string.
 */
export function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return "Never";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}

/**
 * Formats seconds into a human-readable countdown.
 * e.g. 3661 -> "1h 1m 1s"
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Available now";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}
