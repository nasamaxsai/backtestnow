import { NextResponse } from "next/server";

const ASSETS = [
  { symbol: "BTC/USDT", name: "Bitcoin", basePrice: 66353.14, type: "crypto" },
  { symbol: "ETH/USDT", name: "Ethereum", basePrice: 1929.38, type: "crypto" },
  { symbol: "SOL/USDT", name: "Solana", basePrice: 80.93, type: "crypto" },
  { symbol: "BNB/USDT", name: "Binance Coin", basePrice: 611.63, type: "crypto" },
  { symbol: "GC", name: "Gold Futures", basePrice: 5173, type: "futures" },
  { symbol: "NQ", name: "Nasdaq Futures", basePrice: 24930, type: "futures" },
  { symbol: "ES", name: "S&P Futures", basePrice: 6897, type: "futures" },
  { symbol: "SIL", name: "Silver Futures", basePrice: 86, type: "futures" },
];

export async function GET() {
  try {
    let cryptoPrices: Record<string, number> = {};
    try {
      const res = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?symbols=[%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22BNBUSDT%22]",
        { next: { revalidate: 60 } }
      );
      if (res.ok) {
        const data = await res.json();
        data.forEach((ticker: { symbol: string; lastPrice: string; priceChangePercent: string }) => {
          const sym = ticker.symbol.replace("USDT", "/USDT");
          cryptoPrices[sym] = {
            price: parseFloat(ticker.lastPrice),
            change: parseFloat(ticker.priceChangePercent),
          } as unknown as number;
        });
      }
    } catch {
      // Fall back to mock data
    }

    const prices = ASSETS.map((asset) => {
      const realData = cryptoPrices[asset.symbol] as unknown as { price: number; change: number } | undefined;
      const randomChange = (Math.random() - 0.5) * 4;
      return {
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        price: realData?.price ?? asset.basePrice * (1 + randomChange / 100),
        change: realData?.change ?? randomChange,
        updatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({ prices, updatedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
