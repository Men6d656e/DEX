"use client";

/**
 * Hook for fetching and caching CoinGecko market data.
 *
 * Fetches OHLC candlestick data and 24h market stats for a given coin.
 * Falls back to simulated data when the API is rate-limited or unavailable.
 *
 * CoinGecko API is rate-limited (10-30 req/min free tier). An API key
 * can be set via NEXT_PUBLIC_COINGECKO_API_KEY for higher limits.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchOHLC,
  fetchMarketStats,
  generateSimulatedOHLC,
  generateSimulatedStats,
  type CandleData,
  type MarketStats,
} from "@/lib/market-data";

/** Coin IDs available for charting */
export const CHART_COINS = [
  { id: "ethereum", label: "mETH (Ethereum)", color: "#627EEA" },
  { id: "bitcoin", label: "mBTC (Bitcoin)", color: "#F7931A" },
  { id: "usd-coin", label: "mUSDC (USDC)", color: "#2775CA" },
] as const;

export type ChartCoinId = (typeof CHART_COINS)[number]["id"];

/** Available data ranges */
export const DAY_RANGES = [1, 7, 14, 30] as const;
export type DayRange = (typeof DAY_RANGES)[number];

interface MarketDataResult {
  candles: CandleData[];
  stats: MarketStats | null;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  isSimulated: boolean;
  refetch: () => void;
}

/** Base prices for simulated data fallback */
const SIM_BASE_PRICES: Record<string, number> = {
  ethereum: 3000,
  bitcoin: 65000,
  "usd-coin": 1,
};

/**
 * Fetches live CoinGecko market data with simulated fallback.
 *
 * @param coinId - CoinGecko coin ID (e.g. "bitcoin", "ethereum")
 * @param days - Number of days of OHLC data
 */
export function useMarketData(
  coinId: ChartCoinId = "ethereum",
  days: DayRange = 7,
): MarketDataResult {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    setIsSimulated(false);

    try {
      // Try fetching real data
      const [ohlcData, marketStats] = await Promise.all([
        fetchOHLC(coinId, days),
        fetchMarketStats(coinId),
      ]);

      if (!mountedRef.current) return;

      setCandles(ohlcData);
      setStats(marketStats);
      setIsSimulated(false);
    } catch (err) {
      if (!mountedRef.current) return;

      console.warn(
        `CoinGecko API error for ${coinId}:`,
        err instanceof Error ? err.message : err,
      );

      // Fall back to simulated data
      const basePrice = SIM_BASE_PRICES[coinId] ?? 100;
      setCandles(generateSimulatedOHLC(days, basePrice));
      setStats(generateSimulatedStats(basePrice));
      setIsSimulated(true);
      setIsError(true);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to fetch market data",
      );
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [coinId, days]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // Refresh every 60 seconds when using real data (not simulated)
  useEffect(() => {
    if (isSimulated) return;

    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData, isSimulated]);

  return {
    candles,
    stats,
    isLoading,
    isError,
    errorMessage,
    isSimulated,
    refetch: fetchData,
  };
}
