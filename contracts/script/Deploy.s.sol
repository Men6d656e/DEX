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
 * 4. Faucet — Time-locked faucet for mETH and mBTC
 * 5. MockDEX — Ratio-based DEX for mETH ↔ mUSDC swaps
 *
 * Usage:
 *   Anvil:   forge script script/Deploy.s.sol:Deploy --rpc-url http://127.0.0.1:8545 --broadcast --interactives 1
 *   Sepolia: forge script script/Deploy.s.sol:Deploy --rpc-url $SEPOLIA_RPC_URL --broadcast --interactives 1
 *
 * The script outputs contract addresses which should be copied to the frontend config.
 */
contract Deploy is Script {
    // ── Constants ────────────────────────────────────────────────

    /// @notice Initial swap rate: 1 mETH = 1700 mUSDC (scaled by 1e18)
    uint256 public constant INITIAL_SWAP_RATE = 1700 * 10 ** 18;

    /// @notice Initial mETH liquidity for the DEX
    uint256 public constant INITIAL_ETH_LIQUIDITY = 100 * 10 ** 18;

    /// @notice Initial mUSDC liquidity for the DEX (100 * 1700 = 170,000)
    uint256 public constant INITIAL_USDC_LIQUIDITY = 170_000 * 10 ** 18;

    // --- Run ------------------------------------------------------------------

    /// @notice Main deployment entry point.
    ///         Called by `forge script`.
    function run() external {
        // --- Setup ---
        // The deployer's private key is prompted via --interactives 1
        // and is accessible through vm.envUint("PRIVATE_KEY")
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("============================================");
        console2.log("DEX Dashboard - Contract Deployment");
        console2.log("============================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Block:   ", block.number);
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

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

        Faucet faucet = new Faucet(address(mETH), address(mBTC));
        console2.log("Faucet deployed at:", address(faucet));
        console2.log("");

        // --- Step 3: Deploy MockDEX ---
        console2.log("--- Step 3: Deploying MockDEX ---");

        MockDEX dex = new MockDEX(
            address(mETH),
            address(mUSDC),
            INITIAL_SWAP_RATE
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
        console2.log("Minted tokens to deployer for liquidity");

        // Approve DEX to spend deployer's tokens
        mETH.approve(address(dex), INITIAL_ETH_LIQUIDITY);
        mUSDC.approve(address(dex), INITIAL_USDC_LIQUIDITY);
        console2.log("Approved DEX to spend tokens");

        // Add liquidity to the DEX
        dex.addLiquidity(INITIAL_ETH_LIQUIDITY, INITIAL_USDC_LIQUIDITY);
        console2.log("Added liquidity: 100 mETH + 170,000 mUSDC");
        console2.log("");

        // --- Step 5: Configure Token Faucet Addresses ---
        // Now it's safe to point mETH/mBTC faucets to the real Faucet contract.
        // mUSDC faucet remains as deployer (for future liquidity if needed).
        console2.log("--- Step 5: Configuring Faucet Addresses ---");

        mETH.setFaucet(address(faucet));
        console2.log("mETH faucet  ->", address(faucet));

        mBTC.setFaucet(address(faucet));
        console2.log("mBTC faucet  ->", address(faucet));
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

        console2.log("Swap Rate: 1 mETH = 1700 mUSDC");
        console2.log("Faucet Claim Amount: 10 tokens (per claim)");
        console2.log("Faucet Cooldown: 24 hours");
        console2.log("");
        console2.log("============================================");
    }
}
