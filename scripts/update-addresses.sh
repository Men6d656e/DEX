#!/usr/bin/env bash
# ============================================================
# Contract Address Auto-Capture Script
# ============================================================
# 
# After running `make deploy-anvil` or `make deploy-sepolia`,
# run this script to extract the deployed contract addresses
# from the forge broadcast JSON and update constants.ts.
#
# Usage:
#   ./scripts/update-addresses.sh [chain-id]
#
#   chain-id defaults to 31337 (Anvil). Use 11155111 for Sepolia.
#
# Example:
#   make deploy-anvil
#   ./scripts/update-addresses.sh
#
# ============================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHAIN_ID="${1:-31337}"
BROADCAST_FILE="${PROJECT_ROOT}/contracts/broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"
CONSTANTS_FILE="${PROJECT_ROOT}/frontend/src/lib/constants.ts"

# ── Validate ──────────────────────────────────────────────────
if [ ! -f "$BROADCAST_FILE" ]; then
    echo "❌ Broadcast file not found: ${BROADCAST_FILE}"
    echo ""
    echo "Make sure you have run 'make deploy-anvil' or 'make deploy-sepolia' first."
    exit 1
fi

if [ ! -f "$CONSTANTS_FILE" ]; then
    echo "❌ Constants file not found: ${CONSTANTS_FILE}"
    exit 1
fi

echo "📖 Reading deployment from: ${BROADCAST_FILE}"

# ── Extract addresses from broadcast JSON ─────────────────────
# Parse the broadcast JSON to extract contract addresses
# MockERC20 is deployed 3 times (mETH, mBTC, mUSDC)
# We match by the order they appear in the deploy script:
#   1st MockERC20 = mETH
#   2nd MockERC20 = mBTC
#   3rd MockERC20 = mUSDC
#   Faucet = Faucet
#   MockDEX = MockDEX

METH_ADDR=$(python3 -c "
import json
with open('${BROADCAST_FILE}') as f:
    data = json.load(f)
txs = [t for t in data['transactions'] if t.get('contractName') == 'MockERC20']
print(txs[0]['contractAddress'] if len(txs) > 0 else '0x0000000000000000000000000000000000000000')
")

MBTC_ADDR=$(python3 -c "
import json
with open('${BROADCAST_FILE}') as f:
    data = json.load(f)
txs = [t for t in data['transactions'] if t.get('contractName') == 'MockERC20']
print(txs[1]['contractAddress'] if len(txs) > 1 else '0x0000000000000000000000000000000000000000')
")

MUSDC_ADDR=$(python3 -c "
import json
with open('${BROADCAST_FILE}') as f:
    data = json.load(f)
txs = [t for t in data['transactions'] if t.get('contractName') == 'MockERC20']
print(txs[2]['contractAddress'] if len(txs) > 2 else '0x0000000000000000000000000000000000000000')
")

FAUCET_ADDR=$(python3 -c "
import json
with open('${BROADCAST_FILE}') as f:
    data = json.load(f)
for t in data['transactions']:
    if t.get('contractName') == 'Faucet':
        print(t['contractAddress'])
        break
")

DEX_ADDR=$(python3 -c "
import json
with open('${BROADCAST_FILE}') as f:
    data = json.load(f)
for t in data['transactions']:
    if t.get('contractName') == 'MockDEX':
        print(t['contractAddress'])
        break
")

# ── Validate ──────────────────────────────────────────────────
if [ "$METH_ADDR" = "0x0000000000000000000000000000000000000000" ] || [ -z "$METH_ADDR" ]; then
    echo "⚠️  Could not extract mETH address. Check broadcast file."
fi

if [ -z "$FAUCET_ADDR" ]; then
    echo "⚠️  Could not extract Faucet address. Check broadcast file."
fi

if [ -z "$DEX_ADDR" ]; then
    echo "⚠️  Could not extract DEX address. Check broadcast file."
fi

echo ""
echo "📋 Extracted addresses:"
echo "  mETH:   ${METH_ADDR}"
echo "  mBTC:   ${MBTC_ADDR}"
echo "  mUSDC:  ${MUSDC_ADDR}"
echo "  faucet: ${FAUCET_ADDR}"
echo "  dex:    ${DEX_ADDR}"
echo ""

# ── Update constants.ts ──────────────────────────────────────
echo "📝 Updating ${CONSTANTS_FILE}..."

# Use sed to replace the address lines in constants.ts
sed -i "s/  mETH: \"0x[a-fA-F0-9]\{40\}\"/  mETH: \"${METH_ADDR}\"/" "$CONSTANTS_FILE"
sed -i "s/  mBTC: \"0x[a-fA-F0-9]\{40\}\"/  mBTC: \"${MBTC_ADDR}\"/" "$CONSTANTS_FILE"
sed -i "s/  mUSDC: \"0x[a-fA-F0-9]\{40\}\"/  mUSDC: \"${MUSDC_ADDR}\"/" "$CONSTANTS_FILE"
sed -i "s/  faucet: \"0x[a-fA-F0-9]\{40\}\"/  faucet: \"${FAUCET_ADDR}\"/" "$CONSTANTS_FILE"
sed -i "s/  dex: \"0x[a-fA-F0-9]\{40\}\"/  dex: \"${DEX_ADDR}\"/" "$CONSTANTS_FILE"

echo "✅ Contract addresses updated in constants.ts!"
echo ""
echo "Next steps:"
echo "  1. cd frontend && npm run dev"
echo "  2. Open http://localhost:3000"
echo ""
