# 🚀 DEX Dashboard

**Decentralized Learning & Trading Dashboard (Demo DEX)**

A full-stack Web3 educational dashboard featuring a mock crypto faucet, a simulated token swap mechanism, and real-time live market tracking charts. Built with **Foundry + OpenZeppelin** for smart contracts and **Next.js 16 + shadcn/ui** for the frontend.

---

## 📖 Documentation

| Audience | Link |
|---|---|
| **👤 Users** | [User Guide](https://men6d656e.github.io/DEX/user-guide/) |
| **🔧 Developers** | [Developer Guide](https://men6d656e.github.io/DEX/developer-guide/) |
| **📚 Docs Home** | [Documentation](https://men6d656e.github.io/DEX/) |

---

## ✨ Features

| Feature | Description |
|---|---|
| **💰 Faucet** | Mint mock ETH and BTC tokens once per day with cooldown tracking |
| **🔄 Swap** | Trade mock tokens (mETH ↔ mUSDC) with instant ratio-based execution |
| **📊 Analytics** | Real-time candlestick charts powered by CoinGecko API |
| **🔌 Wallet** | Connect/disconnect wallet, view address and balances |
| **📖 Docs** | GitHub Pages documentation with user and developer guides |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| **Smart Contracts** | [Foundry](https://book.getfoundry.sh/) + [OpenZeppelin](https://www.openzeppelin.com/contracts) |
| **Language (Contracts)** | Solidity ^0.8.27 |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language (Frontend)** | TypeScript (strict mode) |
| **UI Library** | [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Wallet** | [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) |
| **Icons** | [Lucide](https://lucide.dev/) |
| **Market Data** | [CoinGecko API](https://www.coingecko.com/en/api) (Free Tier) |
| **Automation** | Makefile |
| **Docs** | Raw HTML/CSS/JS (GitHub Pages) |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18.0.0
- [Foundry](https://book.getfoundry.sh/) (forge, cast, anvil)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/Men6d656e/DEX.git
cd DEX
make install
```

### 2. Build Contracts

```bash
make build-contracts
```

### 3. Run Contract Tests

```bash
make test-contracts
```

### 4. Start Local Node & Deploy

```bash
# Terminal 1: Start Anvil
make anvil

# Terminal 2: Deploy contracts (will prompt for private key)
make deploy-anvil
```

### 5. Start Frontend

```bash
make install-frontend
make build-frontend
# or for development:
cd frontend && npm run dev
```

---

## 🧪 Testing

```bash
# Run all tests
make test

# Run only contract tests
make test-contracts

# Run only frontend tests
make test-frontend

# Generate coverage report
make coverage
```

---

## 🔧 Makefile Commands

| Command | Description |
|---|---|
| `make install` | Install all dependencies (forge + npm) |
| `make build` | Build contracts + frontend |
| `make test` | Run all tests |
| `make anvil` | Start local Anvil node |
| `make deploy-anvil` | Deploy to Anvil (`--interactives 1`) |
| `make deploy-sepolia` | Deploy to Sepolia (`--interactives 1`) |
| `make clean` | Clean all artifacts |
| `make docs` | Serve docs locally at port 3001 |
| `make coverage` | Generate coverage report |

---

## 🏛 Project Structure

```
├── contracts/         # Foundry smart contracts
│   ├── src/           # MockERC20, Faucet, MockDEX
│   ├── test/          # Solidity tests
│   └── script/        # Deployment scripts
├── frontend/          # Next.js 16 application
│   ├── src/
│   │   ├── app/       # Pages (Home, Faucet, Swap, Analytics)
│   │   ├── components/# UI components (shadcn/ui + custom)
│   │   ├── hooks/     # Custom React hooks
│   │   └── lib/       # Utilities & constants
├── docs/              # GitHub Pages documentation
│   ├── user-guide/    # User documentation
│   └── developer-guide/# Developer documentation
├── Makefile           # Automation
└── README.md          # This file
```

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
