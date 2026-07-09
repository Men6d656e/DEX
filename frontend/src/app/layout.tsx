import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";

const spaceGroteskHeading = Space_Grotesk({subsets:['latin'],variable:'--font-heading'});

const ibmPlexSans = IBM_Plex_Sans({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("dark", "font-sans", ibmPlexSans.variable, spaceGroteskHeading.variable)}>
      <body className="antialiased min-h-screen flex flex-col">
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>

        <Providers>
          <Header />
          <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
