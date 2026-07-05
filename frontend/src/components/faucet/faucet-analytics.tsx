"use client";

/**
 * FaucetAnalytics — Displays detailed analytics about faucet usage.
 *
 * Shows:
 * - Lifetime tokens claimed
 * - Last claim timestamp
 * - Cooldown remaining
 * - Claim status
 */
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Droplet, History, Timer } from "lucide-react";
import { useClaimInfo, formatTimestamp, formatCountdown } from "@/hooks/use-faucet";

interface FaucetAnalyticsProps {
  tokenIndex: number;
}

export function FaucetAnalytics({ tokenIndex }: FaucetAnalyticsProps) {
  const { isConnected } = useAccount();
  const { claimInfo, isLoading } = useClaimInfo(tokenIndex);

  const tokenName = tokenIndex === 0 ? "mETH" : "mBTC";

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-4 w-4" />
            Analytics
          </CardTitle>
          <CardDescription>
            Connect your wallet to see faucet analytics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const statItems = [
    {
      label: "Lifetime Claimed",
      value: claimInfo.totalClaimed > 0n
        ? `${claimInfo.totalClaimed.toString()} ${tokenName}`
        : "0 tokens",
      icon: Droplet,
      color: tokenIndex === 0 ? "text-blue-500" : "text-orange-500",
    },
    {
      label: "Last Claim",
      value: formatTimestamp(claimInfo.lastClaimTime),
      icon: Clock,
      color: "text-muted-foreground",
    },
    {
      label: "Cooldown Remaining",
      value: claimInfo.canClaim
        ? "None — Ready to claim!"
        : formatCountdown(claimInfo.timeRemaining),
      icon: Timer,
      color: claimInfo.canClaim ? "text-emerald-500" : "text-amber-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-4 w-4" />
            Analytics
          </CardTitle>
          <CardDescription>
            Your faucet usage for {tokenName}
          </CardDescription>
        </div>
        <Badge
          variant={claimInfo.canClaim ? "default" : "secondary"}
          className={claimInfo.canClaim ? "bg-emerald-600" : ""}
        >
          {claimInfo.canClaim ? "Claim Ready" : "On Cooldown"}
        </Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {statItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/20"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  {item.label}
                </div>
                <span className="text-sm font-medium tabular-nums text-right max-w-[60%]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
