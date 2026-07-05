import type { Metadata } from "next";
import { AnimatedSection } from "@/components/home/animated-section";
import { SwapCard } from "@/components/swap/swap-card";
import { LiquidityInfo } from "@/components/swap/liquidity-info";

export const metadata: Metadata = {
  title: "Swap | DEX Dashboard",
  description:
    "Trade mock tokens (mETH ↔ mUSDC) with instant ratio-based execution and slippage protection.",
};

export default function SwapPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <AnimatedSection>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Swap</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Trade mock tokens with instant ratio-based execution and slippage
            protection.
          </p>
        </div>
      </AnimatedSection>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Card — 2 columns */}
        <div className="lg:col-span-2">
          <AnimatedSection delay={100}>
            <SwapCard />
          </AnimatedSection>
        </div>

        {/* Sidebar — 1 column */}
        <div className="space-y-6">
          <AnimatedSection delay={200}>
            <LiquidityInfo />
          </AnimatedSection>

          {/* Quick Info Card */}
          <AnimatedSection delay={300}>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                About Swaps
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Swaps use a fixed ratio (e.g., 1 mETH = 1700 mUSDC)
                    set by the DEX owner.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    The DEX must have sufficient liquidity in its reserves
                    to execute your swap.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Slippage protection ensures you receive at least your
                    minimum expected amount.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    You need to approve the DEX contract to spend your
                    tokens before swapping.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>
                    Need tokens? Visit the{" "}
                    <a
                      href="/faucet"
                      className="text-blue-500 hover:underline"
                    >
                      Faucet
                    </a>{" "}
                    to claim mETH and mBTC.
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
