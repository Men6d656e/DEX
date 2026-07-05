// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {MockERC20} from "../src/MockERC20.sol";

/**
 * @title MockERC20Test
 * @notice Comprehensive unit tests for MockERC20.
 *
 * Coverage targets:
 * - Constructor: name, symbol, decimals, faucet assignment, zero-address revert
 * - Mint: successful mint, only-faucet restriction, event emission
 * - setFaucet: successful update, onlyOwner restriction, zero-address revert, event
 * - Ownership transfer: transferOwnership
 * - Edge cases: mint to zero address, max supply
 */
contract MockERC20Test is Test {
    // ============================================================
    // Test State
    // ============================================================

    MockERC20 public token;

    address public owner;
    address public faucet;
    address public user;

    string public constant TOKEN_NAME = "Mock ETH";
    string public constant TOKEN_SYMBOL = "mETH";
    uint8 public constant DECIMALS = 18;

    // ============================================================
    // Events
    // ============================================================

    event TokensMinted(address indexed to, uint256 amount);
    event FaucetUpdated(address indexed oldFaucet, address indexed newFaucet);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ============================================================
    // Setup
    // ============================================================

    function setUp() public {
        owner = makeAddr("owner");
        faucet = makeAddr("faucet");
        user = makeAddr("user");

        vm.prank(owner);
        token = new MockERC20(TOKEN_NAME, TOKEN_SYMBOL, faucet);
    }

    // ============================================================
    // Constructor Tests
    // ============================================================

    /// @notice Test constructor sets name and symbol correctly
    function test_Constructor_SetsNameAndSymbol() public view {
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
    }

    /// @notice Test constructor sets decimals to 18
    function test_Constructor_SetsDecimals() public view {
        assertEq(token.decimals(), DECIMALS);
    }

    /// @notice Test constructor sets faucet address correctly
    function test_Constructor_SetsFaucet() public view {
        assertEq(token.faucet(), faucet);
    }

    /// @notice Test constructor sets owner correctly
    function test_Constructor_SetsOwner() public view {
        assertEq(token.owner(), owner);
    }

    /// @notice Test constructor reverts when faucet is zero address
    function test_Constructor_RevertWhen_FaucetZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(MockERC20.MockERC20__InvalidFaucet.selector);
        new MockERC20(TOKEN_NAME, TOKEN_SYMBOL, address(0));
    }

    /// @notice Test total supply starts at zero
    function test_Constructor_TotalSupplyZero() public view {
        assertEq(token.totalSupply(), 0);
    }

    // ============================================================
    // Mint Tests
    // ============================================================

    /// @notice Test faucet can mint tokens
    function test_Mint_FaucetCanMint() public {
        uint256 amount = 100 * 10 ** 18;

        vm.prank(faucet);
        vm.expectEmit(true, true, true, true);
        emit TokensMinted(user, amount);
        token.mint(user, amount);

        assertEq(token.balanceOf(user), amount);
        assertEq(token.totalSupply(), amount);
    }

    /// @notice Test mint reverts when called by non-faucet
    function test_Mint_RevertWhen_NotFaucet() public {
        uint256 amount = 10 * 10 ** 18;

        vm.prank(user);
        vm.expectRevert(MockERC20.MockERC20__NotFaucet.selector);
        token.mint(user, amount);
    }

    /// @notice Test mint reverts when called by owner (not faucet)
    function test_Mint_RevertWhen_CalledByOwner() public {
        uint256 amount = 10 * 10 ** 18;

        vm.prank(owner);
        vm.expectRevert(MockERC20.MockERC20__NotFaucet.selector);
        token.mint(user, amount);
    }

    /// @notice Test mint to zero address reverts (OpenZeppelin ERC20 rejects zero receivers)
    function test_Mint_ToZeroAddress() public {
        uint256 amount = 10 * 10 ** 18;

        vm.prank(faucet);
        vm.expectRevert();
        token.mint(address(0), amount);
    }

    /// @notice Test mint with amount = 0
    function test_Mint_ZeroAmount() public {
        vm.prank(faucet);
        token.mint(user, 0);

        assertEq(token.balanceOf(user), 0);
    }

    /// @notice Test multiple mints accumulate correctly
    function test_Mint_MultipleMints() public {
        uint256 amount1 = 50 * 10 ** 18;
        uint256 amount2 = 30 * 10 ** 18;

        vm.startPrank(faucet);
        token.mint(user, amount1);
        token.mint(user, amount2);
        vm.stopPrank();

        assertEq(token.balanceOf(user), amount1 + amount2);
        assertEq(token.totalSupply(), amount1 + amount2);
    }

    // ============================================================
    // setFaucet Tests
    // ============================================================

    /// @notice Test owner can update faucet address
    function test_SetFaucet_OwnerCanUpdate() public {
        address newFaucet = makeAddr("newFaucet");

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit FaucetUpdated(faucet, newFaucet);
        token.setFaucet(newFaucet);

        assertEq(token.faucet(), newFaucet);
    }

    /// @notice Test setFaucet reverts when new faucet is zero address
    function test_SetFaucet_RevertWhen_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(MockERC20.MockERC20__InvalidFaucet.selector);
        token.setFaucet(address(0));
    }

    /// @notice Test setFaucet reverts when called by non-owner
    function test_SetFaucet_RevertWhen_NotOwner() public {
        address newFaucet = makeAddr("newFaucet");

        vm.prank(user);
        vm.expectRevert();
        token.setFaucet(newFaucet);
    }

    /// @notice Test new faucet can mint after update
    function test_SetFaucet_NewFaucetCanMint() public {
        address newFaucet = makeAddr("newFaucet");
        uint256 amount = 10 * 10 ** 18;

        vm.prank(owner);
        token.setFaucet(newFaucet);

        vm.prank(newFaucet);
        token.mint(user, amount);

        assertEq(token.balanceOf(user), amount);
    }

    /// @notice Test old faucet cannot mint after update
    function test_SetFaucet_OldFaucetCannotMint() public {
        address newFaucet = makeAddr("newFaucet");
        uint256 amount = 10 * 10 ** 18;

        vm.prank(owner);
        token.setFaucet(newFaucet);

        vm.prank(faucet);
        vm.expectRevert(MockERC20.MockERC20__NotFaucet.selector);
        token.mint(user, amount);
    }

    // ============================================================
    // Ownership Tests
    // ============================================================

    /// @notice Test owner can transfer ownership
    function test_Ownership_Transfer() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit OwnershipTransferred(owner, newOwner);
        token.transferOwnership(newOwner);

        assertEq(token.owner(), newOwner);
    }

    /// @notice Test new owner can set faucet after ownership transfer
    function test_Ownership_NewOwnerCanSetFaucet() public {
        address newOwner = makeAddr("newOwner");
        address newFaucet = makeAddr("newFaucet");

        vm.prank(owner);
        token.transferOwnership(newOwner);

        vm.prank(newOwner);
        token.setFaucet(newFaucet);

        assertEq(token.faucet(), newFaucet);
    }

    /// @notice Test old owner cannot set faucet after renouncing ownership
    function test_Ownership_RenouncePreventsSetFaucet() public {
        vm.prank(owner);
        token.renounceOwnership();

        vm.prank(owner);
        vm.expectRevert();
        token.setFaucet(makeAddr("any"));
    }
}
