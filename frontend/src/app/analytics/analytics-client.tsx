"use client";

/**
 * AnalyticsClient — Client component that connects to the analytics hook
 * and renders all analytics sections with AnimatedSection wrappers.
 */
import { useAnalytics } from "@/hooks/use-analytics";
import { AnimatedSection } from "@/components/home/animated-section";
import { AnalyticsStatsCards } from "@/components/analytics/stats-cards";
import { TokenStatsTable } from "@/components/analytics/token-stats-table";
import { TradeHistoryTable } from "@/components/analytics/trade-history-table";
import { PortfolioOverview } from "@/components/analytics/portfolio-overview";

export function AnalyticsClient() {
  const {
    market,
    tokens,
    trades,
    portfolio,
    totalPortfolioValue,
    isLoading,
    isConnected,
    isDeployed,
  } = useAnalytics();

  return (
    <div className="space-y-8">
      {/* Overview Stats Cards */}
      <AnimatedSection>
        <AnalyticsStatsCards
          market={market}
          isLoading={isLoading}
          isDeployed={isDeployed}
        />
      </AnimatedSection>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Token Stats + Trade History */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatedSection delay={100}>
            <TokenStatsTable
              tokens={tokens}
              isLoading={isLoading}
              isDeployed={isDeployed}
            />
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <TradeHistoryTable
              trades={trades}
              isLoading={isLoading}
              isDeployed={isDeployed}
            />
          </AnimatedSection>
        </div>

        {/* Right: Portfolio + Info */}
        <div className="space-y-6">
          <AnimatedSection delay={150}>
            <PortfolioOverview
              portfolio={portfolio}
              totalValue={totalPortfolioValue}
              isConnected={isConnected}
              isLoading={isLoading}
              isDeployed={isDeployed}
            />
          </AnimatedSection>

          <AnimatedSection delay={250}>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">About Analytics</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Market metrics combine on-chain DEX reserve data with
                    simulated volume and activity for the demo.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Token prices are derived from the DEX swap rate (1 mETH ={" "}
                    {isDeployed ? "variable" : "1700"} mUSDC).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Trade history shows simulated transactions for
                    demonstration purposes.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Portfolio values update in real-time as you claim tokens
                    or execute swaps.
                  </span>
                </li>
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div>
  );
}
