// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockDEX
 * @notice A simplified DEX for educational purposes.
 *         Supports two swap pairs: mETH ↔ mUSDC and mBTC ↔ mUSDC.
 *
 * @dev Inherits OpenZeppelin's Ownable for administrative controls and
 *      SafeERC20 for secure token transfers.
 *
 * Features:
 * - Ratio-based pricing (e.g., 1 mETH = 1700 mUSDC, 1 mBTC = 40000 mUSDC)
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

    /// @notice The mBTC token contract
    IERC20 public immutable mBTC;

    /// @notice The mUSDC token contract
    IERC20 public immutable mUSDC;

    /// @notice Current mETH reserve in the DEX
    uint256 public ethReserve;

    /// @notice Current mBTC reserve in the DEX
    uint256 public btcReserve;

    /// @notice Current mUSDC reserve in the DEX
    uint256 public usdcReserve;

    /// @notice Swap rate: amount of mUSDC for 1 mETH (scaled by 1e18)
    /// @dev Example: 1700 * 10**18 means 1 mETH = 1700 mUSDC
    uint256 public ethSwapRate;

    /// @notice Swap rate: amount of mUSDC for 1 mBTC (scaled by 1e18)
    /// @dev Example: 40000 * 10**18 means 1 mBTC = 40000 mUSDC
    uint256 public btcSwapRate;

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
    /// @param btcAmount Amount of mBTC added
    /// @param usdcAmount Amount of mUSDC added
    event LiquidityAdded(
        address indexed provider,
        uint256 ethAmount,
        uint256 btcAmount,
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

    /// @notice Emitted when the mETH swap rate is updated
    /// @param oldRate The previous swap rate
    /// @param newRate The new swap rate
    event EthRateUpdated(uint256 oldRate, uint256 newRate);

    /// @notice Emitted when the mBTC swap rate is updated
    /// @param oldRate The previous swap rate
    /// @param newRate The new swap rate
    event BtcRateUpdated(uint256 oldRate, uint256 newRate);

    // ============================================================
    // Constructor
    // ============================================================

    /**
     * @notice Constructs the MockDEX contract.
     * @param mETH_ The address of the mETH token contract
     * @param mBTC_ The address of the mBTC token contract
     * @param mUSDC_ The address of the mUSDC token contract
     * @param initialEthRate The initial mETH→mUSDC swap rate (e.g., 1700 * 10**18)
     * @param initialBtcRate The initial mBTC→mUSDC swap rate (e.g., 40000 * 10**18)
     *
     * Requirements:
     * - All token addresses must be non-zero
     * - Both rates must be non-zero
     */
    constructor(
        address mETH_,
        address mBTC_,
        address mUSDC_,
        uint256 initialEthRate,
        uint256 initialBtcRate
    ) Ownable(msg.sender) {
        if (mETH_ == address(0) || mBTC_ == address(0) || mUSDC_ == address(0)) {
            revert MockDEX__InvalidAddress();
        }
        if (initialEthRate == 0 || initialBtcRate == 0) revert MockDEX__InvalidRate();

        mETH = IERC20(mETH_);
        mBTC = IERC20(mBTC_);
        mUSDC = IERC20(mUSDC_);
        ethSwapRate = initialEthRate;
        btcSwapRate = initialBtcRate;
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
     * @param btcAmount Amount of mBTC to add
     * @param usdcAmount Amount of mUSDC to add
     *
     * Requirements:
     * - At least one amount must be non-zero
     * - Caller must have approved this contract to spend tokens
     */
    function addLiquidity(
        uint256 ethAmount,
        uint256 btcAmount,
        uint256 usdcAmount
    ) external onlyOwner {
        if (ethAmount == 0 && btcAmount == 0 && usdcAmount == 0) revert MockDEX__ZeroAmount();

        // Transfer tokens from owner to this contract
        if (ethAmount > 0) {
            mETH.safeTransferFrom(msg.sender, address(this), ethAmount);
            ethReserve += ethAmount;
        }
        if (btcAmount > 0) {
            mBTC.safeTransferFrom(msg.sender, address(this), btcAmount);
            btcReserve += btcAmount;
        }
        if (usdcAmount > 0) {
            mUSDC.safeTransferFrom(msg.sender, address(this), usdcAmount);
            usdcReserve += usdcAmount;
        }

        emit LiquidityAdded(msg.sender, ethAmount, btcAmount, usdcAmount);
    }

    /**
     * @notice Swaps mETH for mUSDC.
     * @dev Uses a simple ratio calculation: output = input * ethSwapRate / 1e18.
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

        // Calculate output: ethAmount * ethSwapRate / 1e18
        uint256 usdcOutput = (ethAmount * ethSwapRate) / 1e18;

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
     * @dev Uses a simple ratio calculation: output = input * 1e18 / ethSwapRate.
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

        // Calculate output: usdcAmount * 1e18 / ethSwapRate
        uint256 ethOutput = (usdcAmount * 1e18) / ethSwapRate;

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
     * @notice Swaps mBTC for mUSDC.
     * @dev Uses a simple ratio calculation: output = input * btcSwapRate / 1e18.
     *
     * @param btcAmount Amount of mBTC to sell
     * @param minUSDC Minimum amount of mUSDC to receive (slippage protection)
     *
     * Requirements:
     * - `btcAmount` must be non-zero
     * - Contract must have sufficient mUSDC reserves
     * - Actual output must be >= `minUSDC`
     */
    function swapBTCForUSDC(uint256 btcAmount, uint256 minUSDC) external {
        if (btcAmount == 0) revert MockDEX__ZeroAmount();

        // Calculate output: btcAmount * btcSwapRate / 1e18
        uint256 usdcOutput = (btcAmount * btcSwapRate) / 1e18;

        if (usdcOutput > usdcReserve) revert MockDEX__InsufficientLiquidity();
        if (usdcOutput < minUSDC) {
            revert MockDEX__SlippageExceeded(usdcOutput, minUSDC);
        }

        // ── Effects ──
        btcReserve += btcAmount;
        usdcReserve -= usdcOutput;

        // ── Interactions ──
        mBTC.safeTransferFrom(msg.sender, address(this), btcAmount);
        mUSDC.safeTransfer(msg.sender, usdcOutput);

        emit Swapped(
            msg.sender,
            address(mBTC),
            address(mUSDC),
            btcAmount,
            usdcOutput
        );
    }

    /**
     * @notice Swaps mUSDC for mBTC.
     * @dev Uses a simple ratio calculation: output = input * 1e18 / btcSwapRate.
     *
     * @param usdcAmount Amount of mUSDC to sell
     * @param minBTC Minimum amount of mBTC to receive (slippage protection)
     *
     * Requirements:
     * - `usdcAmount` must be non-zero
     * - Contract must have sufficient mBTC reserves
     * - Actual output must be >= `minBTC`
     */
    function swapUSDCForBTC(uint256 usdcAmount, uint256 minBTC) external {
        if (usdcAmount == 0) revert MockDEX__ZeroAmount();

        // Calculate output: usdcAmount * 1e18 / btcSwapRate
        uint256 btcOutput = (usdcAmount * 1e18) / btcSwapRate;

        if (btcOutput > btcReserve) revert MockDEX__InsufficientLiquidity();
        if (btcOutput < minBTC) {
            revert MockDEX__SlippageExceeded(btcOutput, minBTC);
        }

        // ── Effects ──
        usdcReserve += usdcAmount;
        btcReserve -= btcOutput;

        // ── Interactions ──
        mUSDC.safeTransferFrom(msg.sender, address(this), usdcAmount);
        mBTC.safeTransfer(msg.sender, btcOutput);

        emit Swapped(
            msg.sender,
            address(mUSDC),
            address(mBTC),
            usdcAmount,
            btcOutput
        );
    }

    /**
     * @notice Swaps mETH for mBTC using cross-rate derivation.
     * @dev Calculates output by routing through mUSDC:
     *      usdcValue = ethAmount * ethSwapRate / 1e18
     *      btcOutput = usdcValue * 1e18 / btcSwapRate
     *
     * @param ethAmount Amount of mETH to sell
     * @param minBTC Minimum amount of mBTC to receive (slippage protection)
     *
     * Requirements:
     * - `ethAmount` must be non-zero
     * - Contract must have sufficient mBTC reserves
     * - Actual output must be >= `minBTC`
     */
    function swapETHForBTC(uint256 ethAmount, uint256 minBTC) external {
        if (ethAmount == 0) revert MockDEX__ZeroAmount();

        // Route through mUSDC: ETH→USDC value → BTC
        uint256 usdcValue = (ethAmount * ethSwapRate) / 1e18;
        uint256 btcOutput = (usdcValue * 1e18) / btcSwapRate;

        if (btcOutput > btcReserve) revert MockDEX__InsufficientLiquidity();
        if (btcOutput < minBTC) {
            revert MockDEX__SlippageExceeded(btcOutput, minBTC);
        }

        // ── Effects ──
        ethReserve += ethAmount;
        btcReserve -= btcOutput;

        // ── Interactions ──
        mETH.safeTransferFrom(msg.sender, address(this), ethAmount);
        mBTC.safeTransfer(msg.sender, btcOutput);

        emit Swapped(
            msg.sender,
            address(mETH),
            address(mBTC),
            ethAmount,
            btcOutput
        );
    }

    /**
     * @notice Swaps mBTC for mETH using cross-rate derivation.
     * @dev Calculates output by routing through mUSDC:
     *      usdcValue = btcAmount * btcSwapRate / 1e18
     *      ethOutput = usdcValue * 1e18 / ethSwapRate
     *
     * @param btcAmount Amount of mBTC to sell
     * @param minETH Minimum amount of mETH to receive (slippage protection)
     *
     * Requirements:
     * - `btcAmount` must be non-zero
     * - Contract must have sufficient mETH reserves
     * - Actual output must be >= `minETH`
     */
    function swapBTCForETH(uint256 btcAmount, uint256 minETH) external {
        if (btcAmount == 0) revert MockDEX__ZeroAmount();

        // Route through mUSDC: BTC→USDC value → ETH
        uint256 usdcValue = (btcAmount * btcSwapRate) / 1e18;
        uint256 ethOutput = (usdcValue * 1e18) / ethSwapRate;

        if (ethOutput > ethReserve) revert MockDEX__InsufficientLiquidity();
        if (ethOutput < minETH) {
            revert MockDEX__SlippageExceeded(ethOutput, minETH);
        }

        // ── Effects ──
        btcReserve += btcAmount;
        ethReserve -= ethOutput;

        // ── Interactions ──
        mBTC.safeTransferFrom(msg.sender, address(this), btcAmount);
        mETH.safeTransfer(msg.sender, ethOutput);

        emit Swapped(
            msg.sender,
            address(mBTC),
            address(mETH),
            btcAmount,
            ethOutput
        );
    }

    /**
     * @notice Returns the current mETH→mUSDC swap rate.
     * @return The current rate (mUSDC per 1 mETH, scaled by 1e18)
     */
    function getEthRate() external view returns (uint256) {
        return ethSwapRate;
    }

    /**
     * @notice Returns the current mBTC→mUSDC swap rate.
     * @return The current rate (mUSDC per 1 mBTC, scaled by 1e18)
     */
    function getBtcRate() external view returns (uint256) {
        return btcSwapRate;
    }

    // ============================================================
    // Admin Functions (onlyOwner)
    // ============================================================

    /**
     * @notice Updates the mETH swap rate.
     * @dev Only callable by the contract owner.
     * @param newRate The new swap rate (must be non-zero)
     */
    function setEthRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert MockDEX__InvalidRate();
        uint256 oldRate = ethSwapRate;
        ethSwapRate = newRate;
        emit EthRateUpdated(oldRate, newRate);
    }

    /**
     * @notice Updates the mBTC swap rate.
     * @dev Only callable by the contract owner.
     * @param newRate The new swap rate (must be non-zero)
     */
    function setBtcRate(uint256 newRate) external onlyOwner {
        if (newRate == 0) revert MockDEX__InvalidRate();
        uint256 oldRate = btcSwapRate;
        btcSwapRate = newRate;
        emit BtcRateUpdated(oldRate, newRate);
    }
}
