import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | DEX Dashboard",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="max-w-md">
        {/* Large 404 */}
        <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
          404
        </h1>

        <h2 className="mt-6 text-2xl font-semibold">Page Not Found</h2>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try navigating to one of our main sections below.
        </p>

        {/* Navigation links */}
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Home
          </Link>
          <Link
            href="/faucet"
            className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Faucet
          </Link>
          <Link
            href="/swap"
            className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Swap
          </Link>
          <Link
            href="/analytics"
            className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
