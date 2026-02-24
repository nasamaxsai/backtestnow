import { NextRequest, NextResponse } from "next/server";

interface Parameter {
  name: string;
  min: string;
  max: string;
  step: string;
  enabled: boolean;
  defaultVal: string;
}

interface BacktestRequest {
  code: string;
  params: Parameter[];
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  maxCombinations: number;
  strategyName: string;
}

// Generate all parameter combinations (up to maxCombinations)
function generateCombinations(params: Parameter[], maxCombinations: number) {
  const enabledParams = params.filter((p) => p.enabled);
  const ranges = enabledParams.map((p) => {
    const steps: number[] = [];
    const min = Number(p.min);
    const max = Number(p.max);
    const step = Number(p.step) || 1;
    for (let v = min; v <= max; v = Math.round((v + step) * 1e10) / 1e10) {
      steps.push(v);
    }
    return { name: p.name, values: steps };
  });

  const combinations: Record<string, number>[] = [];
  function recurse(idx: number, current: Record<string, number>) {
    if (combinations.length >= maxCombinations) return;
    if (idx === ranges.length) {
      combinations.push({ ...current });
      return;
    }
    for (const v of ranges[idx].values) {
      if (combinations.length >= maxCombinations) break;
      current[ranges[idx].name] = v;
      recurse(idx + 1, current);
    }
  }
  recurse(0, {});
  return combinations;
}

// Simulate backtest for a given parameter set (deterministic mock)
function simulateBacktest(combo: Record<string, number>, symbol: string, timeframe: string) {
  // Pseudo-random but deterministic based on params
  const seed = Object.values(combo).reduce((a, b) => a + b, 0);
  const rng = (offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  const trades = Math.floor(rng(1) * 200 + 30);
  const winrate = rng(2) * 30 + 45; // 45-75%
  const avgWin = rng(3) * 3 + 1.5;
  const avgLoss = rng(4) * 2 + 0.8;
  const profitFactor = (winrate / 100 * avgWin) / ((1 - winrate / 100) * avgLoss);
  const totalReturn = (winrate / 100 * avgWin - (1 - winrate / 100) * avgLoss) * trades;
  const volatility = rng(5) * 15 + 5;
  const sharpe = totalReturn / volatility / Math.sqrt(252);
  const maxDrawdown = rng(6) * 25 + 5;

  return {
    combo,
    trades,
    winrate: Number(winrate.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(3)),
    totalReturn: Number(totalReturn.toFixed(2)),
    volatility: Number(volatility.toFixed(2)),
    sharpe: Number(sharpe.toFixed(3)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: BacktestRequest = await req.json();
    const { params, symbol, timeframe, startDate, endDate, maxCombinations, strategyName, code } = body;

    if (!params || params.length === 0) {
      return NextResponse.json({ error: "No parameters provided" }, { status: 400 });
    }

    // Generate combinations
    const combinations = generateCombinations(params, maxCombinations);

    // Run simulated backtests
    const results = combinations.map((combo) =>
      simulateBacktest(combo, symbol, timeframe)
    );

    // Sort by Sharpe ratio
    results.sort((a, b) => b.sharpe - a.sharpe);

    // Top results
    const topResults = results.slice(0, 50).map((r, i) => ({
      rank: i + 1,
      ...r,
    }));

    // Build equity curve for best result
    const equityCurve = Array.from({ length: 100 }, (_, i) => ({
      day: i,
      equity: 10000 * (1 + topResults[0].totalReturn / 100 * (i / 100)) * (1 + (Math.sin(i * 0.3) * 0.02)),
      benchmark: 10000 * (1 + 0.008 * i),
    }));

    const response = {
      success: true,
      strategyName,
      symbol,
      timeframe,
      startDate,
      endDate,
      totalCombinations: combinations.length,
      executedAt: new Date().toISOString(),
      bestResult: topResults[0],
      topResults,
      equityCurve,
      summary: {
        avgSharpe: (results.reduce((s, r) => s + r.sharpe, 0) / results.length).toFixed(3),
        avgWinrate: (results.reduce((s, r) => s + r.winrate, 0) / results.length).toFixed(2),
        maxSharpe: topResults[0].sharpe,
        maxReturn: Math.max(...results.map((r) => r.totalReturn)).toFixed(2),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Backtest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
