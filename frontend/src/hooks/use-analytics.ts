"use client";

/**
 * Analytics hooks providing on-chain data + simulated analytics for the dashboard.
 *
 * Uses:
 * - On-chain: DEX reserves, swap rate, token balances, native balance
 * - Simulated: Trade history, volume trends, token market data, user activity
 */
import { useMemo } from "react";
import { useAccount, useBalance } from "wagmi";
import { useDexInfo, formatDexBalance } from "@/hooks/use-dex";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { TOKENS, CONTRACT_ADDRESSES } from "@/lib/constants";

// ================================================================
// Types
// ================================================================

export interface TradeRecord {
  id: string;
  timestamp: Date;
  type: "Buy" | "Sell";
  pair: string;
  amount: number;
  price: number;
  total: number;
  user: string;
  txHash: string;
}

export interface TokenStat {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  icon: string;
  color: string;
}

export interface MarketOverview {
  totalVolume24h: number;
  totalTrades24h: number;
  activeUsers24h: number;
  tvl: number;
  volumeChange24h: number;
  usersChange24h: number;
}

export interface PortfolioAsset {
  symbol: string;
  name: string;
  balance: string;
  balanceValue: number;
  price: number;
  icon: string;
  color: string;
}

// ================================================================
// Simulated data
// ================================================================

/** Generate deterministic-but-randomized trade history */
function generateTradeHistory(): TradeRecord[] {
  const trades: TradeRecord[] = [];
  const now = Date.now();
  const types: ("Buy" | "Sell")[] = ["Buy", "Sell"];
  const users = [
    "0x1a2...b3c4",
    "0x5d6...e7f8",
    "0x9g0...h1i2",
    "0xj3k...l4m5",
    "0xn6o...p7q8",
    "0xr9s...t0u1",
    "0xv2w...x3y4",
    "0xz5a...b6c7",
  ];

  for (let i = 0; i < 25; i++) {
    const minutesAgo = Math.floor(Math.random() * 1440); // Last 24 hours
    const isSell = Math.random() > 0.5;
    const ethAmount = parseFloat((Math.random() * 50 + 0.1).toFixed(4));
    const rate = 1700 + (Math.random() - 0.5) * 100; // ~1650-1750
    const usdcAmount = parseFloat((ethAmount * rate).toFixed(2));

    trades.push({
      id: `trade-${i}`,
      timestamp: new Date(now - minutesAgo * 60 * 1000),
      type: isSell ? "Sell" : "Buy",
      pair: isSell ? "mETH → mUSDC" : "mUSDC → mETH",
      amount: isSell ? ethAmount : usdcAmount,
      price: parseFloat(rate.toFixed(2)),
      total: isSell ? usdcAmount : ethAmount,
      user: users[Math.floor(Math.random() * users.length)],
      txHash: `0x${Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("")}`,
    });
  }

  // Sort by timestamp descending (most recent first)
  return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/** Generate mock token statistics */
function generateTokenStats(
  dexRate: number,
): TokenStat[] {
  const baseRate = dexRate || 1700;

  return [
    {
      symbol: "mETH",
      name: "Mock ETH",
      price: baseRate,
      priceChange24h: parseFloat(((Math.random() - 0.5) * 12).toFixed(2)),
      volume24h: parseFloat((Math.random() * 5000 + 1000).toFixed(2)),
      marketCap: parseFloat((Math.random() * 50000 + 10000).toFixed(2)),
      holders: Math.floor(Math.random() * 500 + 50),
      icon: "⟠",
      color: "#627EEA",
    },
    {
      symbol: "mBTC",
      name: "Mock BTC",
      price: parseFloat((baseRate * 28).toFixed(2)),
      priceChange24h: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
      volume24h: parseFloat((Math.random() * 3000 + 500).toFixed(2)),
      marketCap: parseFloat((Math.random() * 80000 + 20000).toFixed(2)),
      holders: Math.floor(Math.random() * 300 + 30),
      icon: "₿",
      color: "#F7931A",
    },
    {
      symbol: "mUSDC",
      name: "Mock USDC",
      price: 1.0,
      priceChange24h: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
      volume24h: parseFloat((Math.random() * 8000 + 2000).toFixed(2)),
      marketCap: parseFloat((Math.random() * 100000 + 50000).toFixed(2)),
      holders: Math.floor(Math.random() * 800 + 100),
      icon: "$",
      color: "#2775CA",
    },
  ];
}

/** Generate market overview from on-chain data + simulated data */
function generateMarketOverview(
  ethReserve: bigint | undefined,
  usdcReserve: bigint | undefined,
): MarketOverview {
  const ethR = ethReserve ? Number(ethReserve) / 1e18 : 10000;
  const usdcR = usdcReserve ? Number(usdcReserve) / 1e18 : 17000000;
  const tvl = ethR * 1700 + usdcR;

  return {
    totalVolume24h: parseFloat((Math.random() * 50000 + 10000).toFixed(2)),
    totalTrades24h: Math.floor(Math.random() * 200 + 50),
    activeUsers24h: Math.floor(Math.random() * 100 + 25),
    tvl: parseFloat(tvl.toFixed(2)),
    volumeChange24h: parseFloat(((Math.random() - 0.5) * 40).toFixed(1)),
    usersChange24h: parseFloat(((Math.random() - 0.5) * 30).toFixed(1)),
  };
}

// ================================================================
// Main Analytics Hook
// ================================================================

export function useAnalytics() {
  const { address, isConnected } = useAccount();
  const { data: nativeBalance } = useBalance({ address });
  const { swapRate, ethReserve, usdcReserve, isLoading, isDeployed } =
    useDexInfo();
  const { balances, isLoading: isLoadingTokens } = useTokenBalances();

  // Derive numeric rate from BigInt
  const dexRate = swapRate ? Number(swapRate) / 1e18 : 1700;

  // Memoized data — regenerate on each poll/re-fetch
  const analyticsData = useMemo(() => {
    return {
      trades: generateTradeHistory(),
      tokens: generateTokenStats(dexRate),
      market: generateMarketOverview(ethReserve, usdcReserve),
      dexRate,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dexRate,
    ethReserve?.toString(),
    usdcReserve?.toString(),
  ]);

  // Build portfolio from connected wallet balances
  const portfolio = useMemo((): PortfolioAsset[] => {
    const assets: PortfolioAsset[] = [];

    for (const token of TOKENS) {
      const bal = balances.find((b) => b.symbol === token.symbol);
      const tokenStat = analyticsData.tokens.find(
        (t) => t.symbol === token.symbol,
      );
      const balanceValue = bal
        ? parseFloat(bal.formatted.replace(/,/g, "")) * (tokenStat?.price ?? 0)
        : 0;

      assets.push({
        symbol: token.symbol,
        name: token.name,
        balance: bal ? bal.formatted : "0",
        balanceValue,
        price: tokenStat?.price ?? 0,
        icon: token.icon,
        color: token.color,
      });
    }

    // Add native ETH
    if (nativeBalance) {
      assets.push({
        symbol: "ETH",
        name: "Ether",
        balance: parseFloat(nativeBalance.formatted).toFixed(4),
        balanceValue: parseFloat(nativeBalance.formatted) * dexRate / 1700, // Approximate ETH/USD
        price: parseFloat((dexRate / 1700 * 3000).toFixed(2)), // Approximate
        icon: "◆",
        color: "#8A8A8A",
      });
    }

    return assets;
  }, [balances, analyticsData.tokens, nativeBalance, dexRate]);

  const totalPortfolioValue = useMemo(() => {
    return portfolio.reduce((sum, asset) => sum + asset.balanceValue, 0);
  }, [portfolio]);

  return {
    /** Market overview metrics */
    market: analyticsData.market,
    /** Token statistics (simulated + on-chain price) */
    tokens: analyticsData.tokens,
    /** Recent trade history (simulated) */
    trades: analyticsData.trades,
    /** Connected wallet's portfolio */
    portfolio,
    /** Total portfolio value in USD */
    totalPortfolioValue,
    /** Current DEX swap rate */
    dexRate: analyticsData.dexRate,
    /** Loading states */
    isLoading: isLoading || isLoadingTokens,
    /** Whether connected wallet */
    isConnected,
    /** Whether DEX is deployed */
    isDeployed,
  };
}
