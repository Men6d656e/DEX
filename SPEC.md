# DEX Dashboard — Architecture Specification (SPEC)

> **Project:** Decentralized Learning & Trading Dashboard (Demo DEX)
> **Status:** Architecture Review Phase
> **Version:** 1.0

---

## 1. Overview

A full-stack Web3 educational dashboard featuring:
- **Faucet Panel** — Mint mock test-tokens (mETH, mBTC) once daily
- **Swap Panel** — Trade mock tokens with instant ratio-based execution
- **Analytics Hub** — Real market charts from CoinGecko API
- **Rich Home Page** — Startup-style landing with features, about, CTA
- **Wallet Integration** — Connect/disconnect, display address + balances
- **Documentation** — GitHub Pages `/docs` with User Guide + Developer Guide

---

## 2. Repository Structure (Monorepo)

```
dex-dashboard/
│
├── contracts/                        # Foundry (Solidity) project
│   ├── src/
│   │   ├── MockERC20.sol             # OpenZeppelin-based ERC20 mock token
│   │   ├── Faucet.sol                # Time-locked faucet (24h cooldown)
│   │   └── MockDEX.sol               # Simple AMM swap (mETH ↔ mUSDC)
│   ├── test/
│   │   ├── MockERC20.t.sol           # Unit tests for MockERC20
│   │   ├── Faucet.t.sol              # Unit tests for Faucet
│   │   └── MockDEX.t.sol             # Unit tests + fuzz tests for MockDEX
│   ├── script/
│   │   └── Deploy.s.sol              # Deployment script (anvil / sepolia)
│   ├── lib/                          # forge dependencies (openzeppelin, forge-std)
│   ├── foundry.toml                  # Foundry config
│   ├── remappings.txt                # Solidity import remappings
│   └── .env.example                  # PRIVATE_KEY template
│
├── frontend/                         # Next.js 16 (App Router) + TypeScript
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   │   ├── layout.tsx            # Root layout (header, wallet, tabs nav)
│   │   │   ├── page.tsx              # Home page (hero, features, about)
│   │   │   ├── faucet/page.tsx       # Faucet panel
│   │   │   ├── swap/page.tsx         # Swap panel
│   │   │   └── analytics/page.tsx    # Charts & analytics hub
│   │   ├── components/               # Shared UI components
│   │   │   ├── ui/                   # shadcn/ui components (button, card, tabs, etc.)
│   │   │   ├── layout/               # Header, Footer, Nav, WalletButton
│   │   │   ├── faucet/               # Faucet-specific components
│   │   │   ├── swap/                 # Swap-specific components
│   │   │   └── charts/               # Chart components (Recharts)
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useContract.ts        # Contract interaction hooks
│   │   │   ├── useWallet.ts          # Wallet state hook
│   │   │   └── useMarketData.ts      # CoinGecko data fetching
│   │   ├── lib/                      # Utilities & constants
│   │   │   ├── constants.ts          # Token addresses, ABIs, config
│   │   │   ├── faucet.ts             # Faucet logic helpers
│   │   │   └── swap.ts               # Swap math helpers
│   │   └── types/                    # TypeScript type declarations
│   │       ├── index.ts
│   │       └── contracts.ts          # Contract ABI types
│   ├── public/                       # Static assets
│   ├── tests/                        # Frontend tests (Vitest or Jest)
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.ts
│
├── docs/                             # GitHub Pages documentation
│   ├── index.html                    # Landing → two entry points
│   ├── user-guide/
│   │   ├── index.html                # User documentation
│   │   ├── getting-started.html
│   │   ├── faucet.html
│   │   ├── swap.html
│   │   └── analytics.html
│   ├── developer-guide/
│   │   ├── index.html                # Developer documentation
│   │   ├── architecture.html
│   │   ├── contracts.html
│   │   ├── frontend.html
│   │   ├── deployment.html
│   │   └── testing.html
│   └── assets/
│       ├── css/
│       │   └── style.css
│       └── js/
│           └── main.js
│
├── Makefile                          # Automation: install, test, deploy, clean, docs
├── README.md                         # Main project README (links to /docs)
├── SPEC.md                           # This file — architecture specification
├── .gitignore
└── package.json                      # Root workspace config (pnpm or npm workspaces)
```

---

## 3. Smart Contract Design

### 3.1 MockERC20.sol

```
Contract: MockERC20
Inherits: OpenZeppelin ERC20
Purpose:  Mock test token with mint capability (only Faucet can mint)

State:
  - _faucet: address  (only this address can call mint)
  - decimals: 18

Functions:
  - constructor(name, symbol, faucetAddress)
  - mint(to, amount)         → only _faucet
  - setFaucet(newFaucet)     → onlyOwner (Ownable)

Events:
  - TokensMinted(address indexed to, uint256 amount)
```

**Deployment:** Two instances — Mock ETH (mETH) and Mock BTC (mBTC).

### 3.2 Faucet.sol

```
Contract: Faucet
Inherits: OpenZeppelin Ownable
Purpose:  Time-locked minting of mock tokens (24h cooldown per user)

State:
  - lastClaim[user][token] → uint256 (timestamp)
  - lifetimeClaimed[user][token] → uint256
  - COOLDOWN: 24 hours
  - CLAIM_AMOUNT: 10 tokens (w/ decimals)
  - mETH: MockERC20
  - mBTC: MockERC20

Functions:
  - constructor(mETHAddress, mBTCAddress)
  - claimToken(tokenIndex)          → 0 = mETH, 1 = mBTC
      * Reverts if cooldown not elapsed
      * Mints CLAIM_AMOUNT to msg.sender
      * Updates lastClaim & lifetimeClaimed
  - getClaimInfo(user, tokenIndex)  → view
      Returns: (canClaim, timeRemaining, lifetimeClaimed, lastClaimTime)
  - setClaimAmount(amount)          → onlyOwner
  - setCooldown(seconds)            → onlyOwner

Errors:
  - Faucet__CooldownNotElapsed(remaining)
  - Faucet__InvalidToken()

Events:
  - TokensClaimed(address indexed user, address token, uint256 amount, uint256 timestamp)
```

### 3.3 MockDEX.sol

```
Contract: MockDEX
Inherits: OpenZeppelin Ownable
Purpose:  Simple ratio-based swap: mETH ↔ mUSDC

State:
  - mETH: IERC20
  - mUSDC: IERC20
  - ethReserve: uint256
  - usdcReserve: uint256
  - swapRate: uint256 (e.g., 1700 = 1 mETH = 1700 mUSDC)

Functions:
  - constructor(mETH, mUSDC, initialRate)
  - addLiquidity(ethAmount, usdcAmount)          → onlyOwner
      * Transfers tokens from owner to contract
      * Updates reserves
  - swapETHForUSDC(ethAmount, minUSDC)
      * Calculates output: ethAmount * swapRate
      * Checks minUSDC (slippage)
      * Transfers mETH from user, mUSDC to user
      * Updates reserves
  - swapUSDCForETH(usdcAmount, minETH)
      * Calculates output: usdcAmount / swapRate
      * Checks minETH (slippage)
  - getRate()                                     → view returns (uint256)
  - setRate(newRate)                              → onlyOwner

Errors:
  - MockDEX__InsufficientLiquidity()
  - MockDEX__SlippageExceeded()
  - MockDEX__ZeroAmount()

Events:
  - LiquidityAdded(address indexed provider, uint256 eth, uint256 usdc)
  - Swapped(address indexed user, address fromToken, address toToken, uint256 amountIn, uint256 amountOut)
```

### 3.4 Deployment Script (Deploy.s.sol)

```solidity
// Uses forge script --interactives 1 for private key input
// Modes:
//   1. anvil:   forge script Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --interactives 1
//   2. sepolia: forge script Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --interactives 1
```

### 3.5 Test Coverage Plan

| Test File | Tests |
|---|---|
| MockERC20.t.sol | Minting, only-faucet restriction, setFaucet, events, ownership transfer |
| Faucet.t.sol | Claim mETH, claim mBTC, 24h cooldown, time-remaining calc, lifetime tracking, double-claim revert, onlyOwner setters |
| MockDEX.t.sol | Add liquidity, swap mETH→mUSDC, swap mUSDC→mETH, slippage protection, rate updates, insufficient liquidity, fuzz tests with `bound()` |

**Target:** 100% line coverage for all contracts.

---

## 4. Frontend Design

### 4.1 Routes & Pages

| Route | Page | Features |
|---|---|---|
| `/` | Home | Hero section, feature cards, about, CTA, stats |
| `/faucet` | Faucet | Token selector, claim button, address display, cooldown timer, analytics |
| `/swap` | Swap | From/To token input, rate display, swap button, slippage info |
| `/analytics` | Charts | CoinGecko candlestick chart, 24h stats, market data |

### 4.2 shadcn/ui Components Used

The project uses **shadcn/ui** (CLI v4) — a copy-and-paste component library built on Radix UI primitives with Tailwind CSS styling.

#### Installation
```bash
# Initialize shadcn/ui in the Next.js project
npx shadcn@latest init -t next

# Add required components for the dashboard
npx shadcn@latest add button card tabs input select dialog dropdown-menu \
  badge separator sheet tooltip toast progress table avatar
```

#### Component Mapping

| Dashboard Element | shadcn/ui Component |
|---|---|
| Navigation tabs | `Tabs`, `Avatar` |
| Cards (feature cards, panels) | `Card` (CardHeader, CardContent, CardFooter) |
| Buttons (claim, swap, connect) | `Button` (variants: default, destructive, outline, ghost) |
| Token selector dropdown | `Select` |
| Input amounts | `Input` |
| Wallet dropdown | `DropdownMenu` |
| Token address copy | `Button` + `Tooltip` |
| Swap settings | `Sheet` (slide-over panel) |
| Notifications | `Toast` |
| Claim cooldown | `Progress` (circular/linear) |
| Stats grid | `Card` + `Badge` |
| Token table | `Table` |
| Section dividers | `Separator` |

#### Layout Components

```
Layout
├── Header
│   ├── Logo + Brand
│   ├── NavLinks (Home | Faucet | Swap | Analytics) — Tabs
│   ├── WalletButton (Connect / Address + Balance) — DropdownMenu
│   └── DocsLink → opens /docs — Button(variant="link")
└── Footer
    ├── Links
    └── Built with info

Home Page
├── HeroSection (animated headline, CTA, mock stats)
├── FeatureCards (3x shadcn Card components)
├── AboutSection (project description, tech stack)
└── FooterCTA

Faucet Page
├── TokenSelector (shadcn Tabs: mETH | mBTC)
├── TokenAddressDisplay + CopyButton (Button + Tooltip)
├── FaucetClaimButton (Button variant="default")
├── CooldownTimer (Progress)
├── BalanceDisplay (Card)
└── AnalyticsPanel (Card)
    ├── LifetimeClaimed (total)
    ├── LastClaimTime
    └── ClaimHistory (Table)

Swap Page
├── SwapCard (Card)
│   ├── FromInput (Select + Input)
│   ├── SwapDirectionButton (Button variant="outline")
│   ├── ToInput (Select + Input)
│   ├── RateDisplay (Badge)
│   ├── SlippageInfo (Sheet)
│   └── SwapButton (Button)
├── LiquidityInfo (Card)

Analytics Page
├── ChartTypeTabs (Tabs: Candlestick / Line / 24h)
├── TokenPairSelector (Select)
├── PriceChart (Recharts)
├── StatsGrid (4x Card + Badge)
└── MarketDataTable (Table)
```

### 4.3 State Management

```
Wallet State (wagmi + viem)
  - address: string | null
  - isConnected: boolean
  - balance: { mETH: bigint, mBTC: bigint, mUSDC: bigint }

Faucet State
  - selectedToken: 0 | 1
  - canClaim: boolean
  - timeRemaining: number (seconds)
  - lifetimeClaimed: bigint
  - isClaiming: boolean

Swap State
  - fromToken: 'mETH' | 'mUSDC'
  - toToken: 'mUSDC' | 'mETH'
  - fromAmount: string
  - toAmount: string
  - rate: number
  - slippage: number

Market Data
  - prices: Array<{timestamp, open, high, low, close}>
  - stats: { high24h, low24h, volume, change }
```

### 4.4 External API

- **CoinGecko Free API** (`https://api.coingecko.com/api/v3/`)
  - `/coins/bitcoin/ohlc?vs_currency=usd&days=7` — candlestick data
  - `/coins/bitcoin` — market stats
  - `/coins/ethereum/ohlc?vs_currency=usd&days=7`
  - `/coins/ethereum`

### 4.5 Styling Strategy

- **shadcn/ui theming** via CSS variables (customized through `npx shadcn@latest init`)
- **Tailwind CSS** utility classes for all custom styling
- **Dark theme** as default (slate/neutral palette with accent colors)
- **CSS Grid/Flexbox** layouts
- **Responsive** — mobile-first design for desktop & tablet
- Gradient accents, hover effects, smooth transitions using shadcn's built-in variants

---

## 5. Makefile Automation

| Target | Description | Dependencies |
|---|---|---|
| `make install` | Install all dependencies | forge install, npm install (frontend) |
| `make build` | Build contracts + frontend | forge build, npm run build |
| `make test` | Run all tests | forge test + npm test |
| `make test-contracts` | Only forge tests | — |
| `make test-frontend` | Only frontend tests | — |
| `make anvil` | Start local anvil node | — |
| `make deploy-anvil` | Deploy contracts to anvil | forge script (--interactives 1) |
| `make deploy-sepolia` | Deploy to sepolia | forge script (--interactives 1) |
| `make clean` | Clean artifacts | forge clean, rm -rf node_modules |
| `make docs` | Serve docs locally | python3 -m http.server in /docs |
| `make fmt` | Format code | forge fmt, prettier |
| `make coverage` | Generate coverage report | forge coverage |

---

## 6. Documentation Strategy

### 6.1 GitHub Pages (/docs)

```
docs/
├── index.html                    # Landing page
│   ├── Hero: "DEX Dashboard"
│   ├── Two entry points:
│   │   ├── [User Guide]   → /docs/user-guide/
│   │   └── [Developer Guide] → /docs/developer-guide/
│   └── Footer with repo link
├── user-guide/
│   ├── index.html                # User Guide home
│   ├── getting-started.html      # How to connect wallet, get tokens
│   ├── faucet.html               # How to use the faucet
│   ├── swap.html                 # How to swap tokens
│   └── analytics.html            # How to read charts
├── developer-guide/
│   ├── index.html                # Developer Guide home
│   ├── architecture.html         # System architecture
│   ├── contracts.html            # Smart contract documentation
│   ├── frontend.html             # Frontend structure & patterns
│   ├── deployment.html           # Local & production deployment
│   └── testing.html              # How to run tests, coverage
└── assets/
    ├── css/style.css             # Custom styles (dark theme)
    └── js/main.js                # Navigation, interactivity
```

### 6.2 Navigation Bar Integration

The main app navigation bar includes a **"Docs"** link pointing to `https://<user>.github.io/dex-dashboard/` (the GitHub Pages URL for `/docs`).

### 6.3 README.md

The main README includes:
- Project overview
- Quick start guide
- **Link to documentation:** `[📖 User Guide](https://<user>.github.io/dex-dashboard/user-guide/)` and `[🔧 Developer Guide](https://<user>.github.io/dex-dashboard/developer-guide/)`
- Tech stack badges
- Contribution guidelines

---

## 7. Tech Stack Summary

| Layer | Technology |
|---|---|
| **Language** | Solidity ^0.8.20 |
| **Framework** | Foundry (forge, cast, anvil) |
| **Libraries** | OpenZeppelin (ERC20, Ownable) |
| **Testing** | Forge test (Solidity) + fuzz testing |
| **Frontend** | Next.js 16 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS |
| **Charts** | Recharts |
| **Wallet** | wagmi + viem |
| **Icons** | Lucide React (via shadcn/ui preset) |
| **Data** | CoinGecko Free API |
| **Build** | Turborepo / npm workspaces |
| **Automation** | Makefile |
| **Docs** | Raw HTML/CSS/JS (GitHub Pages) |
| **LSP/Format** | forge fmt, Prettier |

---

## 8. Implementation Phases (GSD)

| Phase | Description | Deliverables |
|---|---|---|
| **Phase 1** | Project scaffolding | Monorepo structure, Makefile, configs, gitignore |
| **Phase 2** | Smart contracts | MockERC20, Faucet, MockDEX — implementation + tests |
| **Phase 3** | Contract deployment | Deploy script, anvil deploy, sepolia deploy |
| **Phase 4** | Frontend setup | Next.js project, Tailwind, wagmi, layout, navigation |
| **Phase 5** | Home page | Hero, features, about, CTA sections |
| **Phase 6** | Wallet integration | Connect button, address display, balance tracking |
| **Phase 7** | Faucet UI | Token selector, claim, cooldown, analytics |
| **Phase 8** | Swap UI | Token inputs, rate display, slippage, swap execution |
| **Phase 9** | Analytics UI | CoinGecko integration, Recharts candlestick, stats |
| **Phase 10** | Documentation | README, /docs (user guide + developer guide) |
| **Phase 11** | Testing & Polish | Full test suite, coverage, UX improvements |

---

## 9. Key Design Decisions

1. **Why OpenZeppelin?** — Battle-tested ERC20 and Ownable implementations reduce audit surface.
2. **Why Foundry?** — Native Solidity tests, fast compilation, fuzz testing built-in.
3. **Why wagmi + viem?** — Modern React hooks for wallet connection without boilerplate.
4. **Why shadcn/ui?** — Accessible, customizable Radix UI primitives with Tailwind styling — code you own.
5. **Why Next.js 16?** — Latest LTS release, improved performance, Turbopack stable, enhanced App Router.
6. **Why ratio-based swap (not AMM)?** — Educational simplicity; user sees clear math (1 mETH = 1700 mUSDC).
7. **Why raw HTML docs?** — GitHub Pages compatibility; zero build step.
8. **Why `--interactives`?** — Security: private key never stored in shell history or files.

---

*This document is the architecture specification. Review and approve before implementation begins.*
