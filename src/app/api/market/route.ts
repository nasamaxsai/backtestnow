import { NextResponse } from "next/server";

const COINS = [
  { symbol: "BTCUSDT", id: "bitcoin", name: "Bitcoin" },
  { symbol: "ETHUSDT", id: "ethereum", name: "Ethereum" },
  { symbol: "SOLUSDT", id: "solana", name: "Solana" },
  { symbol: "BNBUSDT", id: "binancecoin", name: "BNB" },
  { symbol: "XRPUSDT", id: "ripple", name: "XRP" },
  { symbol: "ADAUSDT", id: "cardano", name: "Cardano" },
];

export async function GET() {
  try {
    const ids = COINS.map(c => c.id).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    const market = COINS.map(coin => {
      const d = data[coin.id] ?? {};
      return {
        symbol: coin.symbol,
        name: coin.name,
        price: d.usd ?? 0,
        change24h: d.usd_24h_change ?? 0,
        volume24h: d.usd_24h_vol ?? 0,
        marketCap: d.usd_market_cap ?? 0,
      };
    });

    return NextResponse.json({ success: true, market, updatedAt: Date.now() });
  } catch {
    // Fallback static data
    const market = [
      { symbol: "BTCUSDT", name: "Bitcoin", price: 67234, change24h: 2.34, volume24h: 28000000000, marketCap: 1320000000000 },
      { symbol: "ETHUSDT", name: "Ethereum", price: 3521, change24h: 1.87, volume24h: 14000000000, marketCap: 423000000000 },
      { symbol: "SOLUSDT", name: "Solana", price: 182, change24h: -0.92, volume24h: 3200000000, marketCap: 79000000000 },
      { symbol: "BNBUSDT", name: "BNB", price: 412, change24h: 0.54, volume24h: 1800000000, marketCap: 61000000000 },
      { symbol: "XRPUSDT", name: "XRP", price: 0.62, change24h: -1.2, volume24h: 2100000000, marketCap: 34000000000 },
      { symbol: "ADAUSDT", name: "Cardano", price: 0.48, change24h: 3.1, volume24h: 890000000, marketCap: 17000000000 },
    ];
    return NextResponse.json({ success: true, market, updatedAt: Date.now(), fallback: true });
  }
}
