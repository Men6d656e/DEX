import type { Metadata } from "next";
import { DocsPage } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "About | DEX Dashboard",
  description:
    "Learn about the DEX Dashboard — a full-stack Web3 educational platform for learning decentralized finance.",
};

export default function About() {
  return <DocsPage initialSection="about" />;
}
