import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero Section ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center bg-gradient-to-b from-background to-secondary/20">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-3xl">
          Decentralized{" "}
          <span className="text-blue-500">Learning</span> &{" "}
          <span className="text-emerald-500">Trading</span> Dashboard
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          A full-stack Web3 educational platform. Mint mock tokens, trade them
          in a simulated DEX, and track real market data — all in one place.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/faucet"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
          >
            Try the Faucet
          </Link>
          <Link
            href="/swap"
            className="inline-flex items-center px-6 py-3 rounded-lg border border-border font-medium hover:bg-secondary transition-colors"
          >
            Start Swapping
          </Link>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Faucet Card */}
            <div className="rounded-xl border border-border p-6 bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Faucet Panel</h3>
              <p className="text-muted-foreground">
                Mint mock ETH and BTC tokens once per day. Track your lifetime claims and cooldown timer.
              </p>
            </div>

            {/* Swap Card */}
            <div className="rounded-xl border border-border p-6 bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Swap Panel</h3>
              <p className="text-muted-foreground">
                Trade mock tokens with instant execution. Clear rate display and slippage protection.
              </p>
            </div>

            {/* Analytics Card */}
            <div className="rounded-xl border border-border p-6 bg-card hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics Hub</h3>
              <p className="text-muted-foreground">
                Real-time candlestick charts powered by CoinGecko. Track prices, volume, and 24h stats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── About Section ── */}
      <section className="py-20 px-6 bg-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">About This Project</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The DEX Dashboard is an educational Web3 application designed to help developers
            understand decentralized finance mechanics. Built with Foundry + OpenZeppelin for
            smart contracts and Next.js + shadcn/ui for the frontend, it simulates a complete
            DeFi experience — from token faucets to swaps and market analytics.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">Foundry</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">Solidity</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">OpenZeppelin</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">Next.js 16</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">shadcn/ui</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">TypeScript</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">Tailwind CSS</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">Recharts</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">wagmi</span>
            <span className="px-3 py-1.5 rounded-full bg-secondary text-sm font-medium">viem</span>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Connect your wallet, grab some mock tokens, and start exploring the world of DeFi.
          </p>
          <Link
            href="/faucet"
            className="inline-flex items-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-lg hover:opacity-90 transition-opacity"
          >
            Launch Dashboard
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            DEX Dashboard — MIT License
          </p>
          <div className="flex gap-6">
            <a
              href="/docs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              📖 Documentation
            </a>
            <a
              href="https://github.com/Men6d656e/DEX"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
