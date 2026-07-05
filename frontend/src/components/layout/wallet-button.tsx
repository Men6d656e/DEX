"use client";

/**
 * Enhanced wallet connection button.
 *
 * When disconnected: Shows "Connect Wallet" button.
 * When connected: Shows network name + truncated address with
 * dropdown showing full address, native balance, and mock token balances.
 */
import { useAccount, useConnect, useDisconnect, useBalance, useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { wagmiConfig } from "@/lib/wagmi";

/**
 * Truncates an Ethereum address for display.
 * Example: 0x1234...5678
 */
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Returns the chain name for a given chain ID.
 */
function getChainName(chainId: number): string {
  const chain = wagmiConfig.chains.find((c) => c.id === chainId);
  return chain?.name ?? `Chain ${chainId}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: nativeBalance } = useBalance({ address });
  const { balances, isLoading: isLoadingTokens } = useTokenBalances();

  // ── Disconnected state ──
  if (!isConnected || !address) {
    return (
      <Button
        onClick={() => connect({ connector: connectors[0] })}
        size="sm"
        className="font-medium"
      >
        Connect Wallet
      </Button>
    );
  }

  // ── Connected state ──
  const chainName = getChainName(chainId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
          <span className="hidden sm:inline text-muted-foreground font-sans text-[10px] uppercase tracking-wider">
            {chainName}
          </span>
          {truncateAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Wallet Header */}
        <DropdownMenuLabel className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{chainName}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Full Address */}
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
            Address
          </p>
          <p className="font-mono text-xs truncate">{address}</p>
        </div>
        <DropdownMenuSeparator />

        {/* Native Balance */}
        {nativeBalance && (
          <div className="px-2 py-1.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Native Balance
            </p>
            <p className="font-mono text-xs">
              {Number(nativeBalance.formatted).toFixed(4)} {nativeBalance.symbol}
            </p>
          </div>
        )}

        {/* Mock Token Balances */}
        <div className="px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Mock Tokens
          </p>
          {isLoadingTokens ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : balances.length > 0 ? (
            <div className="space-y-0.5">
              {balances.map((b) => (
                <div
                  key={b.symbol}
                  className="flex items-center justify-between font-mono text-xs"
                >
                  <span>{b.symbol}</span>
                  <span className="tabular-nums">{b.formatted}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No contracts deployed
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
