"use client";

/**
 * MarketStats — Displays 24h market statistics for a selected coin.
 *
 * Shows: Current Price, 24h Change, 24h High, 24h Low, Volume, Market Cap
 * Includes coin selector tabs and time range selector.
 */
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketData, CHART_COINS, DAY_RANGES, type ChartCoinId, type DayRange } from "@/hooks/use-market-data";
import { CandlestickChart } from "@/components/charts/candlestick-chart";
import type { MarketStats as MarketStatsType } from "@/lib/market-data";

interface StatItem {
  label: string;
  value: string;
  color?: string;
}

function StatRow({ label, value, color }: StatItem) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium tabular-nums", color)}>
        {value}
      </span>
    </div>
  );
}

/**
 * Formats a number as USD with appropriate precision.
 */
function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function MarketDataPanel() {
  const [selectedCoin, setSelectedCoin] = useState<ChartCoinId>("ethereum");
  const [days, setDays] = useState<DayRange>(7);

  const { candles, stats, isLoading, isSimulated } = useMarketData(
    selectedCoin,
    days,
  );

  const coinLabel = CHART_COINS.find(c => c.id === selectedCoin)?.label ?? selectedCoin;

  return (
    <div className="space-y-6">
      {/* Coin & Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Coin selector */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {CHART_COINS.map((coin) => (
            <button
              key={coin.id}
              onClick={() => setSelectedCoin(coin.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                selectedCoin === coin.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              style={selectedCoin === coin.id ? { color: coin.color } : undefined}
            >
              {coin.label.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Day range selector */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {DAY_RANGES.map((range) => (
            <button
              key={range}
              onClick={() => setDays(range)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                days === range
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Current Price */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Price
            </p>
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-bold tabular-nums">
                ${stats.currentPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {stats.priceChangePercent24h !== 0 && (
                <span
                  className={cn(
                    "flex items-center text-xs font-medium",
                    stats.priceChangePercent24h > 0
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {stats.priceChangePercent24h > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {Math.abs(stats.priceChangePercent24h).toFixed(2)}%
                </span>
              )}
            </div>
          </div>

          {/* 24h High */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              24h High
            </p>
            <p className="text-lg font-bold tabular-nums text-emerald-500">
              ${stats.high24h.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* 24h Low */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              24h Low
            </p>
            <p className="text-lg font-bold tabular-nums text-red-500">
              ${stats.low24h.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* 24h Volume */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              24h Volume
            </p>
            <p className="text-lg font-bold tabular-nums">
              {formatUSD(stats.volume24h)}
            </p>
          </div>

          {/* Market Cap */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Market Cap
            </p>
            <p className="text-lg font-bold tabular-nums">
              {formatUSD(stats.marketCap)}
            </p>
          </div>

          {/* 24h Change */}
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              24h Change
            </p>
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                stats.priceChange24h >= 0 ? "text-emerald-500" : "text-red-500",
              )}
            >
              {stats.priceChange24h >= 0 ? "+" : ""}$
              {stats.priceChange24h.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Candlestick Chart */}
      <CandlestickChart
        data={candles}
        coinLabel={coinLabel}
        isLoading={isLoading}
        isSimulated={isSimulated}
      />
    </div>
  );
}
