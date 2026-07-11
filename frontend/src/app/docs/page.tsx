import type { Metadata } from "next";
import { DocsPage } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Documentation | DEX Dashboard",
  description:
    "Comprehensive documentation for the DEX Dashboard — learn about the Faucet, Swap, Analytics, and project architecture.",
};

export default function Docs() {
  return <DocsPage />;
}
