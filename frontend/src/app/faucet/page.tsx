import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Faucet | DEX Dashboard",
  description: "Mint mock test tokens (mETH, mBTC) once per day.",
};

export default function FaucetPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-4">Faucet</h1>
        <p className="text-muted-foreground mb-8">
          Mint mock tokens to your wallet. Coming soon in Phase 7.
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
