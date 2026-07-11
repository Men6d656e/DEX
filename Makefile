# ============================================================
# DEX Dashboard — Makefile
# Automation for smart contracts (Foundry) + frontend (Next.js)
# ============================================================

.PHONY: help install build test test-contracts test-frontend \
	anvil deploy-anvil deploy-sepolia deploy-update dev dev-frontend prod prod-frontend \
	clean docs fmt coverage generate-abi

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
	awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Installation ───────────────────────────────────────────────

install: ## Install all dependencies (forge + npm)
	@echo "📦 Installing Foundry dependencies..."
	cd contracts && forge install --no-git
	@echo "📦 Installing frontend dependencies..."
	@npm install
	@echo "✅ All dependencies installed."

install-contracts: ## Install only Foundry dependencies
	@echo "📦 Installing Foundry dependencies..."
	cd contracts && forge install --no-git
	@echo "✅ Foundry dependencies installed."

install-frontend: ## Install only frontend dependencies
	@echo "📦 Installing frontend dependencies..."
	@npm install
	@echo "✅ Frontend dependencies installed."

# ─── Build ──────────────────────────────────────────────────────

build: ## Build contracts + frontend
	@echo "🔨 Building contracts..."
	cd contracts && forge build
	@echo "🔨 Building frontend..."
	@npm run build
	@echo "✅ Build complete."

build-contracts: ## Build only contracts
	@echo "🔨 Building contracts..."
	cd contracts && forge build
	@echo "✅ Contracts built."

build-frontend: ## Build only frontend
	@echo "🔨 Building frontend..."
	@npm run build
	@echo "✅ Frontend built."

# ─── Testing ────────────────────────────────────────────────────

test: ## Run all tests (contracts + frontend)
	@echo "🧪 Running contract tests..."
	cd contracts && forge test -vvv
	@echo "🧪 Running frontend tests..."
	@npm test
	@echo "✅ All tests passed."

test-contracts: ## Run only Foundry tests
	@echo "🧪 Running contract tests..."
	cd contracts && forge test -vvv
	@echo "✅ Contract tests passed."

test-frontend: ## Run only frontend tests
	@echo "🧪 Running frontend tests..."
	@npm test
	@echo "✅ Frontend tests passed."

# ─── Local Node ─────────────────────────────────────────────────

anvil: ## Start local Anvil node (port 8545)
	@echo "🔥 Starting Anvil node on http://127.0.0.1:8545..."
	cd contracts && anvil

# ─── Deployment ─────────────────────────────────────────────────

deploy-anvil: build-contracts ## Deploy contracts to local Anvil node
	@echo "🚀 Deploying contracts to Anvil..."
	@echo ""
	@read -s -p "Private key (hidden input): " key; \
	echo ""; \
	sender=$$(cast wallet address --private-key $$key); \
	echo "✅ Wallet: $$sender"; \
	echo "🔥 Network: Anvil (localhost:8545)"; \
	echo ""; \
	export SENDER=$$sender; \
	cd contracts && forge script script/Deploy.s.sol:Deploy \
		--rpc-url http://127.0.0.1:8545 \
		--broadcast \
		-vvv \
		--private-key $$key \
		--sender $$sender

deploy-sepolia: build-contracts ## Deploy contracts to Sepolia testnet
	@echo "🚀 Deploying contracts to Sepolia..."
	@echo ""
	@read -p "Sepolia RPC URL (default: https://rpc.sepolia.org): " rpc; \
	rpc=$${rpc:-https://rpc.sepolia.org}; \
	read -s -p "Private key (hidden input): " key; \
	echo ""; \
	sender=$$(cast wallet address --private-key $$key); \
	echo "✅ Wallet: $$sender"; \
	echo "⛓️  Network: Sepolia ($$rpc)"; \
	echo ""; \
	export SENDER=$$sender; \
	cd contracts && forge script script/Deploy.s.sol:Deploy \
		--rpc-url $$rpc \
		--broadcast \
		-vvv \
		--private-key $$key \
		--sender $$sender

# ─── Coverage ───────────────────────────────────────────────────

coverage: ## Generate Foundry coverage report
	@echo "📊 Generating coverage report..."
	cd contracts && forge coverage --report lcov
	@echo "✅ Coverage report generated."

# ─── Clean ──────────────────────────────────────────────────────

clean: ## Clean all build artifacts and dependencies
	@echo "🧹 Cleaning..."
	cd contracts && forge clean 2>/dev/null || true
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf node_modules
	@echo "✅ Clean complete."

clean-contracts: ## Clean only contract artifacts
	@echo "🧹 Cleaning contract artifacts..."
	cd contracts && forge clean
	@echo "✅ Contract artifacts cleaned."

clean-frontend: ## Clean only frontend artifacts
	@echo "🧹 Cleaning frontend artifacts..."
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	@echo "✅ Frontend artifacts cleaned."

# ─── Code Quality ───────────────────────────────────────────────

fmt: ## Format all code (Solidity + TypeScript)
	@echo "💅 Formatting Solidity..."
	cd contracts && forge fmt
	@echo "💅 Formatting frontend..."
	@npm run lint -- --fix 2>/dev/null || true
	@echo "✅ Formatting complete."

# ─── Frontend Development ──────────────────────────────────────

dev: install-frontend dev-frontend ## Install deps + start dev server

dev-frontend: ## Start frontend dev server (localhost:3000)
	@echo "🚀 Starting frontend dev server..."
	cd frontend && npm run dev

# ─── Production ────────────────────────────────────────────────

prod: build-frontend prod-frontend ## Build + serve production

prod-frontend: ## Serve production build (localhost:3000)
	@echo "🚀 Starting production server..."
	cd frontend && npm run start

# ─── Address Auto-Capture ──────────────────────────────────────

deploy-update: deploy-anvil ## Deploy to Anvil + auto-update frontend addresses
	@echo "📝 Updating frontend contract addresses..."
	@./scripts/update-addresses.sh 31337
	@echo "✅ Addresses updated! Run 'make dev-frontend' to start the app."

# ─── ABI Code Generation ───────────────────────────────────────

generate-abi: ## Generate type-safe wagmi hooks from contract ABIs
	@echo "🏗️  Generating wagmi CLI types..."
	cd frontend && npx wagmi generate
	@echo "✅ ABI types generated in frontend/src/lib/generated.ts"

# ─── Documentation ──────────────────────────────────────────────

docs: ## Serve documentation locally on port 3001
	@echo "📖 Serving docs at http://127.0.0.1:3001..."
	@cd docs && python3 -m http.server 3001 2>/dev/null || \
		python -m http.server 3001 2>/dev/null || \
		echo "⚠️  Python not found. Open docs/index.html directly in a browser."
