import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Droplet,
  ArrowLeftRight,
  BarChart3,
  ExternalLink,
  Zap,
  Shield,
  Cpu,
} from "lucide-react";
import { StatsCounters } from "@/components/home/stats-counters";
import { AnimatedSection } from "@/components/home/animated-section";

/** Tech stack badges for the About section */
const TECH_STACK = [
  "Foundry",
  "Solidity",
  "OpenZeppelin",
  "Next.js 16",
  "shadcn/ui",
  "TypeScript",
  "Tailwind CSS",
  "Recharts",
  "wagmi",
  "viem",
] as const;

/** Feature cards data */
const FEATURES = [
  {
    title: "Faucet Panel",
    description:
      "Mint mock ETH and BTC tokens once per day. Track your lifetime claims and cooldown timer with full analytics.",
    icon: Droplet,
    gradient: "from-blue-500 to-cyan-500",
    href: "/faucet",
  },
  {
    title: "Swap Panel",
    description:
      "Trade mock tokens with instant execution. Clear rate display, slippage protection, and reserve tracking.",
    icon: ArrowLeftRight,
    gradient: "from-emerald-500 to-teal-500",
    href: "/swap",
  },
  {
    title: "Analytics Hub",
    description:
      "Real-time candlestick charts powered by CoinGecko. Track prices, volume, and 24h market statistics.",
    icon: BarChart3,
    gradient: "from-purple-500 to-pink-500",
    href: "/analytics",
  },
] as const;

/** Why DEX items */
const WHY_ITEMS = [
  {
    title: "Learn by Doing",
    description:
      "Understand DeFi mechanics through hands-on interaction with a fully functional mock exchange.",
    icon: Zap,
  },
  {
    title: "Safe Sandbox",
    description:
      "No real funds at risk. All tokens are simulated, making it the perfect environment for learning.",
    icon: Shield,
  },
  {
    title: "Real Market Data",
    description:
      "Live candlestick charts and analytics powered by CoinGecko's free API give you a real trading feel.",
    icon: Cpu,
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ════════════════════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center px-6 py-28 md:py-40 text-center overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse [animation-delay:0.5s]" />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border border-border text-sm text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Educational Web3 Dashboard
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Decentralized{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Learning
            </span>{" "}
            <span className="text-muted-foreground/30">&amp;</span>{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Trading
            </span>{" "}
            Dashboard
          </h1>

          {/* Description */}
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A full-stack Web3 educational platform. Mint mock tokens, trade them
            in a simulated DEX, and track real market data &mdash; all in one
            place. No real funds required.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="relative group">
              <Link href="/faucet">
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center">
                  Try the Faucet
                  <Droplet className="ml-2 h-4 w-4" />
                </span>
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/swap">
                Start Swapping
                <ArrowLeftRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          STATS COUNTERS
          ════════════════════════════════════════════════════════ */}
      <AnimatedSection>
        <StatsCounters />
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════
          FEATURES SECTION
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Key Features
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Everything you need to learn about decentralized finance in a
                safe, simulated environment.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <AnimatedSection key={feature.title} delay={index * 150}>
                <Link href={feature.href}>
                  <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 border-border/50 hover:border-primary/30 cursor-pointer">
                    {/* Hover gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                    />
                    <CardHeader>
                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-4 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <div className="w-full h-full rounded-[10px] bg-card flex items-center justify-center">
                          <feature.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-foreground group-hover:to-foreground/70 transition-all">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY DEX SECTION
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-gradient-to-b from-secondary/5 to-background">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Use This Dashboard?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Built for developers who want to understand DeFi without the
                complexity of real financial risk.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {WHY_ITEMS.map((item, index) => (
              <AnimatedSection key={item.title} delay={index * 150}>
                <div className="flex flex-col items-center text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          ABOUT SECTION
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                About This Project
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
                The DEX Dashboard is an educational Web3 application designed to
                help developers understand decentralized finance mechanics. Built
                with Foundry + OpenZeppelin for smart contracts and Next.js +
                shadcn/ui for the frontend, it simulates a complete DeFi
                experience &mdash; from token faucets to swaps and market
                analytics.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-2">
                {TECH_STACK.map((tech) => (
                  <Badge
                    key={tech}
                    variant="secondary"
                    className="text-sm px-3 py-1.5 hover:bg-secondary/80 transition-colors"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA SECTION
          ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <AnimatedSection>
          <div className="relative max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
              Connect your wallet, grab some mock tokens, and start exploring
              the world of DeFi.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/faucet">
                  Launch Dashboard
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read the Docs
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
