"use client";

/**
 * FaucetClaimCard — The main faucet interaction UI.
 *
 * Features:
 * - Token selector tabs (mETH / mBTC)
 * - Token address display with copy button
 * - Current wallet balance for selected token
 * - Claim button with loading/confirming states
 * - Cooldown countdown timer with Progress bar
 */
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Droplet, Copy, Check, Loader2, Wallet } from "lucide-react";
import { useTokenBalances, type TokenBalance } from "@/hooks/use-token-balances";
import { useClaimInfo, useClaimTokens, useTokenAddress, formatCountdown, formatClaimedAmount } from "@/hooks/use-faucet";
import { CONTRACT_ADDRESSES, FAUCET_COOLDOWN } from "@/lib/constants";

/** Token definitions for the faucet */
const FAUCET_TOKENS = [
  { index: 0, symbol: "mETH", name: "Mock ETH", color: "text-blue-500" },
  { index: 1, symbol: "mBTC", name: "Mock BTC", color: "text-orange-500" },
  { index: 2, symbol: "mUSDC", name: "Mock USDC", color: "text-blue-600" },
] as const;

export function FaucetClaimCard() {
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState("0");
  const tokenIndex = parseInt(selectedToken);

  const tokenConfig = FAUCET_TOKENS[tokenIndex];
  const { balances, isLoading: isLoadingBalances } = useTokenBalances();
  const { claimInfo, isLoading: isLoadingClaim, refetch } = useClaimInfo(tokenIndex);
  const { claimTokens, isPending, isConfirming, isConfirmed, txHash } = useClaimTokens();
  const tokenContractAddress = useTokenAddress(tokenIndex);

  const isDeployed = CONTRACT_ADDRESSES.faucet !== "0x0000000000000000000000000000000000000000";

  // Refetch claim info when claim is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetch();
    }
  }, [isConfirmed, refetch]);

  // Find balance for the selected token
  const tokenBalance = balances.find((b: TokenBalance) => b.symbol === tokenConfig.symbol);
  const cooldownProgress = FAUCET_COOLDOWN > 0
    ? ((FAUCET_COOLDOWN - claimInfo.timeRemaining) / FAUCET_COOLDOWN) * 100
    : 100;

  return (
    <Card className="w-full border-border bg-card shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Droplet className="h-5 w-5 text-blue-500" />
              Faucet
            </CardTitle>
            <CardDescription className="text-xs">
              Claim 10 tokens per claim, once every 24 hours
            </CardDescription>
          </div>
          {claimInfo.totalClaimed > 0n && (
            <Badge variant="secondary" className="text-[10px]">
              {formatClaimedAmount(claimInfo.totalClaimed, tokenConfig.symbol)} total
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Token Selector Tabs ── */}
        <Tabs value={selectedToken} onValueChange={setSelectedToken} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            {FAUCET_TOKENS.map((t) => (
              <TabsTrigger key={t.index} value={t.index.toString()}>
                <span className={t.color}>{t.symbol}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {FAUCET_TOKENS.map((t) => (
            <TabsContent key={t.index} value={t.index.toString()} className="mt-4 space-y-4">
              {/* Token Address */}
              {tokenContractAddress && tokenContractAddress !== "0x0000000000000000000000000000000000000000" && (
                <TokenAddressDisplay address={tokenContractAddress} />
              )}

              {/* Balance */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Your Balance
                </div>
                <span className="font-mono text-sm font-medium tabular-nums">
                  {isLoadingBalances ? (
                    <Loader2 className="h-3 w-3 animate-spin inline" />
                  ) : (
                    tokenBalance?.formatted ?? "0"
                  )}
                  <span className="text-muted-foreground ml-1">{t.symbol}</span>
                </span>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* ── Cooldown Progress ── always visible */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {claimInfo.canClaim ? "Status" : "Cooldown"}
            </span>
            <span className={cn(
              "font-medium tabular-nums",
              claimInfo.canClaim ? "text-emerald-500" : "text-amber-500"
            )}>
              {claimInfo.canClaim
                ? "✅ Ready to claim"
                : claimInfo.lastClaimTime === 0
                  ? "Checking..."
                  : formatCountdown(claimInfo.timeRemaining)}
            </span>
          </div>
          {!claimInfo.canClaim && claimInfo.lastClaimTime > 0 && (
            <Progress value={Math.max(0, Math.min(100, cooldownProgress))} className="h-2" />
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-0">
        {/* ── Claim Button ── */}
        {!isConnected ? (
          <p className="text-sm text-muted-foreground text-center w-full">
            Connect your wallet to claim tokens
          </p>
        ) : !isDeployed ? (
          <p className="text-sm text-muted-foreground text-center w-full">
            Deploy contracts first via <code className="text-xs bg-secondary px-1 rounded">make deploy-anvil</code>
          </p>
        ) : isLoadingClaim ? (
          <Button disabled className="w-full h-11 text-sm font-semibold">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking eligibility...
          </Button>
        ) : claimInfo.canClaim ? (
          <Button
            onClick={() => claimTokens(tokenIndex)}
            disabled={isPending || isConfirming}
            className="w-full h-11 text-sm font-semibold"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirm in Wallet...
              </>
            ) : isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Droplet className="mr-2 h-4 w-4" />
                Claim 10 {tokenConfig.symbol}
              </>
            )}
          </Button>
        ) : (
          <Button disabled className="w-full h-11 text-sm font-semibold" variant="secondary" size="lg">
            {claimInfo.lastClaimTime === 0
              ? "Checking..."
              : `Next claim in ${formatCountdown(claimInfo.timeRemaining)}`}
          </Button>
        )}

        {/* ── Transaction Hash ── */}
        {txHash && (
          <p className="text-xs text-muted-foreground text-center break-all">
            {isConfirmed ? "✅ Claimed!" : "Tx:"} {txHash.slice(0, 10)}...{txHash.slice(-6)}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Displays a contract address with a copy-to-clipboard button.
 */
function TokenAddressDisplay({ address: addr }: { address: `0x${string}` }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 text-xs">
        <span className="text-muted-foreground">Token Address</span>
        <div className="flex items-center gap-1.5">
          <code className="text-[10px] font-mono truncate max-w-[180px]">{addr}</code>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? "Copied!" : "Copy address"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
