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
} from "lucide-react";

/** Tech stack badges displayed in the About section */
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
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    href: "/faucet",
  },
  {
    title: "Swap Panel",
    description:
      "Trade mock tokens with instant execution. Clear rate display, slippage protection, and reserve tracking.",
    icon: ArrowLeftRight,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    href: "/swap",
  },
  {
    title: "Analytics Hub",
    description:
      "Real-time candlestick charts powered by CoinGecko. Track prices, volume, and 24h market statistics.",
    icon: BarChart3,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    href: "/analytics",
  },
] as const;

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ── Hero Section ── */}
      <section className="flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center bg-gradient-to-b from-background to-secondary/20">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight max-w-3xl">
          Decentralized{" "}
          <span className="text-blue-500">Learning</span>
          {" "}&amp;{" "}
          <span className="text-emerald-500">Trading</span> Dashboard
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl">
          A full-stack Web3 educational platform. Mint mock tokens, trade them
          in a simulated DEX, and track real market data &mdash; all in one
          place.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/faucet">
              Try the Faucet
              <Droplet className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/swap">
              Start Swapping
              <ArrowLeftRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Key Features</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Everything you need to learn about decentralized finance in a safe,
            simulated environment.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 group cursor-pointer">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}
                    >
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section className="py-20 px-6 bg-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About This Project</h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
            The DEX Dashboard is an educational Web3 application designed to
            help developers understand decentralized finance mechanics. Built
            with Foundry + OpenZeppelin for smart contracts and Next.js +
            shadcn/ui for the frontend, it simulates a complete DeFi experience
            &mdash; from token faucets to swaps and market analytics.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {TECH_STACK.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-sm px-3 py-1">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Connect your wallet, grab some mock tokens, and start exploring the
            world of DeFi.
          </p>
          <Button size="lg" asChild>
            <Link href="/faucet">
              Launch Dashboard
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
