import { NextRequest, NextResponse } from "next/server";

// CoinGecko coin ID map
const SYMBOL_TO_ID: Record<string, string> = {
  BTCUSDT: "bitcoin",
  ETHUSDT: "ethereum",
  SOLUSDT: "solana",
  BNBUSDT: "binancecoin",
  XRPUSDT: "ripple",
  ADAUSDT: "cardano",
  DOGEUSDT: "dogecoin",
  AVAXUSDT: "avalanche-2",
  LINKUSDT: "chainlink",
  MATICUSDT: "matic-network",
  DOTUSDT: "polkadot",
  LTCUSDT: "litecoin",
};

// Timeframe to CoinGecko days param
function getDays(timeframe: string, startDate: string, endDate: string): number {
  const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
  const days = Math.ceil(ms / 86400000);
  return Math.min(Math.max(days, 1), 365);
}

// Aggregate minute data into OHLCV bars for the requested timeframe
function aggregateBars(
  prices: [number, number][],
  timeframe: string
): { time: number; open: number; high: number; low: number; close: number; volume: number }[] {
  if (!prices || prices.length === 0) return [];

  const tfMs: Record<string, number> = {
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "30m": 1800000,
    "1h": 3600000,
    "4h": 14400000,
    "1d": 86400000,
    "1w": 604800000,
  };
  const barMs = tfMs[timeframe] ?? 3600000;

  const bars: { time: number; open: number; high: number; low: number; close: number; volume: number }[] = [];
  let barStart = Math.floor(prices[0][0] / barMs) * barMs;
  let open = prices[0][1], high = prices[0][1], low = prices[0][1], close = prices[0][1];
  let vol = 0;

  for (const [ts, price] of prices) {
    if (ts >= barStart + barMs) {
      bars.push({ time: barStart, open, high, low, close, volume: vol });
      barStart = Math.floor(ts / barMs) * barMs;
      open = price; high = price; low = price; close = price; vol = 0;
    } else {
      high = Math.max(high, price);
      low = Math.min(low, price);
      close = price;
      vol += price * 0.001; // synthetic volume
    }
  }
  bars.push({ time: barStart, open, high, low, close, volume: vol });
  return bars;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "BTCUSDT";
  const timeframe = searchParams.get("timeframe") ?? "1h";
  const startDate = searchParams.get("startDate") ?? new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
  const endDate = searchParams.get("endDate") ?? new Date().toISOString().split("T")[0];

  const coinId = SYMBOL_TO_ID[symbol] ?? "bitcoin";
  const days = getDays(timeframe, startDate, endDate);

  try {
    // CoinGecko free API - market chart
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) {
      throw new Error(`CoinGecko error: ${res.status}`);
    }

    const data = await res.json();
    const prices: [number, number][] = data.prices ?? [];

    // Filter by date range
    const startMs = new Date(startDate).getTime();
    const endMs = new Date(endDate).getTime() + 86400000;
    const filtered = prices.filter(([ts]) => ts >= startMs && ts <= endMs);

    const bars = aggregateBars(filtered.length > 0 ? filtered : prices, timeframe);

    // Also get current price for live display
    const currentPrice = prices.length > 0 ? prices[prices.length - 1][1] : 0;
    const prevPrice = prices.length > 1 ? prices[prices.length - 2][1] : currentPrice;
    const change24h = prevPrice > 0 ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;

    return NextResponse.json({
      success: true,
      symbol,
      coinId,
      currentPrice: Math.round(currentPrice * 100) / 100,
      change24h: Math.round(change24h * 100) / 100,
      bars,
      totalBars: bars.length,
    });
  } catch (err) {
    console.error("Price fetch error:", err);
    // Fallback: generate synthetic bars
    const bars = generateSyntheticBars(symbol, startDate, endDate, timeframe);
    return NextResponse.json({ success: true, symbol, bars, synthetic: true, totalBars: bars.length });
  }
}

// Fallback synthetic data if CoinGecko fails
function generateSyntheticBars(symbol: string, startDate: string, endDate: string, timeframe: string) {
  const BASE_PRICES: Record<string, number> = {
    BTCUSDT: 45000, ETHUSDT: 2800, SOLUSDT: 120, BNBUSDT: 380,
    XRPUSDT: 0.6, ADAUSDT: 0.5, DOGEUSDT: 0.12, AVAXUSDT: 35,
  };
  const base = BASE_PRICES[symbol] ?? 1000;
  const tfMs: Record<string, number> = {
    "1m": 60000, "5m": 300000, "15m": 900000, "30m": 1800000,
    "1h": 3600000, "4h": 14400000, "1d": 86400000,
  };
  const barMs = tfMs[timeframe] ?? 3600000;
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const bars = [];
  let price = base;
  let seed = 12345;
  const rng = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return (seed >>> 0) / 0x100000000; };

  for (let t = startMs; t <= endMs; t += barMs) {
    const vol = (rng() - 0.5) * 0.03;
    price *= 1 + vol;
    const range = price * (rng() * 0.02 + 0.005);
    const open = price;
    const close = price * (1 + (rng() - 0.5) * 0.01);
    bars.push({
      time: t,
      open: Math.round(open * 100) / 100,
      high: Math.round((Math.max(open, close) + range) * 100) / 100,
      low: Math.round((Math.min(open, close) - range) * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.round(rng() * 1000000),
    });
    price = close;
  }
  return bars;
}
