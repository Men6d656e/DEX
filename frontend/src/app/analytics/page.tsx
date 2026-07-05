import type { Metadata } from "next";
import { AnimatedSection } from "@/components/home/animated-section";
import { AnalyticsStatsCards } from "@/components/analytics/stats-cards";
import { TokenStatsTable } from "@/components/analytics/token-stats-table";
import { TradeHistoryTable } from "@/components/analytics/trade-history-table";
import { PortfolioOverview } from "@/components/analytics/portfolio-overview";
import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Analytics | DEX Dashboard",
  description:
    "Live market analytics, token statistics, trade history, and portfolio overview.",
};

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <AnimatedSection>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Market overview, token statistics, and portfolio tracking for the
            DEX ecosystem.
          </p>
        </div>
      </AnimatedSection>

      {/* Client-rendered analytics content */}
      <AnalyticsClient />
    </div>
  );
}
