"use client";

/**
 * AnalyticsStatsCards — Displays key market metrics in a grid of cards.
 *
 * Shows: Total Volume, Total Trades, Active Users, TVL
 * Each card includes a trend indicator and formatted value.
 */
import {
  BarChart3,
  ArrowLeftRight,
  Users,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MarketOverview } from "@/hooks/use-analytics";

interface AnalyticsStatsCardsProps {
  market: MarketOverview;
  isLoading: boolean;
  isDeployed: boolean;
}

/** Configuration for each stat card */
const STAT_CARDS: {
  key: keyof MarketOverview;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
  format: (v: number) => string;
  changeKey?: keyof MarketOverview;
  color: string;
  bgColor: string;
}[] = [
  {
    key: "totalVolume24h",
    label: "24h Volume",
    icon: BarChart3,
    format: (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    changeKey: "volumeChange24h",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    key: "totalTrades24h",
    label: "Total Trades",
    icon: ArrowLeftRight,
    format: (v: number) => v.toLocaleString("en-US"),
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    key: "activeUsers24h",
    label: "Active Users",
    icon: Users,
    format: (v: number) => v.toLocaleString("en-US"),
    changeKey: "usersChange24h",
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
  {
    key: "tvl",
    label: "TVL",
    icon: Landmark,
    format: (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

export function AnalyticsStatsCards({
  market,
  isLoading,
  isDeployed,
}: AnalyticsStatsCardsProps) {
  if (!isDeployed) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          DEX contract not deployed yet. Deploy contracts to see analytics.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse"
          >
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-8 w-32 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = market[card.key];
        const change = card.changeKey
          ? market[card.changeKey]
          : undefined;
        const changeNum = typeof change === "number" ? change : 0;
        const isPositive = changeNum >= 0;

        return (
          <div
            key={card.key}
            className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {card.label}
              </span>
              <div className={cn("p-1.5 rounded-lg", card.bgColor)}>
                <Icon className={cn("h-4 w-4", card.color)} />
              </div>
            </div>
            <div className="text-2xl font-bold tabular-nums tracking-tight">
              {card.format(value)}
            </div>
            {change !== undefined && (
              <div className="mt-1 flex items-center gap-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isPositive ? "text-emerald-500" : "text-red-500",
                  )}
                >
                  {isPositive ? "+" : ""}
                  {changeNum.toFixed(1)}%
                </span>
                <span className="text-[10px] text-muted-foreground">
                  vs yesterday
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
