/**
 * CoinGecko API client for fetching OHLC candlestick data and market stats.
 *
 * Uses NEXT_PUBLIC_COINGECKO_API_KEY from env (optional but recommended).
 * CoinGecko's free API now requires an API key for all requests.
 * Without a key, the chart will fall back to simulated data.
 *
 * Get a free API key: https://www.coingecko.com/en/api
 *
 * Rate limits (free tier):
 *   - Demo key: 30 calls/min, 10k calls/month
 */

// ================================================================
// Types
// ================================================================

export interface CandleData {
  /** Unix timestamp in milliseconds */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MarketStats {
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
}

// ================================================================
// Helpers
// ================================================================

/** Returns the CoinGecko API base URL */
const API_BASE = "https://api.coingecko.com/api/v3";

/** Builds headers with optional API key */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const apiKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }
  return headers;
}

// ================================================================
// API Functions
// ================================================================

/**
 * Fetches OHLC candlestick data for a given coin.
 *
 * @param coinId - CoinGecko coin ID (e.g., "bitcoin", "ethereum")
 * @param days - Number of days of data (1, 7, 14, 30, 90, 180, 365, max)
 * @returns Array of CandleData objects
 */
export async function fetchOHLC(
  coinId: string,
  days: number = 7,
): Promise<CandleData[]> {
  const url = `${API_BASE}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;

  const response = await fetch(url, { headers: buildHeaders() });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limited by CoinGecko API. Try again later.");
    }
    if (response.status === 404) {
      throw new Error(`Coin "${coinId}" not found on CoinGecko.`);
    }
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data: [number, number, number, number, number][] = await response.json();

  return data.map(([time, open, high, low, close]) => ({
    time,
    open,
    high,
    low,
    close,
  }));
}

/**
 * Fetches 24h market stats for a given coin.
 *
 * @param coinId - CoinGecko coin ID
 * @returns MarketStats object
 */
export async function fetchMarketStats(coinId: string): Promise<MarketStats> {
  const url = `${API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

  const response = await fetch(url, { headers: buildHeaders() });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limited by CoinGecko API.");
    }
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const data = await response.json();
  const m = data.market_data;

  return {
    currentPrice: m.current_price.usd,
    priceChange24h: m.price_change_24h,
    priceChangePercent24h: m.price_change_percentage_24h,
    high24h: m.high_24h.usd,
    low24h: m.low_24h.usd,
    volume24h: m.total_volume.usd,
    marketCap: m.market_cap.usd,
  };
}

/**
 * Generates simulated OHLC data when CoinGecko is unavailable or rate-limited.
 * Creates realistic-looking candlestick data around a base price.
 */
export function generateSimulatedOHLC(
  days: number = 7,
  basePrice: number = 3000,
  volatility: number = 0.03,
): CandleData[] {
  const now = Date.now();
  const candles: CandleData[] = [];
  const intervalMs = days * 24 * 60 * 60 * 1000;
  const numCandles = days * 24; // 1-hour candles

  let price = basePrice;

  for (let i = 0; i < numCandles; i++) {
    const time = now - intervalMs + (i * intervalMs) / numCandles;

    // Random walk with mean reversion
    const drift = (basePrice - price) * 0.001;
    const shock = (Math.random() - 0.5) * 2 * volatility * price;
    const open = price;
    const change = drift + shock;
    const close = Math.max(price + change, basePrice * 0.5);
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

    candles.push({ time: Math.round(time), open, high, low, close });
    price = close;
  }

  return candles;
}

/**
 * Generates simulated market stats when CoinGecko is unavailable.
 */
export function generateSimulatedStats(basePrice: number): MarketStats {
  const change = (Math.random() - 0.5) * basePrice * 0.1;
  return {
    currentPrice: basePrice,
    priceChange24h: change,
    priceChangePercent24h: (change / basePrice) * 100,
    high24h: basePrice * 1.05,
    low24h: basePrice * 0.95,
    volume24h: Math.random() * 5_000_000_000 + 1_000_000_000,
    marketCap: basePrice * 100_000_000,
  };
}
