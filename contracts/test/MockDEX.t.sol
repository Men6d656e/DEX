// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {MockDEX} from "../src/MockDEX.sol";

/**
 * @title MockDEXTest
 * @notice Comprehensive unit and fuzz tests for MockDEX.
 *
 * Coverage targets:
 * - Constructor: token setup, rate, zero-address revert
 * - addLiquidity: successful addition, zero-amount revert, reserve updates, event
 * - swapETHForUSDC: successful swap, slippage protection, insufficient liquidity, event
 * - swapUSDCForETH: successful swap, slippage protection, insufficient liquidity
 * - setRate: successful update, onlyOwner restriction, zero-rate revert
 * - getRate: returns current rate
 * - Fuzz tests: swap invariants with bound()
 */
contract MockDEXTest is Test {
    // ============================================================
    // Test State
    // ============================================================

    MockERC20 public mETH;
    MockERC20 public mUSDC;
    MockDEX public dex;

    address public owner;
    address public user;
    address public user2;

    uint256 public constant INITIAL_RATE = 1700 * 10 ** 18; // 1 mETH = 1700 mUSDC
    uint256 public constant LIQUIDITY_ETH = 100 * 10 ** 18;
    uint256 public constant LIQUIDITY_USDC = 170_000 * 10 ** 18; // 100 * 1700

    // ============================================================
    // Events
    // ============================================================

    event LiquidityAdded(
        address indexed provider,
        uint256 ethAmount,
        uint256 usdcAmount
    );
    event Swapped(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut
    );
    event RateUpdated(uint256 oldRate, uint256 newRate);

    // ============================================================
    // Setup
    // ============================================================

    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");
        user2 = makeAddr("user2");

        address tempFaucet = address(0xDEAD);

        // Deploy tokens with temporary faucet
        vm.prank(owner);
        mETH = new MockERC20("Mock ETH", "mETH", tempFaucet);

        vm.prank(owner);
        mUSDC = new MockERC20("Mock USDC", "mUSDC", tempFaucet);

        // Deploy DEX
        vm.prank(owner);
        dex = new MockDEX(address(mETH), address(mUSDC), INITIAL_RATE);

        // Set owner as faucet for minting
        vm.prank(owner);
        mETH.setFaucet(owner);
        vm.prank(owner);
        mUSDC.setFaucet(owner);

        // Mint tokens to owner for liquidity
        vm.startPrank(owner);
        mETH.mint(owner, LIQUIDITY_ETH * 2);
        mUSDC.mint(owner, LIQUIDITY_USDC * 2);
        vm.stopPrank();

        // Approve DEX to spend owner's tokens
        vm.startPrank(owner);
        mETH.approve(address(dex), type(uint256).max);
        mUSDC.approve(address(dex), type(uint256).max);
        vm.stopPrank();

        // Add initial liquidity
        vm.prank(owner);
        dex.addLiquidity(LIQUIDITY_ETH, LIQUIDITY_USDC);
    }

    // ============================================================
    // Constructor Tests
    // ============================================================

    /// @notice Test constructor sets tokens correctly
    function test_Constructor_SetsTokens() public view {
        assertEq(address(dex.mETH()), address(mETH));
        assertEq(address(dex.mUSDC()), address(mUSDC));
    }

    /// @notice Test constructor sets initial rate
    function test_Constructor_SetsInitialRate() public view {
        assertEq(dex.swapRate(), INITIAL_RATE);
    }

    /// @notice Test constructor sets owner
    function test_Constructor_SetsOwner() public view {
        assertEq(dex.owner(), owner);
    }

    /// @notice Test constructor reverts when mETH is zero
    function test_Constructor_RevertWhen_METHZero() public {
        vm.prank(owner);
        vm.expectRevert(MockDEX.MockDEX__InvalidAddress.selector);
        new MockDEX(address(0), address(mUSDC), INITIAL_RATE);
    }

    /// @notice Test constructor reverts when mUSDC is zero
    function test_Constructor_RevertWhen_MUSDCZero() public {
        vm.prank(owner);
        vm.expectRevert(MockDEX.MockDEX__InvalidAddress.selector);
        new MockDEX(address(mETH), address(0), INITIAL_RATE);
    }

    /// @notice Test constructor reverts when rate is zero
    function test_Constructor_RevertWhen_ZeroRate() public {
        vm.prank(owner);
        vm.expectRevert(MockDEX.MockDEX__InvalidRate.selector);
        new MockDEX(address(mETH), address(mUSDC), 0);
    }

    // ============================================================
    // addLiquidity Tests
    // ============================================================

    /// @notice Test owner can add liquidity
    function test_AddLiquidity_OwnerCanAdd() public {
        uint256 addEth = 10 * 10 ** 18;
        uint256 addUsdc = 17_000 * 10 ** 18;

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit LiquidityAdded(owner, addEth, addUsdc);
        dex.addLiquidity(addEth, addUsdc);

        assertEq(dex.ethReserve(), LIQUIDITY_ETH + addEth);
        assertEq(dex.usdcReserve(), LIQUIDITY_USDC + addUsdc);
        assertEq(mETH.balanceOf(address(dex)), LIQUIDITY_ETH + addEth);
        assertEq(mUSDC.balanceOf(address(dex)), LIQUIDITY_USDC + addUsdc);
    }

    /// @notice Test addLiquidity reverts with zero amounts
    function test_AddLiquidity_RevertWhen_ZeroAmounts() public {
        vm.prank(owner);
        vm.expectRevert(MockDEX.MockDEX__ZeroAmount.selector);
        dex.addLiquidity(0, 0);
    }

    /// @notice Test addLiquidity accepts one token at a time (ETH only)
    function test_AddLiquidity_OnlyETH() public {
        uint256 addEth = 5 * 10 ** 18;

        vm.prank(owner);
        dex.addLiquidity(addEth, 0);

        assertEq(dex.ethReserve(), LIQUIDITY_ETH + addEth);
        assertEq(dex.usdcReserve(), LIQUIDITY_USDC);
    }

    /// @notice Test addLiquidity accepts one token at a time (USDC only)
    function test_AddLiquidity_OnlyUSDC() public {
        uint256 addUsdc = 8_500 * 10 ** 18;

        vm.prank(owner);
        dex.addLiquidity(0, addUsdc);

        assertEq(dex.ethReserve(), LIQUIDITY_ETH);
        assertEq(dex.usdcReserve(), LIQUIDITY_USDC + addUsdc);
    }

    /// @notice Test addLiquidity reverts when called by non-owner
    function test_AddLiquidity_RevertWhen_NotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        dex.addLiquidity(10, 10);
    }

    // ============================================================
    // swapETHForUSDC Tests
    // ============================================================

    /// @notice Test successful swap ETH for USDC
    function test_SwapETHForUSDC() public {
        uint256 swapAmount = 1 * 10 ** 18; // 1 mETH
        uint256 expectedOutput = (swapAmount * INITIAL_RATE) / 1e18;

        // Mint mETH to user and approve
        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit Swapped(user, address(mETH), address(mUSDC), swapAmount, expectedOutput);
        dex.swapETHForUSDC(swapAmount, 0);

        assertEq(mUSDC.balanceOf(user), expectedOutput);
        assertEq(dex.ethReserve(), LIQUIDITY_ETH + swapAmount);
        assertEq(dex.usdcReserve(), LIQUIDITY_USDC - expectedOutput);
    }

    /// @notice Test swapETHForUSDC with slippage protection
    function test_SwapETHForUSDC_WithMinOutput() public {
        uint256 swapAmount = 1 * 10 ** 18;
        uint256 expectedOutput = (swapAmount * INITIAL_RATE) / 1e18;

        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        // Should succeed with exact minimum
        vm.prank(user);
        dex.swapETHForUSDC(swapAmount, expectedOutput);

        assertEq(mUSDC.balanceOf(user), expectedOutput);
    }

    /// @notice Test swapETHForUSDC reverts with slippage exceeded
    function test_SwapETHForUSDC_RevertWhen_SlippageExceeded() public {
        uint256 swapAmount = 1 * 10 ** 18;
        uint256 expectedOutput = (swapAmount * INITIAL_RATE) / 1e18;

        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        // Expect revert because min is higher than actual output
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                MockDEX.MockDEX__SlippageExceeded.selector,
                expectedOutput,
                expectedOutput + 1
            )
        );
        dex.swapETHForUSDC(swapAmount, expectedOutput + 1);
    }

    /// @notice Test swapETHForUSDC reverts with zero amount
    function test_SwapETHForUSDC_RevertWhen_ZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(MockDEX.MockDEX__ZeroAmount.selector);
        dex.swapETHForUSDC(0, 0);
    }

    /// @notice Test swapETHForUSDC reverts with insufficient liquidity
    function test_SwapETHForUSDC_RevertWhen_InsufficientLiquidity() public {
        uint256 swapAmount = LIQUIDITY_USDC * 2; // More than USDC reserve

        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        vm.prank(user);
        vm.expectRevert(MockDEX.MockDEX__InsufficientLiquidity.selector);
        dex.swapETHForUSDC(swapAmount, 0);
    }

    // ============================================================
    // swapUSDCForETH Tests
    // ============================================================

    /// @notice Test successful swap USDC for ETH
    function test_SwapUSDCForETH() public {
        uint256 swapAmount = 1700 * 10 ** 18; // 1700 mUSDC
        uint256 expectedOutput = (swapAmount * 1e18) / INITIAL_RATE; // 1 mETH

        // Mint mUSDC to user and approve
        vm.prank(owner);
        mUSDC.mint(user, swapAmount);

        vm.prank(user);
        mUSDC.approve(address(dex), swapAmount);

        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit Swapped(user, address(mUSDC), address(mETH), swapAmount, expectedOutput);
        dex.swapUSDCForETH(swapAmount, 0);

        assertEq(mETH.balanceOf(user), expectedOutput);
        assertEq(dex.usdcReserve(), LIQUIDITY_USDC + swapAmount);
        assertEq(dex.ethReserve(), LIQUIDITY_ETH - expectedOutput);
    }

    /// @notice Test swapUSDCForETH with exact minimum
    function test_SwapUSDCForETH_WithMinOutput() public {
        uint256 swapAmount = 1700 * 10 ** 18;
        uint256 expectedOutput = (swapAmount * 1e18) / INITIAL_RATE;

        vm.prank(owner);
        mUSDC.mint(user, swapAmount);

        vm.prank(user);
        mUSDC.approve(address(dex), swapAmount);

        vm.prank(user);
        dex.swapUSDCForETH(swapAmount, expectedOutput);

        assertEq(mETH.balanceOf(user), expectedOutput);
    }

    /// @notice Test swapUSDCForETH reverts with slippage exceeded
    function test_SwapUSDCForETH_RevertWhen_SlippageExceeded() public {
        uint256 swapAmount = 1700 * 10 ** 18;
        uint256 expectedOutput = (swapAmount * 1e18) / INITIAL_RATE;

        vm.prank(owner);
        mUSDC.mint(user, swapAmount);

        vm.prank(user);
        mUSDC.approve(address(dex), swapAmount);

        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                MockDEX.MockDEX__SlippageExceeded.selector,
                expectedOutput,
                expectedOutput + 1
            )
        );
        dex.swapUSDCForETH(swapAmount, expectedOutput + 1);
    }

    /// @notice Test swapUSDCForETH reverts with zero amount
    function test_SwapUSDCForETH_RevertWhen_ZeroAmount() public {
        vm.prank(user);
        vm.expectRevert(MockDEX.MockDEX__ZeroAmount.selector);
        dex.swapUSDCForETH(0, 0);
    }

    /// @notice Test swapUSDCForETH reverts with insufficient liquidity
    function test_SwapUSDCForETH_RevertWhen_InsufficientLiquidity() public {
        uint256 swapAmount = LIQUIDITY_ETH * 2 * INITIAL_RATE; // More than ETH reserve

        vm.prank(owner);
        mUSDC.mint(user, swapAmount);

        vm.prank(user);
        mUSDC.approve(address(dex), swapAmount);

        vm.prank(user);
        vm.expectRevert(MockDEX.MockDEX__InsufficientLiquidity.selector);
        dex.swapUSDCForETH(swapAmount, 0);
    }

    // ============================================================
    // getRate Tests
    // ============================================================

    /// @notice Test getRate returns initial rate
    function test_GetRate_ReturnsInitialRate() public view {
        assertEq(dex.getRate(), INITIAL_RATE);
    }

    // ============================================================
    // setRate Tests
    // ============================================================

    /// @notice Test owner can update rate
    function test_SetRate_OwnerCanUpdate() public {
        uint256 newRate = 2000 * 10 ** 18;

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit RateUpdated(INITIAL_RATE, newRate);
        dex.setRate(newRate);

        assertEq(dex.swapRate(), newRate);
        assertEq(dex.getRate(), newRate);
    }

    /// @notice Test new rate affects swaps
    function test_SetRate_AffectsSwaps() public {
        uint256 newRate = 2000 * 10 ** 18;
        uint256 swapAmount = 1 * 10 ** 18;
        uint256 expectedOutput = (swapAmount * newRate) / 1e18;

        vm.prank(owner);
        dex.setRate(newRate);

        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        vm.prank(user);
        dex.swapETHForUSDC(swapAmount, 0);

        assertEq(mUSDC.balanceOf(user), expectedOutput);
    }

    /// @notice Test setRate reverts with zero
    function test_SetRate_RevertWhen_Zero() public {
        vm.prank(owner);
        vm.expectRevert(MockDEX.MockDEX__InvalidRate.selector);
        dex.setRate(0);
    }

    /// @notice Test setRate reverts when called by non-owner
    function test_SetRate_RevertWhen_NotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        dex.setRate(500 * 10 ** 18);
    }

    // ============================================================
    // Edge Cases
    // ============================================================

    /// @notice Test multiple swaps from different users
    function test_EdgeCase_MultipleUsersSwap() public {
        uint256 swapAmount = 1 * 10 ** 18;

        // Mint tokens to both users
        vm.startPrank(owner);
        mETH.mint(user, swapAmount);
        mETH.mint(user2, swapAmount);
        vm.stopPrank();

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);
        vm.prank(user2);
        mETH.approve(address(dex), swapAmount);

        vm.prank(user);
        dex.swapETHForUSDC(swapAmount, 0);

        vm.prank(user2);
        dex.swapETHForUSDC(swapAmount, 0);

        uint256 expectedOutput = (swapAmount * INITIAL_RATE) / 1e18;
        assertEq(mUSDC.balanceOf(user), expectedOutput);
        assertEq(mUSDC.balanceOf(user2), expectedOutput);
    }

    /// @notice Test swap back and forth (ETH→USDC→ETH)
    function test_EdgeCase_SwapRoundTrip() public {
        uint256 swapAmount = 1 * 10 ** 18;

        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        // Swap ETH → USDC
        vm.prank(user);
        dex.swapETHForUSDC(swapAmount, 0);

        uint256 usdcReceived = mUSDC.balanceOf(user);
        assertGt(usdcReceived, 0);

        // Swap USDC → ETH
        vm.prank(user);
        mUSDC.approve(address(dex), usdcReceived);

        vm.prank(user);
        dex.swapUSDCForETH(usdcReceived, 0);

        // Should get approximately the same amount back (minus rounding)
        uint256 ethReceived = mETH.balanceOf(user);
        assertApproxEqAbs(ethReceived, swapAmount, 1); // 1 wei rounding tolerance
    }

    // ============================================================
    // Fuzz Tests
    // ============================================================

    /// @notice Fuzz test: swapETHForUSDC output is always rate * amount / 1e18
    /// @param swapAmount The amount of mETH to swap (bounded by reserves)
    function testFuzz_SwapETHForUSDC_OutputMatchesRate(
        uint256 swapAmount
    ) public {
        // Bound swapAmount to available USDC liquidity
        swapAmount = bound(swapAmount, 1, LIQUIDITY_USDC * 1e18 / INITIAL_RATE);

        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        vm.prank(user);
        dex.swapETHForUSDC(swapAmount, 0);

        uint256 expectedOutput = (swapAmount * INITIAL_RATE) / 1e18;
        assertEq(mUSDC.balanceOf(user), expectedOutput);
    }

    /// @notice Fuzz test: swapUSDCForETH output is always amount * 1e18 / rate
    /// @param swapAmount The amount of mUSDC to swap (bounded by reserves)
    function testFuzz_SwapUSDCForETH_OutputMatchesRate(
        uint256 swapAmount
    ) public {
        // Bound swapAmount to available ETH liquidity
        swapAmount = bound(swapAmount, 1, LIQUIDITY_ETH * INITIAL_RATE / 1e18);

        vm.prank(owner);
        mUSDC.mint(user, swapAmount);

        vm.prank(user);
        mUSDC.approve(address(dex), swapAmount);

        vm.prank(user);
        dex.swapUSDCForETH(swapAmount, 0);

        uint256 expectedOutput = (swapAmount * 1e18) / INITIAL_RATE;
        assertEq(mETH.balanceOf(user), expectedOutput);
    }

    /// @notice Fuzz test: reserves update correctly after ETH→USDC swap
    /// @param swapAmount The amount of mETH to swap
    function testFuzz_SwapETHForUSDC_ReservesUpdate(
        uint256 swapAmount
    ) public {
        swapAmount = bound(swapAmount, 1, LIQUIDITY_USDC * 1e18 / INITIAL_RATE);
        uint256 expectedOutput = (swapAmount * INITIAL_RATE) / 1e18;

        vm.prank(owner);
        mETH.mint(user, swapAmount);

        vm.prank(user);
        mETH.approve(address(dex), swapAmount);

        uint256 ethBefore = dex.ethReserve();
        uint256 usdcBefore = dex.usdcReserve();

        vm.prank(user);
        dex.swapETHForUSDC(swapAmount, 0);

        assertEq(dex.ethReserve(), ethBefore + swapAmount);
        assertEq(dex.usdcReserve(), usdcBefore - expectedOutput);
    }

    /// @notice Fuzz test: reserves update correctly after USDC→ETH swap
    /// @param swapAmount The amount of mUSDC to swap
    function testFuzz_SwapUSDCForETH_ReservesUpdate(
        uint256 swapAmount
    ) public {
        swapAmount = bound(swapAmount, 1, LIQUIDITY_ETH * INITIAL_RATE / 1e18);
        uint256 expectedOutput = (swapAmount * 1e18) / INITIAL_RATE;

        vm.prank(owner);
        mUSDC.mint(user, swapAmount);

        vm.prank(user);
        mUSDC.approve(address(dex), swapAmount);

        uint256 ethBefore = dex.ethReserve();
        uint256 usdcBefore = dex.usdcReserve();

        vm.prank(user);
        dex.swapUSDCForETH(swapAmount, 0);

        assertEq(dex.ethReserve(), ethBefore - expectedOutput);
        assertEq(dex.usdcReserve(), usdcBefore + swapAmount);
    }
}
