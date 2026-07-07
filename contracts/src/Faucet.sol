// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MockERC20} from "./MockERC20.sol";

/**
 * @title Faucet
 * @notice Time-locked faucet for distributing mock tokens.
 *         Users can claim 10 tokens (mETH, mBTC, or mUSDC) once every 24 hours.
 *
 * @dev Inherits OpenZeppelin's Ownable for administrative controls.
 *
 * Features:
 * - Three tokens: mETH (index 0), mBTC (index 1), mUSDC (index 2)
 * - 24-hour cooldown per user per token
 * - Lifetime claimed tracking per user per token
 * - View function to query claim eligibility and remaining time
 * - Owner can adjust claim amount and cooldown period
 *
 * Security:
 * - Reentrancy: Uses checks-effects-interactions pattern
 * - Custom errors for clear failure modes
 */
contract Faucet is Ownable {
    // ============================================================
    // Constants
    // ============================================================

    /// @notice Default claim amount: 10 tokens (with 18 decimals)
    uint256 public constant DEFAULT_CLAIM_AMOUNT = 10 * 10 ** 18;

    /// @notice Default cooldown period: 24 hours in seconds
    uint256 public constant DEFAULT_COOLDOWN = 24 hours;

    // ============================================================
    // State
    // ============================================================

    /// @notice Timestamp of the last claim per user per token
    /// @dev user => tokenIndex => timestamp
    mapping(address => mapping(uint256 => uint256)) public lastClaim;

    /// @notice Total amount claimed per user per token (lifetime)
    /// @dev user => tokenIndex => totalClaimed
    mapping(address => mapping(uint256 => uint256)) public lifetimeClaimed;

    /// @notice Number of tokens distributed per claim
    uint256 public claimAmount;

    /// @notice Cooldown period between claims (in seconds)
    uint256 public cooldown;

    /// @notice Array of supported mock tokens
    MockERC20[] public tokens;

    // ============================================================
    // Errors
    // ============================================================

    /// @dev Reverts when a user tries to claim before the cooldown has elapsed
    /// @param remaining Time remaining in seconds before next claim is allowed
    error Faucet__CooldownNotElapsed(uint256 remaining);

    /// @dev Reverts when an invalid token index is provided
    error Faucet__InvalidToken();

    /// @dev Reverts when an invalid (zero) address is provided for a token
    error Faucet__InvalidAddress();

    /// @dev Reverts when setting a claim amount of zero
    error Faucet__InvalidClaimAmount();

    /// @dev Reverts when setting a cooldown of zero
    error Faucet__InvalidCooldown();

    // ============================================================
    // Events
    // ============================================================

    /// @notice Emitted when a user successfully claims tokens
    /// @param user The address that claimed tokens
    /// @param token The address of the token claimed
    /// @param amount The amount of tokens claimed
    /// @param timestamp The block timestamp of the claim
    event TokensClaimed(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Emitted when the claim amount is updated
    /// @param oldAmount The previous claim amount
    /// @param newAmount The new claim amount
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);

    /// @notice Emitted when the cooldown period is updated
    /// @param oldCooldown The previous cooldown period
    /// @param newCooldown The new cooldown period
    event CooldownUpdated(uint256 oldCooldown, uint256 newCooldown);

    // ============================================================
    // Constructor
    // ============================================================

    /**
     * @notice Constructs the Faucet contract.
     * @param mETH The address of the Mock ETH token contract
     * @param mBTC The address of the Mock BTC token contract
     * @param mUSDC The address of the Mock USDC token contract
     *
     * Requirements:
     * - All token addresses must be non-zero
     */
    constructor(
        address mETH,
        address mBTC,
        address mUSDC
    ) Ownable(msg.sender) {
        if (mETH == address(0) || mBTC == address(0) || mUSDC == address(0)) {
            revert Faucet__InvalidAddress();
        }
        tokens.push(MockERC20(mETH));
        tokens.push(MockERC20(mBTC));
        tokens.push(MockERC20(mUSDC));
        claimAmount = DEFAULT_CLAIM_AMOUNT;
        cooldown = DEFAULT_COOLDOWN;
    }

    // ============================================================
    // External Functions
    // ============================================================

    /**
     * @notice Claims tokens from the faucet.
     * @dev Uses checks-effects-interactions pattern for safety.
     *
     * @param tokenIndex Index of the token to claim (0 = mETH, 1 = mBTC, 2 = mUSDC)
     *
     * Requirements:
     * - `tokenIndex` must be valid (0 or 1)
     * - Cooldown period must have elapsed since last claim
     * - User must not have an existing pending cooldown
     *
     * Emits a {TokensClaimed} event.
     */
    function claimToken(uint256 tokenIndex) external {
        // ── Checks ──
        if (tokenIndex >= tokens.length) revert Faucet__InvalidToken();

        uint256 lastClaimTime = lastClaim[msg.sender][tokenIndex];
        uint256 nextAllowedTime = lastClaimTime + cooldown;

        if (block.timestamp < nextAllowedTime) {
            uint256 remaining = nextAllowedTime - block.timestamp;
            revert Faucet__CooldownNotElapsed(remaining);
        }

        // ── Effects ──
        lastClaim[msg.sender][tokenIndex] = block.timestamp;
        lifetimeClaimed[msg.sender][tokenIndex] += claimAmount;

        // ── Interactions ──
        tokens[tokenIndex].mint(msg.sender, claimAmount);

        emit TokensClaimed(
            msg.sender,
            address(tokens[tokenIndex]),
            claimAmount,
            block.timestamp
        );
    }

    /**
     * @notice Returns claim eligibility information for a user.
     *
     * @param user The address to query
     * @param tokenIndex Index of the token (0 = mETH, 1 = mBTC, 2 = mUSDC)
     *
     * @return canClaim Whether the user can claim now
     * @return timeRemaining Seconds remaining until next claim (0 if can claim)
     * @return totalClaimed Total tokens claimed by this user over their lifetime
     * @return lastClaimTime Timestamp of the last claim
     */
    function getClaimInfo(
        address user,
        uint256 tokenIndex
    )
        external
        view
        returns (
            bool canClaim,
            uint256 timeRemaining,
            uint256 totalClaimed,
            uint256 lastClaimTime
        )
    {
        if (tokenIndex >= tokens.length) revert Faucet__InvalidToken();

        lastClaimTime = lastClaim[user][tokenIndex];
        totalClaimed = lifetimeClaimed[user][tokenIndex];

        uint256 nextAllowedTime = lastClaimTime + cooldown;
        if (block.timestamp >= nextAllowedTime) {
            canClaim = true;
            timeRemaining = 0;
        } else {
            canClaim = false;
            timeRemaining = nextAllowedTime - block.timestamp;
        }
    }

    /**
     * @notice Returns the number of supported tokens.
     * @return The length of the tokens array
     */
    function getTokenCount() external view returns (uint256) {
        return tokens.length;
    }

    /**
     * @notice Returns the address of a token by its index.
     * @param tokenIndex Index of the token
     * @return The address of the token contract
     */
    function getTokenAddress(uint256 tokenIndex) external view returns (address) {
        if (tokenIndex >= tokens.length) revert Faucet__InvalidToken();
        return address(tokens[tokenIndex]);
    }

    // ============================================================
    // Admin Functions (onlyOwner)
    // ============================================================

    /**
     * @notice Updates the number of tokens distributed per claim.
     * @dev Only callable by the contract owner.
     * @param newAmount The new claim amount (must be > 0)
     */
    function setClaimAmount(uint256 newAmount) external onlyOwner {
        if (newAmount == 0) revert Faucet__InvalidClaimAmount();
        uint256 oldAmount = claimAmount;
        claimAmount = newAmount;
        emit ClaimAmountUpdated(oldAmount, newAmount);
    }

    /**
     * @notice Updates the cooldown period between claims.
     * @dev Only callable by the contract owner.
     * @param newCooldown The new cooldown in seconds (must be > 0)
     */
    function setCooldown(uint256 newCooldown) external onlyOwner {
        if (newCooldown == 0) revert Faucet__InvalidCooldown();
        uint256 oldCooldown = cooldown;
        cooldown = newCooldown;
        emit CooldownUpdated(oldCooldown, newCooldown);
    }
}
