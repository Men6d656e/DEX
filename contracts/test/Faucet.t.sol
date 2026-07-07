// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../src/MockERC20.sol";
import {Faucet} from "../src/Faucet.sol";

/**
 * @title FaucetTest
 * @notice Comprehensive unit tests for the Faucet contract.
 *
 * Coverage targets:
 * - Constructor: token setup, default values, zero-address revert
 * - claimToken: successful claim (mETH, mBTC, mUSDC), cooldown enforcement, lifetime tracking
 * - getClaimInfo: eligibility, time remaining, lifetime claimed
 * - Admin: setClaimAmount, setCooldown, onlyOwner restrictions
 * - Edge cases: double-claim, token index out of bounds, time manipulation
 */
contract FaucetTest is Test {
    // ============================================================
    // Test State
    // ============================================================

    MockERC20 public mETH;
    MockERC20 public mBTC;
    MockERC20 public mUSDC;
    Faucet public faucet;

    address public owner;
    address public user;

    uint256 public constant CLAIM_AMOUNT = 10 * 10 ** 18;
    uint256 public constant COOLDOWN = 24 hours;

    // ============================================================
    // Events
    // ============================================================

    event TokensClaimed(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    // ============================================================
    // Setup
    // ============================================================

    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");

        // Set block.timestamp to a value well beyond the default cooldown window
        // so that first-time claims (lastClaimTime = 0, nextAllowed = 0 + 24h) pass.
        vm.warp(100_000);

        address tempFaucet = address(0xDEAD);

        // Deploy tokens with temporary faucet
        vm.prank(owner);
        mETH = new MockERC20("Mock ETH", "mETH", tempFaucet);
        vm.prank(owner);
        mBTC = new MockERC20("Mock BTC", "mBTC", tempFaucet);
        vm.prank(owner);
        mUSDC = new MockERC20("Mock USDC", "mUSDC", tempFaucet);

        // Deploy faucet
        vm.prank(owner);
        faucet = new Faucet(address(mETH), address(mBTC), address(mUSDC));

        // Set faucet addresses in tokens to the real faucet contract
        vm.prank(owner);
        mETH.setFaucet(address(faucet));
        vm.prank(owner);
        mBTC.setFaucet(address(faucet));
        vm.prank(owner);
        mUSDC.setFaucet(address(faucet));
    }

    // ============================================================
    // Constructor Tests
    // ============================================================

    /// @notice Test constructor sets tokens correctly
    function test_Constructor_SetsTokens() public view {
        assertEq(address(faucet.tokens(0)), address(mETH));
        assertEq(address(faucet.tokens(1)), address(mBTC));
        assertEq(address(faucet.tokens(2)), address(mUSDC));
    }

    /// @notice Test constructor sets default claim amount
    function test_Constructor_SetsDefaultClaimAmount() public view {
        assertEq(faucet.claimAmount(), CLAIM_AMOUNT);
    }

    /// @notice Test constructor sets default cooldown
    function test_Constructor_SetsDefaultCooldown() public view {
        assertEq(faucet.cooldown(), COOLDOWN);
    }

    /// @notice Test constructor sets owner
    function test_Constructor_SetsOwner() public view {
        assertEq(faucet.owner(), owner);
    }

    /// @notice Test constructor reverts when mETH is zero address
    function test_Constructor_RevertWhen_METHZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(Faucet.Faucet__InvalidAddress.selector);
        new Faucet(address(0), address(mBTC), address(mUSDC));
    }

    /// @notice Test constructor reverts when mBTC is zero address
    function test_Constructor_RevertWhen_MBTCZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(Faucet.Faucet__InvalidAddress.selector);
        new Faucet(address(mETH), address(0), address(mUSDC));
    }

    /// @notice Test constructor reverts when mUSDC is zero address
    function test_Constructor_RevertWhen_MUSDCZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(Faucet.Faucet__InvalidAddress.selector);
        new Faucet(address(mETH), address(mBTC), address(0));
    }

    // ============================================================
    // claimToken Tests
    // ============================================================

    /// @notice Test user can claim mETH successfully
    function test_ClaimToken_ClaimMETH() public {
        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit TokensClaimed(user, address(mETH), CLAIM_AMOUNT, block.timestamp);
        faucet.claimToken(0);

        assertEq(mETH.balanceOf(user), CLAIM_AMOUNT);
    }

    /// @notice Test user can claim mBTC successfully
    function test_ClaimToken_ClaimMBTC() public {
        vm.prank(user);
        vm.expectEmit(true, true, true, true);
        emit TokensClaimed(user, address(mBTC), CLAIM_AMOUNT, block.timestamp);
        faucet.claimToken(1);

        assertEq(mBTC.balanceOf(user), CLAIM_AMOUNT);
    }

    /// @notice Test user can claim both tokens
    function test_ClaimToken_ClaimBothTokens() public {
        vm.startPrank(user);
        faucet.claimToken(0);
        faucet.claimToken(1);
        vm.stopPrank();

        assertEq(mETH.balanceOf(user), CLAIM_AMOUNT);
        assertEq(mBTC.balanceOf(user), CLAIM_AMOUNT);
    }

    /// @notice Test user can claim all three tokens
    function test_ClaimToken_ClaimAllThreeTokens() public {
        vm.startPrank(user);
        faucet.claimToken(0);
        faucet.claimToken(1);
        faucet.claimToken(2);
        vm.stopPrank();

        assertEq(mETH.balanceOf(user), CLAIM_AMOUNT);
        assertEq(mBTC.balanceOf(user), CLAIM_AMOUNT);
        assertEq(mUSDC.balanceOf(user), CLAIM_AMOUNT);
    }

    /// @notice Test claimToken reverts with invalid token index
    function test_ClaimToken_RevertWhen_InvalidToken() public {
        vm.prank(user);
        vm.expectRevert(Faucet.Faucet__InvalidToken.selector);
        faucet.claimToken(3);
    }

    /// @notice Test claimToken reverts with out-of-bounds index
    function test_ClaimToken_RevertWhen_TokenIndexOutOfBounds() public {
        vm.prank(user);
        vm.expectRevert(Faucet.Faucet__InvalidToken.selector);
        faucet.claimToken(999);
    }

    /// @notice Test claimToken reverts when cooldown has not elapsed
    function test_ClaimToken_RevertWhen_CooldownNotElapsed() public {
        vm.prank(user);
        faucet.claimToken(0);

        // Try claiming again immediately
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                Faucet.Faucet__CooldownNotElapsed.selector,
                COOLDOWN
            )
        );
        faucet.claimToken(0);
    }

    /// @notice Test claimToken succeeds after cooldown elapses
    function test_ClaimToken_SucceedsAfterCooldown() public {
        vm.prank(user);
        faucet.claimToken(0);

        // Warp forward by cooldown period
        vm.warp(block.timestamp + COOLDOWN);

        vm.prank(user);
        faucet.claimToken(0);

        assertEq(mETH.balanceOf(user), CLAIM_AMOUNT * 2);
    }

    /// @notice Test claimToken succeeds just after cooldown (+1 second)
    function test_ClaimToken_SucceedsJustAfterCooldown() public {
        vm.prank(user);
        faucet.claimToken(0);

        vm.warp(block.timestamp + COOLDOWN + 1);

        vm.prank(user);
        faucet.claimToken(0);

        assertEq(mETH.balanceOf(user), CLAIM_AMOUNT * 2);
    }

    // ============================================================
    // getClaimInfo Tests
    // ============================================================

    /// @notice Test getClaimInfo returns canClaim when no claim has been made
    function test_GetClaimInfo_CanClaimInitially() public view {
        (bool canClaim, uint256 timeRemaining, uint256 totalClaimed, ) = faucet
            .getClaimInfo(user, 0);

        assertTrue(canClaim);
        assertEq(timeRemaining, 0);
        assertEq(totalClaimed, 0);
    }

    /// @notice Test getClaimInfo returns correct info after claiming
    function test_GetClaimInfo_AfterClaim() public {
        vm.prank(user);
        faucet.claimToken(0);

        (bool canClaim, uint256 timeRemaining, uint256 totalClaimed, ) = faucet
            .getClaimInfo(user, 0);

        assertFalse(canClaim);
        assertEq(timeRemaining, COOLDOWN);
        assertEq(totalClaimed, CLAIM_AMOUNT);
    }

    /// @notice Test getClaimInfo returns correct time remaining
    function test_GetClaimInfo_TimeRemaining() public {
        vm.prank(user);
        faucet.claimToken(0);

        // Warp forward half the cooldown
        vm.warp(block.timestamp + COOLDOWN / 2);

        (bool canClaim, uint256 timeRemaining, , ) = faucet.getClaimInfo(
            user,
            0
        );

        assertFalse(canClaim);
        assertEq(timeRemaining, COOLDOWN / 2);
    }

    /// @notice Test getClaimInfo returns canClaim after cooldown elapses
    function test_GetClaimInfo_CanClaimAfterCooldown() public {
        vm.prank(user);
        faucet.claimToken(0);

        vm.warp(block.timestamp + COOLDOWN);

        (bool canClaim, uint256 timeRemaining, uint256 totalClaimed, ) = faucet
            .getClaimInfo(user, 0);

        assertTrue(canClaim);
        assertEq(timeRemaining, 0);
        assertEq(totalClaimed, CLAIM_AMOUNT);
    }

    /// @notice Test getClaimInfo reverts with invalid token
    function test_GetClaimInfo_RevertWhen_InvalidToken() public {
        vm.expectRevert(Faucet.Faucet__InvalidToken.selector);
        faucet.getClaimInfo(user, 3);
    }

    /// @notice Test getClaimInfo tracks lifetime claimed for all three tokens
    function test_GetClaimInfo_LifetimeClaimedAllTokens() public {
        vm.startPrank(user);
        faucet.claimToken(0);
        faucet.claimToken(1);
        faucet.claimToken(2);
        vm.stopPrank();

        (, , uint256 totalETH, ) = faucet.getClaimInfo(user, 0);
        (, , uint256 totalBTC, ) = faucet.getClaimInfo(user, 1);
        (, , uint256 totalUSDC, ) = faucet.getClaimInfo(user, 2);

        assertEq(totalETH, CLAIM_AMOUNT);
        assertEq(totalBTC, CLAIM_AMOUNT);
        assertEq(totalUSDC, CLAIM_AMOUNT);
    }

    /// @notice Test getClaimInfo tracks lifetime claimed across multiple claims
    function test_GetClaimInfo_LifetimeClaimedMultiple() public {
        vm.prank(user);
        faucet.claimToken(0);

        vm.warp(block.timestamp + COOLDOWN);

        vm.prank(user);
        faucet.claimToken(0);

        (, , uint256 totalClaimed, ) = faucet.getClaimInfo(user, 0);
        assertEq(totalClaimed, CLAIM_AMOUNT * 2);
    }

    // ============================================================
    // getTokenCount / getTokenAddress Tests
    // ============================================================

    /// @notice Test getTokenCount returns 3
    function test_GetTokenCount() public view {
        assertEq(faucet.getTokenCount(), 3);
    }

    /// @notice Test getTokenAddress returns correct addresses
    function test_GetTokenAddress() public view {
        assertEq(faucet.getTokenAddress(0), address(mETH));
        assertEq(faucet.getTokenAddress(1), address(mBTC));
        assertEq(faucet.getTokenAddress(2), address(mUSDC));
    }

    /// @notice Test getTokenAddress reverts for invalid index
    function test_GetTokenAddress_RevertWhen_InvalidToken() public {
        vm.expectRevert(Faucet.Faucet__InvalidToken.selector);
        faucet.getTokenAddress(3);
    }

    // ============================================================
    // Admin Tests — setClaimAmount
    // ============================================================

    /// @notice Test owner can set claim amount
    function test_SetClaimAmount_OwnerCanSet() public {
        uint256 newAmount = 25 * 10 ** 18;

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit ClaimAmountUpdated(CLAIM_AMOUNT, newAmount);
        faucet.setClaimAmount(newAmount);

        assertEq(faucet.claimAmount(), newAmount);
    }

    /// @notice Test setClaimAmount reverts with zero
    function test_SetClaimAmount_RevertWhen_Zero() public {
        vm.prank(owner);
        vm.expectRevert(Faucet.Faucet__InvalidClaimAmount.selector);
        faucet.setClaimAmount(0);
    }

    /// @notice Test new claim amount is used for future claims
    function test_SetClaimAmount_AffectsFutureClaims() public {
        uint256 newAmount = 25 * 10 ** 18;

        vm.prank(owner);
        faucet.setClaimAmount(newAmount);

        vm.prank(user);
        faucet.claimToken(0);

        assertEq(mETH.balanceOf(user), newAmount);
    }

    /// @notice Test setClaimAmount reverts when called by non-owner
    function test_SetClaimAmount_RevertWhen_NotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        faucet.setClaimAmount(100);
    }

    // ============================================================
    // Admin Tests — setCooldown
    // ============================================================

    /// @notice Test owner can set cooldown
    function test_SetCooldown_OwnerCanSet() public {
        uint256 newCooldown = 12 hours;

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit CooldownUpdated(COOLDOWN, newCooldown);
        faucet.setCooldown(newCooldown);

        assertEq(faucet.cooldown(), newCooldown);
    }

    /// @notice Test setCooldown reverts with zero
    function test_SetCooldown_RevertWhen_Zero() public {
        vm.prank(owner);
        vm.expectRevert(Faucet.Faucet__InvalidCooldown.selector);
        faucet.setCooldown(0);
    }

    /// @notice Test new cooldown is used for future claims
    function test_SetCooldown_AffectsFutureClaims() public {
        uint256 newCooldown = 1 hours;

        vm.prank(owner);
        faucet.setCooldown(newCooldown);

        vm.prank(user);
        faucet.claimToken(0);

        // Warp forward by new cooldown
        vm.warp(block.timestamp + newCooldown);

        vm.prank(user);
        faucet.claimToken(0);

        assertEq(mETH.balanceOf(user), CLAIM_AMOUNT * 2);
    }

    /// @notice Test setCooldown reverts when called by non-owner
    function test_SetCooldown_RevertWhen_NotOwner() public {
        vm.prank(user);
        vm.expectRevert();
        faucet.setCooldown(100);
    }

    // ============================================================
    // Edge Cases
    // ============================================================

    /// @notice Test different users can claim independently
    function test_EdgeCase_DifferentUsersClaimIndependently() public {
        address user2 = makeAddr("user2");

        vm.prank(user);
        faucet.claimToken(0);

        vm.prank(user2);
        faucet.claimToken(0);

        assertEq(mETH.balanceOf(user), CLAIM_AMOUNT);
        assertEq(mETH.balanceOf(user2), CLAIM_AMOUNT);
    }

    /// @notice Test user2 can claim while user1 is on cooldown
    function test_EdgeCase_CooldownPerUser() public {
        address user2 = makeAddr("user2");

        vm.prank(user);
        faucet.claimToken(0);

        vm.prank(user2);
        faucet.claimToken(0);

        // user1 tries again (should fail)
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                Faucet.Faucet__CooldownNotElapsed.selector,
                COOLDOWN
            )
        );
        faucet.claimToken(0);
    }

    /// @notice Test owner can also claim tokens as a user
    function test_EdgeCase_OwnerCanClaim() public {
        vm.prank(owner);
        faucet.claimToken(0);

        assertEq(mETH.balanceOf(owner), CLAIM_AMOUNT);
    }

    /// @notice Test claiming mETH does not affect mBTC cooldown
    function test_EdgeCase_TokenCooldownIndependent() public {
        vm.startPrank(user);
        faucet.claimToken(0);
        faucet.claimToken(1);
        vm.stopPrank();

        // mETH should be on cooldown
        vm.prank(user);
        vm.expectRevert(
            abi.encodeWithSelector(
                Faucet.Faucet__CooldownNotElapsed.selector,
                COOLDOWN
            )
        );
        faucet.claimToken(0);
    }
}
