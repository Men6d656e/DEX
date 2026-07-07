"use client";

/**
 * FaucetAnalytics — Token analytics card matching the AnalyticsStatsCards style.
 *
 * Shows:
 * - Token icon with colored background
 * - Lifetime claimed (formatted)
 * - Last claim (relative time)
 * - Live countdown timer
 */
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { useClaimInfo, formatRelativeTime, formatCountdown, formatClaimedAmount } from "@/hooks/use-faucet";
import { Droplet, Clock, Timer } from "lucide-react";

interface FaucetAnalyticsProps {
  tokenIndex: number;
}

const TOKEN_META = [
  {
    symbol: "mETH",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    iconBg: "bg-blue-500/15",
  },
  {
    symbol: "mBTC",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    iconBg: "bg-orange-500/15",
  },
  {
    symbol: "mUSDC",
    color: "text-blue-600",
    bgColor: "bg-blue-600/10",
    iconBg: "bg-blue-600/15",
  },
];

export function FaucetAnalytics({ tokenIndex }: FaucetAnalyticsProps) {
  const { isConnected } = useAccount();
  const { claimInfo, isLoading } = useClaimInfo(tokenIndex);
  const meta = TOKEN_META[tokenIndex] ?? TOKEN_META[0];

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md duration-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {meta.symbol}
          </span>
          <div className={cn("p-1.5 rounded-lg", meta.iconBg)}>
            <Droplet className={cn("h-4 w-4", meta.color)} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Connect wallet to see stats</p>
      </div>
    );
  }

  const isReady = claimInfo.canClaim;
  const countdownText = isReady
    ? "Available now"
    : formatCountdown(claimInfo.timeRemaining);

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
      {/* Header: Token + Icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {meta.symbol}
        </span>
        <div className={cn("p-1.5 rounded-lg", meta.iconBg)}>
          <Droplet className={cn("h-4 w-4", meta.color)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
          <div className="h-3 w-32 rounded bg-muted animate-pulse" />
          <div className="h-3 w-28 rounded bg-muted animate-pulse" />
        </div>
      ) : (
        <>
          {/* Status + Countdown */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  isReady
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-amber-500/10 text-amber-500",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isReady ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
                {isReady ? "Ready" : "Cooldown"}
              </span>
              <span className="text-lg font-bold tabular-nums tracking-tight">
                {countdownText}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Droplet className="h-3 w-3" />
                Claimed
              </span>
              <span className="font-medium tabular-nums">
                {formatClaimedAmount(claimInfo.totalClaimed, meta.symbol)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last
              </span>
              <span className="font-medium tabular-nums">
                {formatRelativeTime(claimInfo.lastClaimTime)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Cooldown
              </span>
              <span className={cn("font-medium tabular-nums", isReady ? "text-emerald-500" : "text-amber-500")}>
                {countdownText}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
