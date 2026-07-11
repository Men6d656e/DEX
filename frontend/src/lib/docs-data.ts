/**
 * docs-data.ts
 *
 * Comprehensive Q&A data for the DEX Dashboard documentation.
 * Each section has a title, description, icon, and an array of Q&A items.
 * Each Q&A item has an id (for the TOC anchor), a question, and an answer.
 *
 * Answers support Markdown-like formatting:
 * - **bold** for emphasis
 * - `code` for inline code
 * - Use the 'type' field for special rendering: 'info', 'warning', 'error', 'success'
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QAItem {
  /** Unique anchor ID for TOC links */
  id: string;
  /** The question text */
  question: string;
  /** The answer text (supports basic markdown) */
  answer: string;
  /** Optional hint/note rendered as a callout below the answer */
  callout?: {
    type: "info" | "warning" | "error" | "success";
    text: string;
  };
}

export interface DocSection {
  /** Section ID for navigation */
  id: string;
  /** Display title */
  title: string;
  /** Short description shown in the sidebar */
  description: string;
  /** Icon emoji */
  icon: string;
  /** Q&A items */
  items: QAItem[];
}

// ─── About Section ───────────────────────────────────────────────────────────

const ABOUT_QA: QAItem[] = [
  {
    id: "what-is-dex",
    question: "What is the DEX Dashboard?",
    answer:
      "The **DEX Dashboard** is a full-stack educational Web3 platform that simulates a decentralized exchange experience. It lets you mint mock tokens, trade them on a simulated DEX, and track live market analytics — all without risking real funds.\n\nIt's built for developers, students, and crypto enthusiasts who want to understand how DeFi protocols work by interacting with one directly.",
    callout: {
      type: "info",
      text: "No real cryptocurrency or fiat money is involved. All tokens are mock ERC20 tokens deployed on test networks or a local Anvil node.",
    },
  },
  {
    id: "target-networks",
    question: "What blockchain networks does it support?",
    answer:
      "The DEX Dashboard works with **two networks**:\n\n**1. Anvil (Local)** — A local Ethereum node provided by the Foundry toolchain. This is the default for development and testing. It runs on `http://127.0.0.1:8545` and gives you instant transactions with no gas costs.\n\n**2. Sepolia (Testnet)** — A public Ethereum testnet. You'll need test ETH from a Sepolia faucet to deploy contracts. The frontend automatically detects which network your wallet is connected to and shows the relevant contract addresses.\n\n> 💡 **Tip:** Start with Anvil for local development, then deploy to Sepolia for public testing.",
    callout: {
      type: "warning",
      text: "Before deploying to Sepolia, make sure you have test ETH. You can get it from the Sepolia Faucet (sepoliafaucet.com).",
    },
  },
  {
    id: "who-is-this-for",
    question: "Who is this project for?",
    answer:
      "This dashboard is designed for:\n\n**👨‍💻 Developers** — Learn Solidity smart contract development, Foundry testing, and full-stack Web3 integration with Next.js and wagmi.\n\n**🎓 Students** — Understand DeFi mechanics like token swaps, liquidity pools, and market analytics in a safe sandbox environment.\n\n**🧪 Crypto Enthusiasts** — Explore how DEXes work under the hood without risking real assets.\n\n**🏫 Educators** — Use this as a teaching tool for blockchain development courses and workshops.",
  },
  {
    id: "tech-stack",
    question: "What technology stack is used?",
    answer:
      "The project is divided into two main parts:\n\n**Smart Contracts (Backend)**\n`Solidity ^0.8.27` + `Foundry` + `OpenZeppelin`\n\n**Frontend**\n`Next.js 16` (App Router) + `TypeScript` (strict) + `shadcn/ui` + `Tailwind CSS v4` + `wagmi` + `viem`\n\n**Charts & Data**\n`Recharts` for candlestick charts, `CoinGecko API` for market data\n\n**Testing**\n`Foundry` (forge) — 182+ Solidity tests including fuzz and invariant tests\n`Vitest` + `Testing Library` — frontend component tests",
  },
  {
    id: "how-to-get-started",
    question: "How do I get started?",
    answer:
      "Follow these steps:\n\n**1.** Clone the repository: `git clone https://github.com/Men6d656e/DEX.git`\n**2.** Install dependencies: `make install`\n**3.** Build contracts: `make build-contracts`\n**4.** Start Anvil: `make anvil` (Terminal 1)\n**5.** Deploy contracts: `make deploy-anvil` (Terminal 2)\n**6.** Start the frontend: `make dev`\n**7.** Open `http://localhost:3000` and connect your wallet\n\n> 💡 **New to Foundry?** The `make` commands automate everything. Just run `make dev` and the frontend will start with hot reload enabled.",
    callout: {
      type: "success",
      text: "Make sure you have Node.js >= 18, Foundry, and Git installed before starting.",
    },
  },
  {
    id: "project-structure",
    question: "What does the project structure look like?",
    answer:
      "The repository is organized into these main directories:\n\n**contracts/** — Foundry smart contracts (MockERC20, Faucet, MockDEX) with tests and deployment scripts.\n\n**frontend/** — Next.js 16 application with pages, components, hooks, and utilities.\n\n**docs/** — GitHub Pages documentation (this documentation hub replaces the old static files).\n\n**scripts/** — Utility scripts like `update-addresses.sh` for auto-capturing deployed contract addresses.\n\nThe root `Makefile` provides automation for install, build, test, deploy, and dev commands.",
  },
];

// ─── Faucet Section ──────────────────────────────────────────────────────────

const FAUCET_QA: QAItem[] = [
  {
    id: "what-is-faucet",
    question: "What is the Faucet?",
    answer:
      "The **Faucet** is a smart contract that distributes mock tokens to users for testing and learning purposes. It's like a water faucet for tokens — turn it on and get free tokens to play with.\n\nEach user can claim a fixed amount of tokens once per **cooldown period** (24 hours), tracked independently for each token type. The faucet ensures fair distribution while preventing abuse.",
    callout: {
      type: "info",
      text: "The Faucet contract uses a checks-effects-interactions pattern for security. Your claim is recorded on-chain before tokens are minted.",
    },
  },
  {
    id: "supported-tokens",
    question: "How many tokens does the Faucet support?",
    answer:
      "The Faucet supports **3 mock tokens**:\n\n**Token Index 0 → mETH** (Mock Ethereum)\n`MockERC20(\"Mock ETH\", \"mETH\", faucetAddress)`\n\n**Token Index 1 → mBTC** (Mock Bitcoin)\n`MockERC20(\"Mock BTC\", \"mBTC\", faucetAddress)`\n\n**Token Index 2 → mUSDC** (Mock USD Coin)\n`MockERC20(\"Mock USDC\", \"mUSDC\", faucetAddress)`\n\nEach token is a full ERC20 implementation from OpenZeppelin with faucet-restricted minting. The faucet is the only address that can mint new tokens.",
  },
  {
    id: "how-to-import-tokens",
    question: "How do I import tokens into my wallet?",
    answer:
      "When you select a token in the Faucet page, its **contract address** is displayed in the section below the claim button. To import a token into MetaMask (or any wallet):\n\n**1.** Copy the contract address shown on the Faucet page.\n**2.** In MetaMask, click **\"Import tokens\"** (scroll to the bottom of your assets list).\n**3.** Paste the contract address. MetaMask will auto-detect the symbol and decimals (18).\n**4.** Click **\"Add Custom Token\"** then **\"Import Tokens\"**.\n\n> ✅ After importing, you'll see your balance update in real-time as you claim more tokens.",
    callout: {
      type: "success",
      text: "Token addresses are unique per deployment. Always use the address shown on the Faucet page — they change when contracts are redeployed.",
    },
  },
  {
    id: "cooldown-system",
    question: "How does the cooldown system work?",
    answer:
      "Each token has an **independent 24-hour cooldown** per wallet address. Here's the breakdown:\n\n**Per token, per wallet** — Claiming mETH doesn't reset your mBTC cooldown. You can claim all 3 tokens on the same day, just not the same token twice.\n\n**Countdown timer** — The UI shows an exact `HH:MM:SS` countdown until your next claim is available.\n\n**Progress indicator** — A circular progress bar shows how much of the cooldown has elapsed.\n\n**State badges** — The claim button shows \"Claim Ready\" (green) when available, or a disabled state with remaining time when on cooldown.\n\n**On-chain tracking** — The `lastClaim` mapping and `cooldown` variable are stored in the Faucet contract. Even if you reload the page, the state persists.",
    callout: {
      type: "warning",
      text: "The cooldown is based on block timestamps, not your local clock. If there's a discrepancy, trust the on-chain countdown displayed in the UI.",
    },
  },
  {
    id: "claim-amount",
    question: "How many tokens can I claim per day?",
    answer:
      "You can claim **10 tokens** (with 18 decimal places, so `10 * 10^18` wei) per token per 24-hour period.\n\n**Example:**\n- Day 1: Claim 10 mETH, claim 10 mBTC, claim 10 mUSDC = **30 tokens total**\n- Day 2: Claim 10 mETH again (cooldown for mETH has reset)\n\nThe claim amount and cooldown duration can be adjusted by the contract owner (the deployer) using the `setClaimAmount()` and `setCooldown()` admin functions.",
  },
  {
    id: "claim-history",
    question: "How do I track my claim history?",
    answer:
      "The Faucet page shows detailed analytics for each token:\n\n**Lifetime Claimed** — Total tokens you've claimed for this token over your entire history.\n\n**Last Claim** — Timestamp of your most recent successful claim.\n\n**Cooldown Remaining** — Time until your next claim becomes available.\n\n**Claim Count** — Total number of claims you've made.\n\nAll this data comes from the Faucet contract's on-chain state (`lastClaim` and `lifetimeClaimed` mappings). It persists across sessions and browser restarts.",
    callout: {
      type: "info",
      text: "Lifetime claimed data is stored on-chain per wallet address. If you switch wallets, the history for the new wallet starts from zero.",
    },
  },
];

// ─── Swap Section ────────────────────────────────────────────────────────────

const SWAP_QA: QAItem[] = [
  {
    id: "what-is-swap",
    question: "What swap pairs are available?",
    answer:
      "The DEX supports **6 swap paths** across 3 token pairs:\n\n**Direct Pairs (via fixed ratio):**\n| Pair | Direction |\n|---|---|\n| mETH ↔ mUSDC | Both ways |\n| mBTC ↔ mUSDC | Both ways |\n\n**Cross-Rate Pairs (derived through mUSDC):**\n| Pair | Direction |\n|---|---|\n| mETH ↔ mBTC | Both ways |\n\nThe cross-rate is calculated by routing through mUSDC internally:\n`ethAmount → USDC value (via ethSwapRate) → BTC output (via btcSwapRate)`\n\nThis gives you a total of **4 direct swaps + 2 cross-rate swaps = 6 paths**.",
    callout: {
      type: "info",
      text: "The Swap interface shows all available pairs in a dropdown. Select your input and output tokens, and the rate will be calculated automatically.",
    },
  },
  {
    id: "pricing-mechanism",
    question: "How does the pricing work?",
    answer:
      "The DEX uses a **fixed-ratio pricing model** — not an AMM (Automated Market Maker) like Uniswap. Here's how it works:\n\n**1. Owner sets rates** — The contract owner sets two exchange rates on deployment:\n   - `ethSwapRate`: How much mUSDC for 1 mETH (e.g., 1700 mUSDC)\n   - `btcSwapRate`: How much mUSDC for 1 mBTC (e.g., 40,000 mUSDC)\n\n**2. Simple ratio math:**\n   - `swapETHForUSDC(ethAmount)`: `output = ethAmount × ethSwapRate / 10^18`\n   - `swapUSDCForETH(usdcAmount)`: `output = usdcAmount × 10^18 / ethSwapRate`\n   - Cross-rate (ETH→BTC): `usdcValue = ethAmount × ethSwapRate / 10^18` then `btcOutput = usdcValue × 10^18 / btcSwapRate`\n\n**3. Reserve limits** — Each swap checks that the DEX has enough reserves to fulfill the order. If not, the transaction reverts with `InsufficientLiquidity`.",
    callout: {
      type: "warning",
      text: "This is NOT a real-time AMM. Prices don't change based on trade size or pool ratio — they're fixed by the contract owner. This is intentional for educational simplicity.",
    },
  },
  {
    id: "swap-fees",
    question: "Is there a swap fee? Who takes it?",
    answer:
      "**There is no swap fee** in this educational DEX. The full swap amount goes to the user without any deduction.\n\nIn real DEXes, fees typically work like this:\n- **Uniswap-style AMMs**: 0.3% fee per swap, distributed to liquidity providers\n- **Centralized exchanges**: Maker/taker fee model, collected by the exchange\n\nFor this learning dashboard, fees were intentionally omitted to keep the contract logic simple and focused on the core swap mechanics.",
    callout: {
      type: "success",
      text: "Since there are no fees, the full input amount is converted to output at the configured rate. What you see is what you get.",
    },
  },
  {
    id: "liquidity-providers",
    question: "Who provides liquidity to the pools?",
    answer:
      "**The DEX contract owner** is the sole liquidity provider. They call the `addLiquidity()` function to deposit mETH, mBTC, and mUSDC tokens into the DEX.\n\nThe current liquidity is visible on the Swap page in the **Reserves panel**, which shows:\n- ETH Reserve: Total mETH held by the DEX\n- BTC Reserve: Total mBTC held by the DEX\n- USDC Reserve: Total mUSDC held by the DEX\n\n> 🔒 Since this is a demo, there's no public liquidity provision (no LP tokens, no yield farming). The owner ensures there's always enough liquidity for testing.",
    callout: {
      type: "info",
      text: "In production DEXes like Uniswap, anyone can be a liquidity provider by depositing equal values of two tokens into a pool. Here, it's simplified to owner-only for educational clarity.",
    },
  },
  {
    id: "slippage-protection",
    question: "What is slippage protection and how do I use it?",
    answer:
      "**Slippage** is the difference between the expected price of a trade and the price at which it's actually executed. Even though this DEX uses fixed rates, slippage protection is still implemented as a safety mechanism.\n\nEach swap function accepts a `minOutput` parameter:\n```solidity\nfunction swapETHForUSDC(uint256 ethAmount, uint256 minUSDC)\n```\n\nIf the calculated output is **less than** your `minOutput`, the transaction reverts with `SlippageExceeded`. This protects you from:\n- **Front-running** (simulated in a test environment)\n- **Reserve changes** between when you submit and when the transaction executes\n\nYou can set the slippage tolerance in the Swap page via the **⚙️ Settings** button (gear icon). Default is 0.5%.",
    callout: {
      type: "warning",
      text: "Setting slippage too low (e.g., 0.1%) may cause transactions to fail if reserves change slightly. Setting it too high (e.g., 10%) defeats the purpose. 0.5% is a good starting point.",
    },
  },
  {
    id: "token-approval",
    question: "How do I approve tokens for swapping?",
    answer:
      "Before you can swap, the DEX contract needs **permission** to spend your tokens. This is done via the ERC20 `approve()` function.\n\n**Step-by-step:**\n**1.** Select your input token and enter an amount.\n**2.** If this is your first time swapping this token, you'll see an **\"Approve\"** button.\n**3.** Click \"Approve\" and confirm the MetaMask transaction.\n**4.** Once approved, the button changes to **\"Swap\"**.\n**5.** Click \"Swap\" and confirm the second transaction.\n\n> 🔄 Approval is per-token. You need to approve each token (mETH, mBTC, mUSDC) separately, but only once per session. The DEX stores an `allowance` that persists across swaps.",
    callout: {
      type: "info",
      text: "The approval sets `type(uint256).max` (infinite approval) so you don't need to re-approve for subsequent swaps. You can revoke this at any time by approving 0.",
    },
  },
  {
    id: "liquidity-pool-mechanics",
    question: "How does the liquidity pool work in this DEX?",
    answer:
      "This DEX uses a **simplified reserve-based model**, not a constant product AMM. Here's how it differs:\n\n**What it is:**\n- The DEX holds reserves of mETH, mBTC, and mUSDC\n- Swaps transfer tokens into and out of these reserves\n- Reserves track exactly how many tokens the DEX holds (`ethReserve`, `btcReserve`, `usdcReserve`)\n- Invariant tests verify that `reserve == DEX.balanceOf(token)` at all times\n\n**What it is NOT:**\n- ❌ Not a constant product AMM (no `x * y = k` formula)\n- ❌ No automated price discovery (rates are fixed by the owner)\n- ❌ No liquidity provider shares or LP tokens\n\n**Why this approach?** It's intentionally simplified to teach the core concept of reserve-based swaps without the math complexity of AMM curves.",
    callout: {
      type: "success",
      text: "The reserve invariants are tested in Foundry with randomized sequences (256 runs × 15 depth) — reserves always match the DEX balance exactly.",
    },
  },
];

// ─── Analytics Section ───────────────────────────────────────────────────────

const ANALYTICS_QA: QAItem[] = [
  {
    id: "what-is-analytics",
    question: "What data is shown on the Analytics page?",
    answer:
      "The Analytics page is your command center for market insights. It shows:\n\n**📈 Market Stats Cards** — Top-level KPIs:\n- 24h Volume: Total trading volume in the last 24 hours\n- Total Trades: Number of completed swaps\n- Active Users: Unique wallet addresses that interacted\n- TVL: Total Value Locked in the DEX\n\n**📊 Candlestick Charts** — Three interactive charts for ETH, BTC, and a combined overview. Each shows price action with customizable timeframes.\n\n**📋 Token Statistics** — Detailed table with price, 24h change, market cap, and volume for each tracked token.\n\n**🔄 Trade History** — Recent swap transactions with timestamps, amounts, token types, and participant addresses.\n\n**👛 Portfolio Overview** — Your connected wallet's token balances with USD values and allocation breakdown.",
  },
  {
    id: "market-data-source",
    question: "Where does the market data come from?",
    answer:
      "Market data is powered by the **CoinGecko API** (Free Tier). The frontend fetches:\n- **Candlestick data** (OHLCV) for ETH and BTC — used for the charts\n- **Current prices** and **24h price changes** — used in stats cards and token table\n- **Market metrics** — volume, market cap, and trading activity\n\n**How the API key works:**\n```bash\n# Create frontend/.env.local and add:\nNEXT_PUBLIC_COINGECKO_API_KEY=your_api_key_here\n```\nGet a free API key at [CoinGecko API](https://www.coingecko.com/en/api)\n\n> 📡 Without an API key, the dashboard uses fallback/demo data so the UI remains functional.",
    callout: {
      type: "warning",
      text: "CoinGecko's free tier has rate limits. If you see stale data, you may have exceeded the request limit. Consider adding a delay or using the API key for higher limits.",
    },
  },
  {
    id: "candlestick-charts",
    question: "How do I read the candlestick charts?",
    answer:
      "Candlestick charts show price movement over time. Each **candle** represents a specific time period (e.g., 1 day) and shows 4 data points:\n\n**🧱 The Candle Body** (thick rectangle):\n- **Open** — Price at the start of the period\n- **Close** — Price at the end of the period\n- **Green/Up candle**: Close > Open (price increased)\n- **Red/Down candle**: Close < Open (price decreased)\n\n**📏 The Wicks** (thin lines above and below):\n- **High** — Highest price during the period (top of upper wick)\n- **Low** — Lowest price during the period (bottom of lower wick)\n\n**Longer wicks** = more price volatility. **Small bodies** = the open and close were close together.\n\nOn the dashboard, you can toggle between ETH, BTC, and an overview chart combining both.",
    callout: {
      type: "info",
      text: "Hover over any candle to see the exact Open, High, Low, Close values for that period. Use the timeframe selector (1D, 1W, 1M, 1Y) to zoom in and out.",
    },
  },
  {
    id: "key-metrics",
    question: "What are the key metrics and how should I interpret them?",
    answer:
      "The stats cards at the top of the Analytics page show 4 key metrics:\n\n**📊 24h Volume** — Total value of all swaps in the last 24 hours. Higher volume = more activity. Trend arrows show if volume is up or down vs yesterday.\n\n**🔄 Total Trades** — Count of completed swap transactions. More trades = more user engagement.\n\n**👥 Active Users** — Unique wallet addresses that performed at least one swap or faucet claim in the last 24 hours.\n\n**🏦 TVL (Total Value Locked)** — The total USD value of all tokens held in the DEX contract. This represents the liquidity available for trading.\n\nEach card includes a **trend indicator** (↑ or ↓) showing the percentage change compared to the previous day's value.",
  },
  {
    id: "portfolio-tracking",
    question: "How does the portfolio tracking work?",
    answer:
      "The **Portfolio Overview** section shows the token balances of your connected wallet:\n\n**What it displays:**\n- Token icons and symbols (mETH, mBTC, mUSDC)\n- Your balance of each token (read from the ERC20 contracts)\n- Current USD value (calculated using rates from CoinGecko)\n- Portfolio allocation pie chart (what percentage of your portfolio is in each token)\n- Total portfolio value in USD\n\n**How it works:** The balances are fetched directly from the blockchain using `balanceOf()` calls through wagmi/viem. Values update in real-time when you interact with the Faucet or Swap pages.",
    callout: {
      type: "info",
      text: "The portfolio only shows tokens held by your connected wallet. If you switch wallets or disconnect, the data resets for the new address.",
    },
  },
  {
    id: "trade-history",
    question: "What is shown in the Trade History table?",
    answer:
      "The **Trade History** table displays a chronological list of recent swap transactions:\n\n| Column | Description |\n|---|---|\n| **Time** | When the swap was executed (relative time like \"2m ago\", \"1h ago\") |\n| **Type** | Which swap direction (mETH→mUSDC, mBTC→mETH, etc.) |\n| **Amount In** | How many input tokens were sold |\n| **Amount Out** | How many output tokens were received |\n| **User** | The wallet address that performed the swap (truncated) |\n\nThe data is fetched from the `Swapped` events emitted by the DEX contract. Each swap emits an event with the user address, input token, output token, and amounts.",
    callout: {
      type: "success",
      text: "You can click any trade to see more details. The table automatically updates when new swaps occur on the connected network.",
    },
  },
  {
    id: "token-statistics",
    question: "What token statistics are available?",
    answer:
      "The **Token Statistics** section provides a detailed breakdown for each tracked token:\n\n**Price** — Current market price in USD (from CoinGecko for real tokens, from DEX rates for mock tokens)\n\n**24h Change** — Price change percentage in the last 24 hours (green for positive, red for negative)\n\n**Market Cap** — Total market capitalization (supply × price)\n\n**24h Volume** — Trading volume in the last 24 hours\n\n**Circulating Supply** — Total tokens in circulation\n\nEach row represents a token (ETH, BTC) with interactive hover states and clickable links for more detail.",
    callout: {
      type: "info",
      text: "For mock tokens (mETH, mBTC, mUSDC), the supply shown is the total minted by the Faucet. Real market data (price, volume) comes from CoinGecko.",
    },
  },
];

// ─── Developer / Architecture Section ─────────────────────────────────────────

const DEVELOPER_QA: QAItem[] = [
  {
    id: "contract-architecture",
    question: "How are the smart contracts structured?",
    answer:
      "The contracts follow a **modular architecture** with clear separation of concerns:\n\n**MockERC20** — A standard ERC20 token (OpenZeppelin) with one addition: minting is restricted to a single `faucet` address. The owner can change the faucet address.\n\n**Faucet** — Manages token distribution with time-locked claims. Stores `lastClaim` and `lifetimeClaimed` mappings per user per token. Uses OpenZeppelin's Ownable for admin controls.\n\n**MockDEX** — The core exchange contract. Manages 3 reserves (ETH, BTC, USDC), 2 swap rates, and executes 6 swap paths. Uses SafeERC20 for secure transfers.\n\nAll contracts use **custom errors** for gas-efficient reverts and follow the **checks-effects-interactions** pattern.",
  },
  {
    id: "testing-strategy",
    question: "How is the project tested?",
    answer:
      "The project has **182+ Solidity tests** with comprehensive coverage:\n\n**MockERC20 (35 tests)** — Minting, faucet permissions, ownership, ERC20 standards (transfer, approve, events)\n\n**Faucet (51 tests)** — Claims, cooldowns, edge cases, admin functions, event emission\n\n**MockDEX (96 tests)** — All 6 swap paths, liquidity management, slippage protection, access control, event emission\n  - **14 fuzz tests** × 256 runs each — randomized inputs for every swap function\n  - **4 invariant tests** × 256 runs × 15 depth — random sequences verify reserves match balances\n\n**Frontend tests** — Vitest + Testing Library for component testing.",
    callout: {
      type: "success",
      text: "Run `make test-contracts` or `forge test -vvv` to run all 182+ Solidity tests. Fuzz runs + invariant tests take ~30 seconds.",
    },
  },
];

// ─── Export All Sections ─────────────────────────────────────────────────────

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "about",
    title: "About",
    description: "Project overview, target networks, tech stack, and getting started guide.",
    icon: "📖",
    items: ABOUT_QA,
  },
  {
    id: "faucet",
    title: "Faucet",
    description: "Claim mock tokens, cooldown system, supported tokens, and importing tokens.",
    icon: "💰",
    items: FAUCET_QA,
  },
  {
    id: "swap",
    title: "Swap",
    description: "Swap pairs, pricing, liquidity, fees, slippage protection, and token approval.",
    icon: "🔄",
    items: SWAP_QA,
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Market data, candlestick charts, portfolio tracking, and trade history.",
    icon: "📊",
    items: ANALYTICS_QA,
  },
  {
    id: "developer",
    title: "Developer",
    description: "Contract architecture, testing strategy, and deployment guide.",
    icon: "🔧",
    items: DEVELOPER_QA,
  },
];

/** Get a section by its ID */
export function getSection(id: string): DocSection | undefined {
  return DOC_SECTIONS.find((s) => s.id === id);
}

/** Get flattened Q&A items across all sections for search */
export function getAllQAItems(): (QAItem & { sectionId: string; sectionTitle: string })[] {
  const all: (QAItem & { sectionId: string; sectionTitle: string })[] = [];
  for (const section of DOC_SECTIONS) {
    for (const item of section.items) {
      all.push({ ...item, sectionId: section.id, sectionTitle: section.title });
    }
  }
  return all;
}
