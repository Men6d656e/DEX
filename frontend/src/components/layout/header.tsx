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
"use client";

/**
 * Header component for the DEX Dashboard.
 *
 * Contains:
 * - Brand logo and name
 * - Navigation tabs (Home, Faucet, Swap, Analytics)
 * - Wallet connect/disconnect button
 * - Mobile hamburger menu with sheet for small screens
 * - Documentation link
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md"
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
        {/* ── Brand / Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg shrink-0"
          aria-label="DEX Dashboard Home"
        >
          <span className="text-blue-500">DEX</span>
          <span className="text-muted-foreground hidden sm:inline">Dashboard</span>
        </Link>

        {/* ── Desktop Navigation ── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
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
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Docs link — opens GitHub Pages docs */}
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex" aria-label="View documentation">
            <a href="https://men6d656e.github.io/DEX/" target="_blank" rel="noopener noreferrer">
              Docs
            </a>
          </Button>

          {/* Wallet button */}
          <WalletButton />

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Mobile Navigation ── */}
      {mobileMenuOpen && (
        <nav
          className="md:hidden border-t border-border bg-background/95 backdrop-blur-md"
          aria-label="Mobile navigation"
        >
          <div className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}


          </div>
        </nav>
      )}
    </header>
  );
}
