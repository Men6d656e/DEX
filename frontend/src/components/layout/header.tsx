"use client";

/**
 * Header component for the DEX Dashboard.
 *
 * Contains:
 * - Brand logo and name
 * - Navigation tabs (Home, Faucet, Swap, Analytics)
 * - Wallet connect/disconnect button
 * - Documentation link
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WalletButton } from "@/components/layout/wallet-button";
import { cn } from "@/lib/utils";

/** Navigation link items */
const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/faucet", label: "Faucet" },
  { href: "/swap", label: "Swap" },
  { href: "/analytics", label: "Analytics" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
        {/* ── Brand / Logo ── */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="text-blue-500">DEX</span>
          <span className="text-muted-foreground">Dashboard</span>
        </Link>

        {/* ── Navigation ── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-2">
          {/* Docs link */}
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <a href="/docs" target="_blank" rel="noopener noreferrer">
              Docs
            </a>
          </Button>

          {/* Wallet button */}
          <WalletButton />
        </div>
      </div>

      {/* ── Mobile Nav ── */}
      <div className="md:hidden flex overflow-x-auto border-t border-border px-4 py-2 gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
