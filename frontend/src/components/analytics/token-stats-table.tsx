"use client";

/**
 * TokenStatsTable — Displays statistics for each mock token.
 *
 * Columns: Token, Price, 24h Change, 24h Volume, Market Cap, Holders
 * Uses shadcn Table for consistent styling.
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { TokenStat } from "@/hooks/use-analytics";

interface TokenStatsTableProps {
  tokens: TokenStat[];
  isLoading: boolean;
  isDeployed: boolean;
}

export function TokenStatsTable({
  tokens,
  isLoading,
  isDeployed,
}: TokenStatsTableProps) {
  if (!isDeployed) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">Token Statistics</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Token</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
            <TableHead className="text-right">24h Volume</TableHead>
            <TableHead className="text-right">Market Cap</TableHead>
            <TableHead className="text-right">Holders</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => {
            const isPositive = token.priceChange24h >= 0;
            return (
              <TableRow key={token.symbol}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${token.color}20`, color: token.color }}
                    >
                      {token.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{token.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {token.name}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  ${token.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums font-medium",
                      isPositive ? "text-emerald-500" : "text-red-500",
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {token.priceChange24h.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  ${token.volume24h.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  ${token.marketCap.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {token.holders.toLocaleString("en-US")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
