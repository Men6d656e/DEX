// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {MockDEX} from "../src/MockDEX.sol";

/**
 * @title DEXHandler
 * @notice Handler contract for Foundry invariant testing.
 *         All external functions generate fuzzed actions against MockDEX.
 *         Reverts are allowed (fail_on_revert = false in config).
 *         Invariants are checked after each action.
 */
contract DEXHandler is Test {
    // ── DEX & Tokens ────────────────────────────────────────────
    MockERC20 public mETH;
    MockERC20 public mBTC;
    MockERC20 public mUSDC;
    MockDEX public dex;

    // ── Constants ───────────────────────────────────────────────
    uint256 public constant INITIAL_ETH_RATE = 1700 * 10 ** 18;
    uint256 public constant INITIAL_BTC_RATE = 40000 * 10 ** 18;
    uint256 public constant LIQUIDITY_ETH = 100 * 10 ** 18;
    uint256 public constant LIQUIDITY_BTC = 5 * 10 ** 18;
    uint256 public constant LIQUIDITY_USDC = 370_000 * 10 ** 18;
    uint256 public constant MAX_ADD_ETH = 100 * 10 ** 18;
    uint256 public constant MAX_ADD_BTC = 5 * 10 ** 18;
    uint256 public constant MAX_ADD_USDC = 370_000 * 10 ** 18;

    // ── Actors ──────────────────────────────────────────────────
    address public user;
    address public user2;

    // ── Ghost tracking (optional, for extra assertions) ────────
    uint256 public totalActions;

    constructor() {
        user = makeAddr("invariantUser");
        user2 = makeAddr("invariantUser2");

        address tempFaucet = address(0xDEAD);

        // Deploy tokens
        mETH = new MockERC20("Mock ETH", "mETH", tempFaucet);
        mBTC = new MockERC20("Mock BTC", "mBTC", tempFaucet);
        mUSDC = new MockERC20("Mock USDC", "mUSDC", tempFaucet);

        // Deploy DEX (handler is the owner)
        dex = new MockDEX(
            address(mETH),
            address(mBTC),
            address(mUSDC),
            INITIAL_ETH_RATE,
            INITIAL_BTC_RATE
        );

        // Set handler as faucet for minting
        mETH.setFaucet(address(this));
        mBTC.setFaucet(address(this));
        mUSDC.setFaucet(address(this));

        // Mint tokens to handler for liquidity
        mETH.mint(address(this), LIQUIDITY_ETH + MAX_ADD_ETH);
        mBTC.mint(address(this), LIQUIDITY_BTC + MAX_ADD_BTC);
        mUSDC.mint(address(this), LIQUIDITY_USDC + MAX_ADD_USDC);

        // Approve DEX to spend handler's tokens
        mETH.approve(address(dex), type(uint256).max);
        mBTC.approve(address(dex), type(uint256).max);
        mUSDC.approve(address(dex), type(uint256).max);

        // Add initial liquidity
        dex.addLiquidity(LIQUIDITY_ETH, LIQUIDITY_BTC, LIQUIDITY_USDC);
    }

    // ═══════════════════════════════════════════════════════════
    // Actions (called by the invariant fuzzer)
    // ═══════════════════════════════════════════════════════════

    /// @notice Add liquidity to the DEX (onlyOwner — handler is owner)
    function addLiquidity(uint256 addEth, uint256 addBtc, uint256 addUsdc) public {
        addEth = bound(addEth, 0, MAX_ADD_ETH);
        addBtc = bound(addBtc, 0, MAX_ADD_BTC);
        addUsdc = bound(addUsdc, 0, MAX_ADD_USDC);
        if (addEth == 0 && addBtc == 0 && addUsdc == 0) return;

        // Handler is owner and has tokens + max approval from setUp
        dex.addLiquidity(addEth, addBtc, addUsdc);
        totalActions++;
    }

    /// @notice Swap ETH for USDC via a user account
    function swapETHForUSDC(uint256 ethAmount) public {
        ethAmount = bound(ethAmount, 1, _maxSwapableETHForUSDC());
        if (ethAmount == 0) return;

        _mintAndApprove(user, address(mETH), ethAmount);

        vm.prank(user);
        dex.swapETHForUSDC(ethAmount, 0);
        totalActions++;
    }

    /// @notice Swap USDC for ETH via a user account
    function swapUSDCForETH(uint256 usdcAmount) public {
        usdcAmount = bound(usdcAmount, 1, _maxSwapableUSDCForETH());
        if (usdcAmount == 0) return;

        _mintAndApprove(user, address(mUSDC), usdcAmount);

        vm.prank(user);
        dex.swapUSDCForETH(usdcAmount, 0);
        totalActions++;
    }

    /// @notice Swap BTC for USDC via a user account
    function swapBTCForUSDC(uint256 btcAmount) public {
        btcAmount = bound(btcAmount, 1, _maxSwapableBTCForUSDC());
        if (btcAmount == 0) return;

        _mintAndApprove(user, address(mBTC), btcAmount);

        vm.prank(user);
        dex.swapBTCForUSDC(btcAmount, 0);
        totalActions++;
    }

    /// @notice Swap USDC for BTC via a user account
    function swapUSDCForBTC(uint256 usdcAmount) public {
        usdcAmount = bound(usdcAmount, 1, _maxSwapableUsdcForBtc());
        if (usdcAmount == 0) return;

        _mintAndApprove(user, address(mUSDC), usdcAmount);

        vm.prank(user);
        dex.swapUSDCForBTC(usdcAmount, 0);
        totalActions++;
    }

    /// @notice Swap ETH for BTC via a user account
    function swapETHForBTC(uint256 ethAmount) public {
        ethAmount = bound(ethAmount, 1, _maxSwapableEthForBtc());
        if (ethAmount == 0) return;

        _mintAndApprove(user, address(mETH), ethAmount);

        vm.prank(user);
        dex.swapETHForBTC(ethAmount, 0);
        totalActions++;
    }

    /// @notice Swap BTC for ETH via a user account
    function swapBTCForETH(uint256 btcAmount) public {
        btcAmount = bound(btcAmount, 1, _maxSwapableBtcForEth());
        if (btcAmount == 0) return;

        _mintAndApprove(user, address(mBTC), btcAmount);

        vm.prank(user);
        dex.swapBTCForETH(btcAmount, 0);
        totalActions++;
    }

    /// @notice Complex multi-swap: ETH→BTC then BTC→ETH round-trip via user2
    function roundTripETHtoBTCtoETH(uint256 ethAmount) public {
        ethAmount = bound(ethAmount, 1, _maxSwapableEthForBtc());
        if (ethAmount == 0) return;

        _mintAndApprove(user2, address(mETH), ethAmount);

        // ETH → BTC
        vm.prank(user2);
        dex.swapETHForBTC(ethAmount, 0);
        uint256 btcReceived = mBTC.balanceOf(user2);

        if (btcReceived > 0) {
            // BTC → ETH (user2 already has BTC from the swap above)
            vm.prank(user2);
            mBTC.approve(address(dex), btcReceived);

            vm.prank(user2);
            dex.swapBTCForETH(btcReceived, 0);
        }
        totalActions++;
    }

    // ═══════════════════════════════════════════════════════════
    // Helpers
    // ═══════════════════════════════════════════════════════════

    /// @notice Mint tokens to an address and approve the DEX
    function _mintAndApprove(address to, address token, uint256 amount) internal {
        if (amount == 0) return;

        if (token == address(mETH)) {
            mETH.mint(to, amount);
        } else if (token == address(mBTC)) {
            mBTC.mint(to, amount);
        } else if (token == address(mUSDC)) {
            mUSDC.mint(to, amount);
        }

        vm.prank(to);
        MockERC20(token).approve(address(dex), amount);
    }

    // ── Max swap calculations ──────────────────────────────────

    function _maxSwapableETHForUSDC() internal view returns (uint256) {
        uint256 usdcReserve = dex.usdcReserve();
        if (usdcReserve == 0) return 0;
        return (usdcReserve * 1e18) / dex.ethSwapRate();
    }

    function _maxSwapableUSDCForETH() internal view returns (uint256) {
        uint256 ethReserve = dex.ethReserve();
        if (ethReserve == 0) return 0;
        return (ethReserve * dex.ethSwapRate()) / 1e18;
    }

    function _maxSwapableBTCForUSDC() internal view returns (uint256) {
        uint256 usdcReserve = dex.usdcReserve();
        if (usdcReserve == 0) return 0;
        return (usdcReserve * 1e18) / dex.btcSwapRate();
    }

    function _maxSwapableUsdcForBtc() internal view returns (uint256) {
        uint256 btcReserve = dex.btcReserve();
        if (btcReserve == 0) return 0;
        return (btcReserve * dex.btcSwapRate()) / 1e18;
    }

    function _maxSwapableEthForBtc() internal view returns (uint256) {
        uint256 btcReserve = dex.btcReserve();
        if (btcReserve == 0 || dex.btcSwapRate() == 0) return 0;
        uint256 maxUsdc = (btcReserve * dex.btcSwapRate()) / 1e18;
        if (maxUsdc == 0) return 0;
        return (maxUsdc * 1e18) / dex.ethSwapRate();
    }

    function _maxSwapableBtcForEth() internal view returns (uint256) {
        uint256 ethReserve = dex.ethReserve();
        if (ethReserve == 0 || dex.ethSwapRate() == 0) return 0;
        uint256 maxUsdc = (ethReserve * dex.ethSwapRate()) / 1e18;
        if (maxUsdc == 0) return 0;
        return (maxUsdc * 1e18) / dex.btcSwapRate();
    }
}

/**
 * @title MockDEXInvariantTest
 * @notice Invariant tests verifying MockDEX state consistency.
 *
 * Core invariants:
 * 1. DEX token balance == tracked reserves for each token (no token leaks)
 * 2. These must hold after ANY sequence of swap/addLiquidity calls
 *
 * Config: forge test --contracts test/MockDEX.invariant.t.sol
 */
contract MockDEXInvariantTest is StdInvariant, Test {
    DEXHandler public handler;

    function setUp() public {
        handler = new DEXHandler();
        // Target the handler — Foundry will call its external functions in random sequences
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = handler.addLiquidity.selector;
        selectors[1] = handler.swapETHForUSDC.selector;
        selectors[2] = handler.swapUSDCForETH.selector;
        selectors[3] = handler.swapBTCForUSDC.selector;
        selectors[4] = handler.swapUSDCForBTC.selector;
        selectors[5] = handler.swapETHForBTC.selector;
        selectors[6] = handler.swapBTCForETH.selector;
        selectors[7] = handler.roundTripETHtoBTCtoETH.selector;

        targetContract(address(handler));
        targetSender(address(this));
    }

    // ═══════════════════════════════════════════════════════════
    // Invariants
    // ═══════════════════════════════════════════════════════════

    /// @notice DEX's mETH balance must always match its tracked ethReserve
    function invariant_ethReserve_matches_balance() public {
        assertEq(
            handler.dex().ethReserve(),
            handler.mETH().balanceOf(address(handler.dex()))
        );
    }

    /// @notice DEX's mBTC balance must always match its tracked btcReserve
    function invariant_btcReserve_matches_balance() public {
        assertEq(
            handler.dex().btcReserve(),
            handler.mBTC().balanceOf(address(handler.dex()))
        );
    }

    /// @notice DEX's mUSDC balance must always match its tracked usdcReserve
    function invariant_usdcReserve_matches_balance() public {
        assertEq(
            handler.dex().usdcReserve(),
            handler.mUSDC().balanceOf(address(handler.dex()))
        );
    }

    /// @notice No reserve can ever exceed its corresponding token balance in the DEX
    ///         (stronger form: reserves are exactly the balance, never less either)
    function invariant_reserve_never_exceeds_balance() public {
        assertLe(
            handler.dex().ethReserve(),
            handler.mETH().balanceOf(address(handler.dex()))
        );
        assertLe(
            handler.dex().btcReserve(),
            handler.mBTC().balanceOf(address(handler.dex()))
        );
        assertLe(
            handler.dex().usdcReserve(),
            handler.mUSDC().balanceOf(address(handler.dex()))
        );
    }
}
