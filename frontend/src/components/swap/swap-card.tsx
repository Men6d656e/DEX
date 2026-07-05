"use client";

/**
 * SwapCard — Main swap interface with token selectors, amount inputs,
 * real-time rate calculation, slippage settings, approval flow, and
 * swap execution.
 *
 * States handled:
 * - Wallet not connected
 * - Contracts not deployed
 * - Loading rate/reserves
 * - Insufficient balance
 * - Insufficient allowance (approval flow)
 * - Swap pending / confirming / confirmed
 * - Swap error
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther } from "viem";
import { ArrowDownUp, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { DEX_ABI, ERC20_ABI_FRAGMENT } from "@/lib/dex-abi";
import { useTokenBalances } from "@/hooks/use-token-balances";
import {
  useDexInfo,
  useSwap,
  calculateOutput,
  applySlippage,
  formatDexBalance,
  formatRate,
  calculatePriceImpact,
} from "@/hooks/use-dex";
import { SlippageSettings } from "@/components/swap/slippage-settings";

/** Swap direction */
type SwapDirection = "mETH-to-mUSDC" | "mUSDC-to-mETH";

/** Token symbols available in the DEX */
const SWAP_TOKENS = [
  { symbol: "mETH", address: CONTRACT_ADDRESSES.mETH },
  { symbol: "mUSDC", address: CONTRACT_ADDRESSES.mUSDC },
] as const;

/** Approval state machine */
type ApprovalState = "idle" | "approving" | "approved";

export function SwapCard() {
  // ── Wallet ──
  const { address, isConnected } = useAccount();

  // ── DEX Info ──
  const { swapRate, ethReserve, usdcReserve, isLoading, isDeployed } =
    useDexInfo();

  // ── Token balances ──
  const { balances } = useTokenBalances();

  // ── Swap state ──
  const [direction, setDirection] = useState<SwapDirection>("mETH-to-mUSDC");
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);

  // Derived tokens
  const fromSymbol = direction === "mETH-to-mUSDC" ? "mETH" : "mUSDC";
  const toSymbol = direction === "mETH-to-mUSDC" ? "mUSDC" : "mETH";
  const fromIsETH = fromSymbol === "mETH";

  // Current reserve for price impact calculation
  const currentReserve = fromIsETH ? ethReserve : usdcReserve;

  // Validate and parse input amount
  const amountInParsed = useMemo(() => {
    try {
      const trimmed = fromAmount.trim();
      if (!trimmed) return 0n;
      return parseEther(trimmed);
    } catch {
      return 0n;
    }
  }, [fromAmount]);

  // Calculate expected output
  const expectedOutput = useMemo(() => {
    if (!swapRate || swapRate === 0n || amountInParsed === 0n) return 0n;
    return calculateOutput(amountInParsed, swapRate, fromIsETH);
  }, [amountInParsed, swapRate, fromIsETH]);

  // Apply slippage to get minimum output
  const slippageBps = Math.round(slippage * 100); // 0.5% → 50 bps
  const minOutput = useMemo(() => {
    return applySlippage(expectedOutput, slippageBps);
  }, [expectedOutput, slippageBps]);

  // Price impact
  const priceImpact = useMemo(() => {
    return calculatePriceImpact(amountInParsed, currentReserve ?? 0n);
  }, [amountInParsed, currentReserve]);

  // ── Allowance Check ──
  const fromTokenAddress =
    fromSymbol === "mETH" ? CONTRACT_ADDRESSES.mETH : CONTRACT_ADDRESSES.mUSDC;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: fromTokenAddress,
    abi: ERC20_ABI_FRAGMENT,
    functionName: "allowance",
    args: [address ?? "0x0", CONTRACT_ADDRESSES.dex],
    query: {
      enabled:
        isConnected &&
        !!address &&
        isDeployed &&
        fromTokenAddress !== "0x0000000000000000000000000000000000000000",
      refetchInterval: 5_000,
    },
  });

  const allowanceBigInt = allowance as bigint | undefined;
  const needsApproval =
    allowanceBigInt !== undefined && amountInParsed > 0n
      ? allowanceBigInt < amountInParsed
      : false;

  // ── Approval flow ──
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveConfirmed,
  } = useWaitForTransactionReceipt({ hash: approveHash });

  const [approvalState, setApprovalState] = useState<ApprovalState>("idle");

  // Reset approval state when inputs change
  useEffect(() => {
    setApprovalState("idle");
  }, [fromSymbol, fromAmount]);

  // When approval tx confirms, refetch allowance and move to approved state
  useEffect(() => {
    if (isApproveConfirmed) {
      setApprovalState("approved");
      refetchAllowance();
    }
  }, [isApproveConfirmed, refetchAllowance]);

  const handleApprove = useCallback(() => {
    setApprovalState("approving");
    writeApprove({
      address: fromTokenAddress,
      abi: ERC20_ABI_FRAGMENT,
      functionName: "approve",
      args: [CONTRACT_ADDRESSES.dex,
      // Approve a large amount to avoid re-approving for small swaps
      parseEther("1000000")],
    });
  }, [writeApprove, fromTokenAddress]);

  // ── Swap execution ──
  const { swap, isPending, isConfirming, isConfirmed, hash: swapHash } =
    useSwap();

  const handleSwap = useCallback(() => {
    swap({
      fromToken: fromSymbol,
      amountIn: amountInParsed,
      minOut: minOutput,
    });
  }, [swap, fromSymbol, amountInParsed, minOutput]);

  // Reset form after successful swap
  useEffect(() => {
    if (isConfirmed) {
      setFromAmount("");
      setApprovalState("idle");
    }
  }, [isConfirmed]);

  // ── UI State ──
  const fromBalance = useMemo(() => {
    return balances.find((b) => b.symbol === fromSymbol);
  }, [balances, fromSymbol]);

  const toBalance = useMemo(() => {
    return balances.find((b) => b.symbol === toSymbol);
  }, [balances, toSymbol]);

  const isAmountValid = amountInParsed > 0n;
  const hasSufficientBalance = fromBalance
    ? fromBalance.value >= amountInParsed
    : false;

  const getButtonLabel = () => {
    if (!isConnected) return "Connect Wallet";
    if (!isDeployed) return "DEX Not Deployed";
    if (isLoading) return "Loading...";
    if (!isAmountValid) return "Enter an Amount";
    if (!hasSufficientBalance) return `Insufficient ${fromSymbol} Balance`;
    if (needsApproval && approvalState === "idle") return `Approve ${fromSymbol}`;
    if (isApprovePending || isApproveConfirming) return "Approving...";
    if (approvalState === "approved" && !isPending && !isConfirming) {
      return "Swap Tokens";
    }
    if (isPending) return "Confirm in Wallet...";
    if (isConfirming) return "Swapping...";
    if (isConfirmed) return "Swapped ✓";
    return "Swap Tokens";
  };

  const isButtonDisabled = () => {
    if (!isConnected) return false;
    if (!isDeployed) return true;
    if (isLoading) return true;
    if (!isAmountValid) return true;
    if (!hasSufficientBalance) return true;
    if (isPending || isConfirming || isConfirmed) return true;
    if (isApprovePending || isApproveConfirming) return true;
    if (needsApproval && approvalState === "idle") return false;
    return false;
  };

  const handleButtonClick = () => {
    if (!isConnected) return;
    if (needsApproval && approvalState === "idle") {
      handleApprove();
      return;
    }
    if (approvalState === "approved" || (!needsApproval && isAmountValid)) {
      handleSwap();
    }
  };

  // ── Toggle direction ──
  const toggleDirection = () => {
    setDirection((prev) =>
      prev === "mETH-to-mUSDC" ? "mUSDC-to-mETH" : "mETH-to-mUSDC",
    );
    setFromAmount("");
  };

  // Set max amount from balance
  const setMaxAmount = useCallback(() => {
    if (fromBalance) {
      setFromAmount(fromBalance.formatted);
    }
  }, [fromBalance]);

  return (
    <Card className="w-full border-border bg-card shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Swap</CardTitle>
          <div className="flex items-center gap-2">
            <SlippageSettings slippage={slippage} onSlippageChange={setSlippage} />
          </div>
        </div>
        {/* Wallet balances row */}
        {isConnected && balances.length > 0 && (
          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
            {SWAP_TOKENS.map((token) => {
              const bal = balances.find((b) => b.symbol === token.symbol);
              return (
                <span key={token.symbol} className="tabular-nums">
                  {token.symbol}: {bal ? bal.formatted : "0"}
                </span>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── From Token ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>From</span>
            {fromBalance && (
              <span className="tabular-nums">
                Balance: {fromBalance.formatted}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background transition-colors focus-within:border-ring">
            <Select
              value={fromSymbol}
              onValueChange={(val) => {
                // Only swap direction if switching from token
                if (val === "mUSDC" && fromSymbol === "mETH") {
                  setDirection("mUSDC-to-mETH");
                } else if (val === "mETH" && fromSymbol === "mUSDC") {
                  setDirection("mETH-to-mUSDC");
                }
                setFromAmount("");
                setApprovalState("idle");
              }}
            >
              <SelectTrigger
                className="w-[100px] sm:w-[110px] border-0 bg-transparent p-0 shadow-none focus:ring-0"
                aria-label="Select token to swap from"
              >
                <SelectValue placeholder="Token" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {SWAP_TOKENS.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <span className="font-medium">{token.symbol}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => {
                  // Allow only valid decimal input
                  const val = e.target.value;
                  if (/^\d*\.?\d*$/.test(val) || val === "") {
                    setFromAmount(val);
                  }
                }}
                className="border-0 bg-transparent p-0 text-right text-lg font-medium tabular-nums shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                aria-label={`Amount of ${fromSymbol} to swap`}
              />
              {fromBalance && amountInParsed > 0n && (
                <button
                  onClick={setMaxAmount}
                  className="absolute -bottom-4 right-0 text-[10px] text-blue-500 hover:text-blue-400 transition-colors"
                >
                  Max
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Swap Direction Toggle ── */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full border-2 bg-card shadow-sm hover:bg-secondary/80 transition-transform hover:scale-110"
            onClick={toggleDirection}
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>

        {/* ── To Token ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>To (estimated)</span>
            {toBalance && (
              <span className="tabular-nums">
                Balance: {toBalance.formatted}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background/50">
            <div className="w-[110px] px-3 py-1.5 rounded-md bg-secondary/30 text-sm font-medium text-center">
              {toSymbol}
            </div>
            <div className="flex-1 text-right text-lg font-medium tabular-nums text-muted-foreground">
              {expectedOutput > 0n
                ? formatDexBalance(expectedOutput)
                : "0.0"}
            </div>
          </div>
        </div>

        {/* ── Rate & Slippage Info ── */}
        {swapRate && swapRate > 0n && (
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 overflow-x-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Rate
              </span>
              <span className="font-medium tabular-nums">
                1 {fromSymbol} ={" "}
                {direction === "mETH-to-mUSDC"
                  ? `${formatRate(swapRate)} ${toSymbol}`
                  : `${(1 / Number(formatRate(swapRate).replace(/,/g, ""))).toFixed(6)} ${toSymbol}`}
              </span>
            </div>
            {expectedOutput > 0n && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Expected Output
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatDexBalance(expectedOutput)} {toSymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Min. Received (with {slippage}% slippage)
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatDexBalance(minOutput)} {toSymbol}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Price Impact
                  </span>
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      priceImpact > 5
                        ? "text-red-500"
                        : priceImpact > 1
                          ? "text-amber-500"
                          : "text-muted-foreground",
                    )}
                  >
                    {priceImpact.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Approval / Swap Progress ── */}
        {approvalState === "approving" && (
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/5 rounded-lg px-3 py-2">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Approving {fromSymbol}... Please confirm in your wallet.
          </div>
        )}
        {approvalState === "approved" && (
          <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/5 rounded-lg px-3 py-2">
            <span className="text-emerald-500">✓</span>
            {fromSymbol} approved! Now you can swap.
          </div>
        )}
        {isConfirming && (
          <div className="flex items-center gap-2 text-xs text-blue-500 bg-blue-500/5 rounded-lg px-3 py-2">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Swap transaction submitted. Waiting for confirmation...
          </div>
        )}
        {isConfirmed && (
          <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/5 rounded-lg px-3 py-2">
            <span className="text-emerald-500">✓</span>
            Swap successful!
          </div>
        )}

        {/* ── Swap Button ── */}
        <Button
          variant="default"
          size="lg"
          className="w-full h-12 text-sm font-semibold"
          disabled={isButtonDisabled()}
          onClick={handleButtonClick}
        >
          {!isConnected && (
            <Wallet className="h-4 w-4 mr-2" />
          )}
          {getButtonLabel()}
        </Button>

        {/* ── Error states ── */}
        {!hasSufficientBalance && isAmountValid && fromBalance && (
          <p className="text-xs text-red-500 text-center">
            Insufficient {fromSymbol} balance. Use the{" "}
            <a
              href="/faucet"
              className="underline hover:text-red-400"
            >
              Faucet
            </a>{" "}
            to get more tokens.
          </p>
        )}
        {swapHash && !isConfirming && !isConfirmed && (
          <p className="text-[10px] text-muted-foreground text-center truncate">
            Tx: {swapHash.slice(0, 10)}...{swapHash.slice(-6)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
