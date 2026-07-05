import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Swap | DEX Dashboard",
  description: "Trade mock tokens with instant ratio-based execution.",
};

export default function SwapPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Swap</h1>
        <p className="text-muted-foreground mb-8">
          Trade mock tokens (mETH ↔ mUSDC). Coming soon in Phase 8.
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
