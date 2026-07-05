import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DEX Dashboard | Decentralized Learning & Trading",
  description:
    "A full-stack Web3 educational dashboard featuring a mock crypto faucet, simulated token swap, and real-time market tracking charts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {/* Header with navigation will go here (Phase 4) */}
        <main>{children}</main>
        {/* Footer will go here (Phase 4) */}
      </body>
    </html>
  );
}
