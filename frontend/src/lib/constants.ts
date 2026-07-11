/**
 * DEX Dashboard - Contract Configuration
 *
 * After deploying contracts (via `make deploy-anvil` or `make deploy-sepolia`),
 * copy the deployed addresses (printed as JSON by the forge script) into
 * the CONTRACT_ADDRESSES object below.
 *
 * To get the addresses:
 *   1. make anvil          (start local chain)
 *   2. make deploy-anvil   (deploy & copy addresses from output)
 *   3. Paste addresses below, replacing the placeholder zeros.
 */

// ================================================================
// Chain Configuration
// ================================================================

export const CHAIN_CONFIG = {
  /** Local Anvil node — default port */
  anvil: {
    id: 31_337, // 0x7A69
    name: "Anvil",
    rpcUrl: "http://127.0.0.1:8545",
    currency: "ETH",
    explorerUrl: undefined,
  },
  /** Sepolia testnet */
  sepolia: {
    id: 11_155_111, // 0xAA36A7
    name: "Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    currency: "SepoliaETH",
    explorerUrl: "https://sepolia.etherscan.io",
  },
} as const;

// ================================================================
// Contract Addresses
// ================================================================

/**
 * Update these addresses after running:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url <RPC_URL> --broadcast --interactives 1
 *
 * The deployment script outputs a JSON block with all addresses.
 */
export const CONTRACT_ADDRESSES = {
  /** Mock ETH token (ERC20) */
  mETH: "0x5fbdb2315678afecb367f032d93f642f64180aa3" as `0x${string}`,
  /** Mock BTC token (ERC20) */
  mBTC: "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512" as `0x${string}`,
  /** Mock USDC token (ERC20) — used in DEX swaps */
  mUSDC: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0" as `0x${string}`,
  /** Faucet contract — distributes mETH and mBTC */
  faucet: "0x0165878a594ca255338adfa4d48449f69242eb8f" as `0x${string}`,
  /** MockDEX contract — mETH ↔ mUSDC swaps */
  dex: "0xa513e6e4b8f2a923d98304ec87f64353c4d5c853" as `0x${string}`,
} as const;

// ================================================================
// Token Metadata
// ================================================================

export const TOKENS = [
  {
    index: 0,
    symbol: "mETH",
    name: "Mock ETH",
    address: CONTRACT_ADDRESSES.mETH,
    decimals: 18,
    icon: "⟠",
    color: "#627EEA", // Ethereum blue
    /** Address where this token is used in the DEX (mUSDC for swaps) */
    swapPair: "mUSDC" as const,
  },
  {
    index: 1,
    symbol: "mBTC",
    name: "Mock BTC",
    address: CONTRACT_ADDRESSES.mBTC,
    decimals: 18,
    icon: "₿",
    color: "#F7931A", // Bitcoin orange
    swapPair: undefined,
  },
  {
    index: 2,
    symbol: "mUSDC",
    name: "Mock USDC",
    address: CONTRACT_ADDRESSES.mUSDC,
    decimals: 18,
    icon: "$",
    color: "#2775CA", // USDC blue
    swapPair: "mETH" as const,
  },
] as const;

// ================================================================
// DEX Configuration
// ================================================================

/**
 * Swap rate (scaled by 1e18):
 * 1 mETH = 1700 mUSDC
 */
export const SWAP_RATE = 1700n * 10n ** 18n;

/** Default slippage tolerance (in percentage) */
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%

// ================================================================
// Faucet Configuration
// ================================================================

/** Claim amount per faucet interaction: 10 tokens (with 18 decimals) */
export const FAUCET_CLAIM_AMOUNT = 10n * 10n ** 18n;

/** Cooldown between claims: 24 hours (in seconds) */
export const FAUCET_COOLDOWN = 24 * 60 * 60;

/** Token index for mETH in the Faucet contract */
export const FAUCET_TOKEN_METH = 0;

/** Token index for mBTC in the Faucet contract */
export const FAUCET_TOKEN_MBTC = 1;
