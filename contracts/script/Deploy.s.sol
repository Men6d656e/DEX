// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {Faucet} from "../src/Faucet.sol";
import {MockDEX} from "../src/MockDEX.sol";

/**
 * @title Deploy
 * @notice Deployment script for the DEX Dashboard.
 *
 * Deploys the following contracts:
 * 1. MockERC20 (mETH) — Mock ETH token
 * 2. MockERC20 (mBTC) — Mock BTC token
 * 3. MockERC20 (mUSDC) — Mock USDC token (used for swap)
 * 4. Faucet — Time-locked faucet for mETH, mBTC, and mUSDC
 * 5. MockDEX — Ratio-based DEX for mETH ↔ mUSDC and mBTC ↔ mUSDC swaps
 *
 * Usage:
 *   export SENDER=0xYourWalletAddress
 *   Anvil:   forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast --interactives 1 --sender $SENDER
 *   Sepolia: forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast --interactives 1 --sender $SENDER
 *
 * Note: --interactives 1 prompts for the PRIVATE KEY to sign transactions.
 *       SENDER env var + --sender flag provides the public address for the script.
 *       Do NOT set PRIVATE_KEY in a .env file when using --interactives.
 *
 * The script outputs contract addresses which should be copied to the frontend config.
 */
contract Deploy is Script {
    // ── Constants ────────────────────────────────────────────────

    /// @notice Initial ETH swap rate: 1 mETH = 1700 mUSDC (scaled by 1e18)
    uint256 public constant INITIAL_ETH_SWAP_RATE = 1700 * 10 ** 18;

    /// @notice Initial BTC swap rate: 1 mBTC = 40000 mUSDC (scaled by 1e18)
    uint256 public constant INITIAL_BTC_SWAP_RATE = 40_000 * 10 ** 18;

    /// @notice Initial mETH liquidity for the DEX
    uint256 public constant INITIAL_ETH_LIQUIDITY = 100 * 10 ** 18;

    /// @notice Initial mBTC liquidity for the DEX
    uint256 public constant INITIAL_BTC_LIQUIDITY = 5 * 10 ** 18;

    /// @notice Initial mUSDC liquidity for the DEX (100*1700 + 5*40000 = 370,000)
    uint256 public constant INITIAL_USDC_LIQUIDITY = 370_000 * 10 ** 18;

    // --- Run ------------------------------------------------------------------

    /// @notice Main deployment entry point.
    ///         Called by `forge script`.
    function run() external {
        // --- Setup ---
        // The deployer's public address is read from the SENDER env var
        // (set via `export SENDER=0x...` or passed via Makefile).
        // The private key is provided securely via --interactives 1 at the CLI.
        // These are two separate mechanisms — never use vm.envUint("PRIVATE_KEY")
        // with --interactives because the interactive prompt doesn't set env vars.
        address deployer = vm.envAddress("SENDER");

        console2.log("============================================");
        console2.log("DEX Dashboard - Contract Deployment");
        console2.log("============================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Block:   ", block.number);
        console2.log("");

        // startBroadcast with no args — uses the key from --interactives 1 for signing
        vm.startBroadcast();

        // --- Step 1: Deploy Mock Tokens ---
        // Use deployer as temporary faucet; will update after Faucet is deployed
        console2.log("--- Step 1: Deploying Mock Tokens ---");

        MockERC20 mETH = new MockERC20("Mock ETH", "mETH", deployer);
        console2.log("mETH  deployed at:", address(mETH));

        MockERC20 mBTC = new MockERC20("Mock BTC", "mBTC", deployer);
        console2.log("mBTC  deployed at:", address(mBTC));

        MockERC20 mUSDC = new MockERC20("Mock USDC", "mUSDC", deployer);
        console2.log("mUSDC deployed at:", address(mUSDC));
        console2.log("");

        // --- Step 2: Deploy Faucet ---
        console2.log("--- Step 2: Deploying Faucet ---");

        Faucet faucet = new Faucet(address(mETH), address(mBTC), address(mUSDC));
        console2.log("Faucet deployed at:", address(faucet));
        console2.log("");

        // --- Step 3: Deploy MockDEX ---
        console2.log("--- Step 3: Deploying MockDEX ---");

        MockDEX dex = new MockDEX(
            address(mETH),
            address(mBTC),
            address(mUSDC),
            INITIAL_ETH_SWAP_RATE,
            INITIAL_BTC_SWAP_RATE
        );
        console2.log("MockDEX deployed at:", address(dex));
        console2.log("");

        // --- Step 4: Add Initial Liquidity to DEX ---
        // IMPORTANT: This must happen BEFORE updating faucet addresses (Step 5)
        // because deployer is still the faucet for all tokens at this point.
        console2.log("--- Step 4: Adding Initial Liquidity ---");

        // Mint tokens to deployer for DEX liquidity
        // Deployer is still the faucet for mETH, mBTC, mUSDC (not yet updated)
        mUSDC.mint(deployer, INITIAL_USDC_LIQUIDITY);
        mETH.mint(deployer, INITIAL_ETH_LIQUIDITY);
        mBTC.mint(deployer, INITIAL_BTC_LIQUIDITY);
        console2.log("Minted tokens to deployer for liquidity");

        // Approve DEX to spend deployer's tokens
        mETH.approve(address(dex), INITIAL_ETH_LIQUIDITY);
        mBTC.approve(address(dex), INITIAL_BTC_LIQUIDITY);
        mUSDC.approve(address(dex), INITIAL_USDC_LIQUIDITY);
        console2.log("Approved DEX to spend tokens");

        // Add liquidity to the DEX
        dex.addLiquidity(INITIAL_ETH_LIQUIDITY, INITIAL_BTC_LIQUIDITY, INITIAL_USDC_LIQUIDITY);
        console2.log("Added liquidity: 100 mETH + 5 mBTC + 370,000 mUSDC");
        console2.log("");

        // --- Step 5: Configure Token Faucet Addresses ---
        // Now it's safe to point mETH/mBTC faucets to the real Faucet contract.
        // mUSDC faucet remains as deployer (for future liquidity if needed).
        console2.log("--- Step 5: Configuring Faucet Addresses ---");

        mETH.setFaucet(address(faucet));
        console2.log("mETH faucet  ->", address(faucet));

        mBTC.setFaucet(address(faucet));
        console2.log("mBTC faucet  ->", address(faucet));

        mUSDC.setFaucet(address(faucet));
        console2.log("mUSDC faucet ->", address(faucet));
        console2.log("");

        vm.stopBroadcast();

        // --- Step 6: Output Summary ---
        console2.log("============================================");
        console2.log("Deployment Complete");
        console2.log("============================================");
        console2.log("");

        // Print addresses in a JSON-like format for easy frontend consumption
        console2.log("--- Frontend Config (copy these addresses) ---");
        console2.log("{");
        console2.log(string.concat('  "mETH":   "', vm.toString(address(mETH)), '",'));
        console2.log(string.concat('  "mBTC":   "', vm.toString(address(mBTC)), '",'));
        console2.log(string.concat('  "mUSDC":  "', vm.toString(address(mUSDC)), '",'));
        console2.log(string.concat('  "faucet": "', vm.toString(address(faucet)), '",'));
        console2.log(string.concat('  "dex":    "', vm.toString(address(dex)), '"'));
        console2.log("}");
        console2.log("");

        console2.log("Swap Rate (ETH): 1 mETH = 1700 mUSDC");
        console2.log("Swap Rate (BTC): 1 mBTC = 40000 mUSDC");
        console2.log("Faucet Claim Amount: 10 tokens (per claim)");
        console2.log("Faucet Cooldown: 24 hours");
        console2.log("");
        console2.log("============================================");
    }
}
