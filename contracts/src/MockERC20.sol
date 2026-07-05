// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20
 * @notice A mock ERC20 token for the DEX Dashboard.
 *         Only the designated faucet address can mint new tokens.
 *         Ownership allows changing the faucet address.
 *
 * @dev Inherits OpenZeppelin's ERC20 and Ownable for battle-tested security.
 *
 * Features:
 * - Mint restricted to a single faucet address
 * - Owner can update the faucet address
 * - Events emitted for all mint operations
 *
 * Deployed instances: Mock ETH (mETH), Mock BTC (mBTC), Mock USDC (mUSDC)
 */
contract MockERC20 is ERC20, Ownable {
    /// @notice Address authorized to mint tokens (the Faucet contract)
    address public faucet;

    /// @notice Emitted when tokens are minted via the faucet
    /// @param to The address receiving the minted tokens
    /// @param amount The amount of tokens minted (in wei)
    event TokensMinted(address indexed to, uint256 amount);

    /// @notice Emitted when the faucet address is updated
    /// @param oldFaucet The previous faucet address
    /// @param newFaucet The new faucet address
    event FaucetUpdated(address indexed oldFaucet, address indexed newFaucet);

    /// @dev Reverts if the caller is not the faucet address
    error MockERC20__NotFaucet();
    /// @dev Reverts if the faucet address is zero
    error MockERC20__InvalidFaucet();

    /**
     * @notice Constructs the MockERC20 token.
     * @param name_ The token name (e.g. "Mock ETH")
     * @param symbol_ The token symbol (e.g. "mETH")
     * @param faucet_ The address authorized to mint tokens
     */
    constructor(
        string memory name_,
        string memory symbol_,
        address faucet_
    ) ERC20(name_, symbol_) Ownable(msg.sender) {
        if (faucet_ == address(0)) revert MockERC20__InvalidFaucet();
        faucet = faucet_;
    }

    /**
     * @notice Mints new tokens to a recipient.
     * @dev Only callable by the designated faucet address.
     * @param to The address receiving the minted tokens
     * @param amount The amount of tokens to mint (in wei)
     */
    function mint(address to, uint256 amount) external {
        if (msg.sender != faucet) revert MockERC20__NotFaucet();
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @notice Updates the authorized faucet address.
     * @dev Only callable by the contract owner.
     * @param newFaucet The new faucet address (must be non-zero)
     */
    function setFaucet(address newFaucet) external onlyOwner {
        if (newFaucet == address(0)) revert MockERC20__InvalidFaucet();
        address oldFaucet = faucet;
        faucet = newFaucet;
        emit FaucetUpdated(oldFaucet, newFaucet);
    }
}
