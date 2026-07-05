/**
 * MockDEX Contract ABI
 *
 * Auto-generated from contracts/src/MockDEX.sol.
 * Includes only the functions/events used by the frontend.
 */
import { type Abi } from "viem";

/**
 * MockDEX ABI — view + write functions for swaps.
 */
export const DEX_ABI = [
  // ── View Functions ──
  {
    type: "function",
    name: "getRate",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "ethReserve",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "usdcReserve",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mETH",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IERC20" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "mUSDC",
    inputs: [],
    outputs: [
      { name: "", type: "address", internalType: "contract IERC20" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "swapRate",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },

  // ── Write Functions ──
  {
    type: "function",
    name: "swapETHForUSDC",
    inputs: [
      { name: "ethAmount", type: "uint256", internalType: "uint256" },
      { name: "minUSDC", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "swapUSDCForETH",
    inputs: [
      { name: "usdcAmount", type: "uint256", internalType: "uint256" },
      { name: "minETH", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ── Events ──
  {
    type: "event",
    name: "Swapped",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      {
        name: "fromToken",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "toToken", type: "address", indexed: true, internalType: "address" },
      { name: "amountIn", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "amountOut", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LiquidityAdded",
    inputs: [
      {
        name: "provider",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      { name: "ethAmount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "usdcAmount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const satisfies Abi;

/**
 * Minimal ERC20 ABI for allowance checks + approvals.
 */
export const ERC20_ABI_FRAGMENT = [
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address", internalType: "address" },
      { name: "spender", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "nonpayable",
  },
] as const satisfies Abi;
