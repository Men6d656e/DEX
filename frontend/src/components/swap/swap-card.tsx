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
 *
 * Supports all pairs: mETH↔mUSDC, mBTC↔mUSDC
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
  getSwapInfo,
  type SwapTokenSymbol,
} from "@/hooks/use-dex";
import { SlippageSettings } from "@/components/swap/slippage-settings";

/** All token symbols available for swapping */
const SWAP_TOKENS: { symbol: SwapTokenSymbol; address: `0x${string}` }[] = [
  { symbol: "mETH", address: CONTRACT_ADDRESSES.mETH },
  { symbol: "mBTC", address: CONTRACT_ADDRESSES.mBTC },
  { symbol: "mUSDC", address: CONTRACT_ADDRESSES.mUSDC },
];

/** Approval state machine */
type ApprovalState = "idle" | "approving" | "approved";

export function SwapCard() {
  // ── Wallet ──
  const { address, isConnected } = useAccount();

  // ── DEX Info ──
  const {
    ethSwapRate,
    btcSwapRate,
    ethReserve,
    btcReserve,
    usdcReserve,
    isLoading,
    isDeployed,
  } = useDexInfo();

  // ── Token balances ──
  const { balances } = useTokenBalances();

  // ── Swap state ──
  const [fromSymbol, setFromSymbol] = useState<SwapTokenSymbol>("mETH");
  const [toSymbol, setToSymbol] = useState<SwapTokenSymbol>("mUSDC");
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);

  // Swap info for the selected pair
  const swapInfo = useMemo(
    () => getSwapInfo(fromSymbol, toSymbol, ethSwapRate, btcSwapRate, ethReserve, btcReserve, usdcReserve),
    [fromSymbol, toSymbol, ethSwapRate, btcSwapRate, ethReserve, btcReserve, usdcReserve],
  );

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
    if (!swapInfo.rate || swapInfo.rate === 0n || amountInParsed === 0n) return 0n;
    return calculateOutput(amountInParsed, swapInfo.rate, swapInfo.isSellingAsset);
  }, [amountInParsed, swapInfo]);

  // Apply slippage to get minimum output
  const slippageBps = Math.round(slippage * 100); // 0.5% → 50 bps
  const minOutput = useMemo(() => {
    return applySlippage(expectedOutput, slippageBps);
  }, [expectedOutput, slippageBps]);

  // Price impact
  const priceImpact = useMemo(() => {
    return calculatePriceImpact(amountInParsed, swapInfo.fromReserve ?? 0n);
  }, [amountInParsed, swapInfo.fromReserve]);

  // ── Allowance Check ──
  const fromTokenAddress = SWAP_TOKENS.find((t) => t.symbol === fromSymbol)?.address ?? CONTRACT_ADDRESSES.mETH;

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

  // Local success state for auto-reset
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSwap = useCallback(() => {
    swap({
      fromToken: fromSymbol,
      toToken: toSymbol,
      amountIn: amountInParsed,
      minOut: minOutput,
    });
  }, [swap, fromSymbol, toSymbol, amountInParsed, minOutput]);

  // ── Auto-reset after successful swap (3 second delay) ──
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setFromAmount("");
        setApprovalState("idle");
      }, 3000);
      return () => clearTimeout(timer);
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
    if (approvalState === "approved" && !isPending && !isConfirming && !showSuccess) {
      return "Swap Tokens";
    }
    if (isPending) return "Confirm in Wallet...";
    if (isConfirming) return "Swapping...";
    if (showSuccess) return "Swapped ✓";
    return "Swap Tokens";
  };

  const isButtonDisabled = () => {
    if (!isConnected) return false;
    if (!isDeployed) return true;
    if (isLoading) return true;
    if (!isAmountValid) return true;
    if (!hasSufficientBalance) return true;
    if (isPending || isConfirming || showSuccess) return true;
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

  // ── Toggle direction (swap from/to) ──
  const toggleDirection = () => {
    const prevFrom = fromSymbol;
    const prevTo = toSymbol;
    // Only swap if both tokens are valid and different
    if (prevFrom !== prevTo) {
      setFromSymbol(prevTo);
      setToSymbol(prevFrom);
    }
    setFromAmount("");
    setApprovalState("idle");
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
              onValueChange={(val: string) => {
                const newFrom = val as SwapTokenSymbol;
                // If user selects the same token as 'to', swap them
                if (newFrom === toSymbol) {
                  setToSymbol(fromSymbol);
                }
                setFromSymbol(newFrom);
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
                className="border-0 bg-transparent p-0 text-left text-lg font-medium tabular-nums shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
                aria-label={`Amount of ${fromSymbol} to swap`}
              />
            </div>
            {fromBalance && (
              <button
                onClick={setMaxAmount}
                className="shrink-0 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors px-1.5 py-0.5 rounded hover:bg-blue-500/10"
              >
                MAX
              </button>
            )}
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
          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background/50 transition-colors focus-within:border-ring">
            <Select
              value={toSymbol}
              onValueChange={(val: string) => {
                const newTo = val as SwapTokenSymbol;
                // If user selects the same token as 'from', swap them
                if (newTo === fromSymbol) {
                  setFromSymbol(toSymbol);
                }
                setToSymbol(newTo);
                setFromAmount("");
                setApprovalState("idle");
              }}
            >
              <SelectTrigger
                className="w-[100px] sm:w-[110px] border-0 bg-transparent p-0 shadow-none focus:ring-0"
                aria-label="Select token to swap to"
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
            <div className="flex-1 text-left text-lg font-medium tabular-nums text-muted-foreground">
              {expectedOutput > 0n
                ? formatDexBalance(expectedOutput)
                : "0.0"}
            </div>
          </div>
        </div>

        {/* ── Rate & Slippage Info ── */}
        {swapInfo.rate && swapInfo.rate > 0n && (
          <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 overflow-x-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Rate
              </span>
              <span className="font-medium tabular-nums">
                {swapInfo.isSellingAsset
                  ? `1 ${fromSymbol} = ${formatRate(swapInfo.rate)} ${toSymbol}`
                  : `1 ${toSymbol} = ${formatRate(swapInfo.rate)} ${fromSymbol}`}
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
