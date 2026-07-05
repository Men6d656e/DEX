import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Analytics | DEX Dashboard",
  description: "Live market charts and analytics powered by CoinGecko.",
};

export default function AnalyticsPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Analytics</h1>
        <p className="text-muted-foreground mb-8">
          Real-time market charts and statistics. Coming soon in Phase 9.
        </p>
        <Link
          href="/"
          className="text-sm text-blue-500 hover:underline"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
