/**
 * wagmi Configuration
 *
 * Sets up the wallet connection layer for the DEX Dashboard.
 * Supports MetaMask (injected) and WalletConnect.
 * Chains: Anvil (local) and Sepolia (testnet).
 */
import { http, createConfig } from "wagmi";
import { anvil, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * wagmi configuration with two chains:
 * - Anvil (chain ID 31337) — local development
 * - Sepolia (chain ID 11155111) — testnet
 */
export const wagmiConfig = createConfig({
  chains: [anvil, sepolia],
  connectors: [
    injected({ target: "metaMask" }), // MetaMask browser extension
  ],
  transports: {
    [anvil.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true, // Required for Next.js server-side rendering
});
