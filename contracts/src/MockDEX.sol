// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockDEX
 * @notice A simplified DEX for educational purposes.
 *         Swaps between mETH and mUSDC using a fixed ratio.
 *
 * @dev Inherits OpenZeppelin's Ownable for administrative controls and
 *      SafeERC20 for secure token transfers.
 *
 * Features:
 * - Ratio-based pricing (e.g., 1 mETH = 1700 mUSDC)
 * - Slippage protection via minimum output amounts
 * - Reserve tracking for liquidity transparency
 * - Owner can adjust swap rate and add liquidity
 *
 * Security:
 * - Uses SafeERC20 for all token transfers
 * - Checks-effects-interactions pattern
 * - Slippage protection against front-running simulation
 * - Custom errors for clear failure modes
 */
contract MockDEX is Ownable {
    using SafeERC20 for IERC20;

    // ============================================================
    // State
    // ============================================================

    /// @notice The mETH token contract
    IERC20 public immutable mETH;

    /// @notice The mUSDC token contract
    IERC20 public immutable mUSDC;

    /// @notice Current mETH reserve in the DEX
    uint256 public ethReserve;

    /// @notice Current mUSDC reserve in the DEX
    uint256 public usdcReserve;

    /// @notice Swap rate: amount of mUSDC for 1 mETH (scaled by 1e18)
    /// @dev Example: 1700 * 10**18 means 1 mETH = 1700 mUSDC
    uint256 public swapRate;

    // ============================================================
    // Errors
    // ============================================================

    /// @dev Reverts when there is insufficient liquidity to perform a swap
    error MockDEX__InsufficientLiquidity();

    /// @dev Reverts when the actual output is less than the minimum specified
    /// @param actual The actual output amount
    /// @param minimum The minimum output amount specified by the user
    error MockDEX__SlippageExceeded(uint256 actual, uint256 minimum);

    /// @dev Reverts when the input amount is zero
    error MockDEX__ZeroAmount();

    /// @dev Reverts when an invalid (zero) address is provided
    error MockDEX__InvalidAddress();

    /// @dev Reverts when the swap rate is zero
    error MockDEX__InvalidRate();

    // ============================================================
    // Events
    // ============================================================

    /// @notice Emitted when liquidity is added by the owner
    /// @param provider The address that provided liquidity
    /// @param ethAmount Amount of mETH added
    /// @param usdcAmount Amount of mUSDC added
    event LiquidityAdded(
        address indexed provider,
        uint256 ethAmount,
        uint256 usdcAmount
    );

    /// @notice Emitted when a swap occurs
    /// @param user The address that performed the swap
    /// @param fromToken The token being sold
    /// @param toToken The token being bought
    /// @param amountIn The amount of fromToken sold
    /// @param amountOut The amount of toToken received
    event Swapped(
        address indexed user,
        address indexed fromToken,
        address indexed toToken,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @notice Emitted when the swap rate is updated
    /// @param oldRate The previous swap rate
    /// @param newRate The new swap rate
    event RateUpdated(uint256 oldRate, uint256 newRate);

    // ============================================================
    // Constructor
    // ============================================================

    /**
     * @notice Constructs the MockDEX contract.
     * @param mETH_ The address of the mETH token contract
     * @param mUSDC_ The address of the mUSDC token contract
     * @param initialRate The initial swap rate (e.g., 1700 * 10**18)
     *
     * Requirements:
     * - Both token addresses must be non-zero
     * - Initial rate must be non-zero
     */
    constructor(
        address mETH_,
        address mUSDC_,
        uint256 initialRate
    ) Ownable(msg.sender) {
        if (mETH_ == address(0) || mUSDC_ == address(0)) {
            revert MockDEX__InvalidAddress();
        }
        if (initialRate == 0) revert MockDEX__InvalidRate();

        mETH = IERC20(mETH_);
        mUSDC = IERC20(mUSDC_);
        swapRate = initialRate;
    }

    // ============================================================
    // External Functions
    // ============================================================

    /**
     * @notice Adds liquidity to the DEX.
     * @dev Only callable by the owner.
     *      Transfers tokens from the caller (owner) to this contract.
     *
     * @param ethAmount Amount of mETH to add
     * @param usdcAmount Amount of mUSDC to add
     *
     * Requirements:
     * - Both amounts must be non-zero
     * - Caller must have approved this contract to spend tokens
     */
    function addLiquidity(
        uint256 ethAmount,
        uint256 usdcAmount
    ) external onlyOwner {
        if (ethAmount == 0 && usdcAmount == 0) revert MockDEX__ZeroAmount();

        // Transfer tokens from owner to this contract
        if (ethAmount > 0) {
            mETH.safeTransferFrom(msg.sender, address(this), ethAmount);
            ethReserve += ethAmount;
        }
        if (usdcAmount > 0) {
            mUSDC.safeTransferFrom(msg.sender, address(this), usdcAmount);
            usdcReserve += usdcAmount;
        }

        emit LiquidityAdded(msg.sender, ethAmount, usdcAmount);
    }

    /**
     * @notice Swaps mETH for mUSDC.
     * @dev Uses a simple ratio calculation: output = input * swapRate / 1e18.
     *
     * @param ethAmount Amount of mETH to sell
     * @param minUSDC Minimum amount of mUSDC to receive (slippage protection)
     *
     * Requirements:
     * - `ethAmount` must be non-zero
     * - Contract must have sufficient mUSDC reserves
     * - Actual output must be >= `minUSDC`
     */
    function swapETHForUSDC(uint256 ethAmount, uint256 minUSDC) external {
        if (ethAmount == 0) revert MockDEX__ZeroAmount();

        // Calculate output: ethAmount * swapRate / 1e18
        uint256 usdcOutput = (ethAmount * swapRate) / 1e18;

        if (usdcOutput > usdcReserve) revert MockDEX__InsufficientLiquidity();
        if (usdcOutput < minUSDC) {
            revert MockDEX__SlippageExceeded(usdcOutput, minUSDC);
        }

        // ── Effects ──
        ethReserve += ethAmount;
        usdcReserve -= usdcOutput;

        // ── Interactions ──
        mETH.safeTransferFrom(msg.sender, address(this), ethAmount);
        mUSDC.safeTransfer(msg.sender, usdcOutput);

        emit Swapped(
            msg.sender,
            address(mETH),
            address(mUSDC),
            ethAmount,
            usdcOutput
        );
    }

    /**
     * @notice Swaps mUSDC for mETH.
     * @dev Uses a simple ratio calculation: output = input * 1e18 / swapRate.
     *
     * @param usdcAmount Amount of mUSDC to sell
     * @param minETH Minimum amount of mETH to receive (slippage protection)
     *
     * Requirements:
     * - `usdcAmount` must be non-zero
     * - Contract must have sufficient mETH reserves
     * - Actual output must be >= `minETH`
     */
    function swapUSDCForETH(uint256 usdcAmount, uint256 minETH) external {
        if (usdcAmount == 0) revert MockDEX__ZeroAmount();

        // Calculate output: usdcAmount * 1e18 / swapRate
        uint256 ethOutput = (usdcAmount * 1e18) / swapRate;

        if (ethOutput > ethReserve) revert MockDEX__InsufficientLiquidity();
        if (ethOutput < minETH) {
            revert MockDEX__SlippageExceeded(ethOutput, minETH);
        }

        // ── Effects ──
        usdcReserve += usdcAmount;
        ethReserve -= ethOutput;

        // ── Interactions ──
        mUSDC.safeTransferFrom(msg.sender, address(this), usdcAmount);
        mETH.safeTransfer(msg.sender, ethOutput);

        emit Swapped(
            msg.sender,
            address(mUSDC),
            address(mETH),
            usdcAmount,
            ethOutput
        );
    }

    /**
     * @notice Returns the current swap rate.
     * @return The current rate (mUSDC per 1 mETH, scaled by 1e18)
     */
    function getRate() external view returns (uint256) {
        return swapRate;
    }

    // ============================================================
    // Admin Functions (onlyOwner)
    // ============================================================

    /**
     * @notice Updates the swap rate.
     * @dev Only callable by the contract owner.
     * @param newRate The new swap rate (must be non-zero)
     */
    function setRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert MockDEX__InvalidRate();
        uint256 oldRate = swapRate;
        swapRate = newRate;
        emit RateUpdated(oldRate, newRate);
    }
}
