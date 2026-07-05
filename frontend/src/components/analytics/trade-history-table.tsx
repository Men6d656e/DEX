"use client";

/**
 * TradeHistoryTable — Displays recent trade history with timestamps,
 * pair, amount, price, and total value.
 *
 * Uses shadcn Table with compact styling for dense data display.
 */
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TradeRecord } from "@/hooks/use-analytics";

interface TradeHistoryTableProps {
  trades: TradeRecord[];
  isLoading: boolean;
  isDeployed: boolean;
}

/**
 * Formats a date to a relative time string (e.g. "2m ago", "1h ago").
 */
function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function TradeHistoryTable({
  trades,
  isLoading,
  isDeployed,
}: TradeHistoryTableProps) {
  if (!isDeployed) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
        <div className="h-5 w-36 rounded bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 rounded bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent Trades</h3>
        <Badge variant="outline" className="text-[10px] font-normal">
          {trades.length} trades (24h)
        </Badge>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Pair</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => {
              const isBuy = trade.type === "Buy";

              return (
                <TableRow key={trade.id} className="group">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatRelativeTime(trade.timestamp)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0",
                        isBuy
                          ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
                          : "border-red-500/30 text-red-500 bg-red-500/5",
                      )}
                    >
                      {trade.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {trade.pair}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {trade.amount.toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                    })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    ${trade.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    ${trade.total.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {trade.user}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
