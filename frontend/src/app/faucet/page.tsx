import type { Metadata } from "next";
import { FaucetClaimCard } from "@/components/faucet/faucet-claim-card";
import { FaucetAnalytics } from "@/components/faucet/faucet-analytics";
import { AnimatedSection } from "@/components/home/animated-section";

export const metadata: Metadata = {
  title: "Faucet | DEX Dashboard",
  description: "Claim mock tokens (mETH, mBTC, mUSDC) once per day.",
};

export default function FaucetPage() {
  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto space-y-6">
      {/* Simple Page Header */}
      <AnimatedSection>
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight">Faucet</h1>
          <p className="text-sm text-muted-foreground">
            Claim 10 mock tokens per day per wallet.
          </p>
        </div>
      </AnimatedSection>

      {/* Token Stats Row — styled like analytics stats cards */}
      <AnimatedSection delay={100}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FaucetAnalytics tokenIndex={0} />
          <FaucetAnalytics tokenIndex={1} />
          <FaucetAnalytics tokenIndex={2} />
        </div>
      </AnimatedSection>

      {/* Claim Card — full width */}
      <AnimatedSection delay={200}>
        <FaucetClaimCard />
      </AnimatedSection>
    </div>
  );
}
