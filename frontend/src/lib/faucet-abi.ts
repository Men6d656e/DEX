/**
 * Faucet Contract ABI
 *
 * Auto-generated from contracts/src/Faucet.sol.
 * Includes only the functions/events used by the frontend.
 */
import { type Abi } from "viem";

export const FAUCET_ABI = [
  {
    type: "function",
    name: "claimToken",
    inputs: [
      { name: "tokenIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getClaimInfo",
    inputs: [
      { name: "user", type: "address", internalType: "address" },
      { name: "tokenIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "canClaim", type: "bool", internalType: "bool" },
      { name: "timeRemaining", type: "uint256", internalType: "uint256" },
      { name: "totalClaimed", type: "uint256", internalType: "uint256" },
      { name: "lastClaimTime", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "claimAmount",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "cooldown",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTokenAddress",
    inputs: [
      { name: "tokenIndex", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "", type: "address", internalType: "address" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTokenCount",
    inputs: [],
    outputs: [
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokens",
    inputs: [
      { name: "", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "", type: "address", internalType: "address MockERC20" },
    ],
    stateMutability: "view",
  },
] as const satisfies Abi;
