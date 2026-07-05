"use client";

/**
 * PortfolioOverview — Displays the connected wallet's token portfolio
 * with balances, prices, and USD values in a compact card.
 *
 * Shows:
 * - Total portfolio value at the top
 * - Individual token rows with icon, balance, price, and value
 * - Donut chart-like visual indicator of allocation
 */
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioAsset } from "@/hooks/use-analytics";

interface PortfolioOverviewProps {
  portfolio: PortfolioAsset[];
  totalValue: number;
  isConnected: boolean;
  isLoading: boolean;
  isDeployed: boolean;
}

export function PortfolioOverview({
  portfolio,
  totalValue,
  isConnected,
  isLoading,
  isDeployed,
}: PortfolioOverviewProps) {
  if (!isDeployed) return null;

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="p-3 rounded-full bg-muted">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-1">Portfolio</h3>
            <p className="text-xs text-muted-foreground">
              Connect your wallet to see your portfolio overview.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
              </div>
              <div className="h-3 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Portfolio</h3>
          <div className="flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Balance
            </span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold tabular-nums tracking-tight">
            ${totalValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>

      {/* Token list */}
      <div className="px-5 py-3 space-y-3">
        {portfolio.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No tokens found in wallet.
          </p>
        ) : (
          portfolio.map((asset) => {
            const allocation =
              totalValue > 0
                ? ((asset.balanceValue / totalValue) * 100).toFixed(1)
                : "0.0";

            return (
              <div
                key={asset.symbol}
                className="flex items-center gap-3 group"
              >
                {/* Token icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: `${asset.color}20`,
                    color: asset.color,
                  }}
                >
                  {asset.icon}
                </div>

                {/* Token info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{asset.symbol}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {asset.balance}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      @ ${asset.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {allocation}%
                    </span>
                  </div>
                </div>

                {/* Value */}
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums">
                    ${asset.balanceValue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Allocation bar */}
      {portfolio.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
            {portfolio.map((asset) => {
              const pct =
                totalValue > 0 ? (asset.balanceValue / totalValue) * 100 : 0;
              if (pct < 0.5) return null;
              return (
                <div
                  key={asset.symbol}
                  style={{
                    width: `${pct}%`,
                    backgroundColor: asset.color,
                  }}
                  title={`${asset.symbol}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {portfolio.map((asset) => {
              const pct =
                totalValue > 0 ? (asset.balanceValue / totalValue) * 100 : 0;
              if (pct < 0.5) return null;
              return (
                <div key={asset.symbol} className="flex items-center gap-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: asset.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {asset.symbol} {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
