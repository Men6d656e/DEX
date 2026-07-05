import type { Metadata } from "next";
import { FaucetClaimCard } from "@/components/faucet/faucet-claim-card";
import { FaucetAnalytics } from "@/components/faucet/faucet-analytics";
import { AnimatedSection } from "@/components/home/animated-section";

export const metadata: Metadata = {
  title: "Faucet | DEX Dashboard",
  description: "Mint mock test tokens (mETH, mBTC) once per day.",
};

export default function FaucetPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <AnimatedSection>
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Faucet</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Claim mock tokens to your wallet once every 24 hours. Select a
              token below to see your balance and claim status.
            </p>
          </div>
        </AnimatedSection>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* Claim Card — spans 2 columns */}
          <div className="md:col-span-2">
            <AnimatedSection delay={100}>
              <FaucetClaimCard />
            </AnimatedSection>
          </div>

          {/* Analytics — spans 1 column */}
          <div className="space-y-6">
            <AnimatedSection delay={200}>
              <FaucetAnalytics tokenIndex={0} />
            </AnimatedSection>
            <AnimatedSection delay={300}>
              <FaucetAnalytics tokenIndex={1} />
            </AnimatedSection>
          </div>
        </div>

        {/* Info Footer */}
        <AnimatedSection delay={400}>
          <div className="mt-12 text-center text-xs text-muted-foreground space-y-1">
            <p>
              Faucet distributes 10 tokens per claim with a 24-hour cooldown
              per token per wallet.
            </p>
            <p>
              Your mETH and mBTC cooldowns are tracked independently.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
