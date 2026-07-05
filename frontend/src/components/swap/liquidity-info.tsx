"use client";

/**
 * LiquidityInfo — Panel showing the DEX pool's current reserves and rate.
 *
 * Displays:
 * - mETH and mUSDC reserves in the pool
 * - Current swap rate (1 mETH = X mUSDC and inverse)
 * - Loading skeleton when data is being fetched
 */
import { useDexInfo, formatDexBalance, formatRate } from "@/hooks/use-dex";

export function LiquidityInfo() {
  const { swapRate, ethReserve, usdcReserve, isLoading, isDeployed } =
    useDexInfo();

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <h3 className="text-sm font-semibold text-foreground">Liquidity Pool</h3>

      {!isDeployed ? (
        <div className="py-4 text-center text-xs text-muted-foreground">
          DEX contract not deployed yet.
          <br />
          Run <code className="text-blue-500">make deploy-anvil</code> to
          deploy.
        </div>
      ) : isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-4 w-36 rounded bg-muted" />
          <div className="pt-2 space-y-2">
            <div className="h-3 w-40 rounded bg-muted" />
            <div className="h-3 w-44 rounded bg-muted" />
          </div>
        </div>
      ) : (
        <>
          {/* Reserves */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                mETH Reserve
              </span>
              <span className="text-xs font-medium tabular-nums">
                {ethReserve !== undefined
                  ? `${formatDexBalance(ethReserve)} mETH`
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                mUSDC Reserve
              </span>
              <span className="text-xs font-medium tabular-nums">
                {usdcReserve !== undefined
                  ? `${formatDexBalance(usdcReserve)} mUSDC`
                  : "—"}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                1 mETH ={" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatRate(swapRate)}
                </span>{" "}
                mUSDC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                1 mUSDC ={" "}
                <span className="font-medium text-foreground tabular-nums">
                  {swapRate && swapRate > 0n
                    ? (1 / Number(formatRate(swapRate).replace(/,/g, "")))
                        .toFixed(6)
                    : "—"}
                </span>{" "}
                mETH
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
