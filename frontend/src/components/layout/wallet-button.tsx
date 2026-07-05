"use client";

/**
 * Wallet connection button.
 *
 * When disconnected: Shows "Connect Wallet" button.
 * When connected: Shows truncated address with balance dropdown.
 */
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Truncates an Ethereum address for display.
 * Example: 0x1234...5678
 */
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 inline-block" />
          {truncateAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="font-mono text-xs" disabled>
          {address}
        </DropdownMenuItem>
        {balance && (
          <DropdownMenuItem className="text-xs" disabled>
            Balance: {Number(balance.formatted).toFixed(4)} {balance.symbol}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
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
