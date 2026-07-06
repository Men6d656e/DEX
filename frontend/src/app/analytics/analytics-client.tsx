"use client";

/**
 * AnalyticsClient — Client component that connects to the analytics hook
 * and renders all analytics sections with AnimatedSection wrappers.
 *
 * Combines:
 * - Real CoinGecko market data with candlestick charts
 * - Simulated mock token statistics
 * - Trade history
 * - Portfolio overview
 */
import { useAnalytics } from "@/hooks/use-analytics";
import { AnimatedSection } from "@/components/home/animated-section";
import { AnalyticsStatsCards } from "@/components/analytics/stats-cards";
import { TokenStatsTable } from "@/components/analytics/token-stats-table";
import { TradeHistoryTable } from "@/components/analytics/trade-history-table";
import { PortfolioOverview } from "@/components/analytics/portfolio-overview";
import { MarketDataPanel } from "@/components/charts/market-stats";

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

      {/* CoinGecko Market Data — Full width */}
      <AnimatedSection delay={100}>
        <MarketDataPanel />
      </AnimatedSection>

      {/* Bottom Grid: Token Stats + Trade History + Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Token Stats + Trade History */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatedSection delay={150}>
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
          <AnimatedSection delay={200}>
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
                    Market data powered by{" "}
                    <a
                      href="https://www.coingecko.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      CoinGecko
                    </a>
                    . Candlestick charts show real BTC, ETH, and USDC prices.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Token statistics combine on-chain DEX reserve data with
                    simulated volume and activity for the demo tokens.
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
