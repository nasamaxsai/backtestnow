import { NextRequest, NextResponse } from "next/server";

// In-memory store (replace with DB in production)
// In Railway, this resets on redeploy — for persistence use a DB
declare global {
  // eslint-disable-next-line no-var
  var __strategies: Strategy[] | undefined;
  // eslint-disable-next-line no-var
  var __results: BacktestRecord[] | undefined;
}

export interface Strategy {
  id: string;
  name: string;
  pineScript: string;
  inputs: unknown[];
  description: string;
  createdAt: number;
  lastBacktest?: number;
  backtestCount: number;
}

export interface BacktestRecord {
  id: string;
  strategyId?: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  initialCapital: number;
  finalEquity: number;
  params: Record<string, number>;
  createdAt: number;
  // full result stored separately
  fullResult?: unknown;
}

function getStrategies(): Strategy[] {
  if (!global.__strategies) global.__strategies = [];
  return global.__strategies;
}

function getResults(): BacktestRecord[] {
  if (!global.__results) global.__results = [];
  return global.__results;
}

// GET /api/strategies - list all strategies and recent backtests
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "strategies";
  const id = searchParams.get("id");

  if (type === "result" && id) {
    const rec = getResults().find(r => r.id === id);
    if (!rec) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, result: rec });
  }

  if (type === "results") {
    return NextResponse.json({ success: true, results: getResults().slice().reverse() });
  }

  return NextResponse.json({ success: true, strategies: getStrategies() });
}

// POST /api/strategies - save strategy or backtest result
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  if (action === "saveStrategy") {
    const { name, pineScript, inputs, description } = body;
    const strategies = getStrategies();
    const existing = strategies.find(s => s.name === name);
    if (existing) {
      existing.pineScript = pineScript;
      existing.inputs = inputs ?? [];
      existing.description = description ?? "";
      return NextResponse.json({ success: true, strategy: existing });
    }
    const strategy: Strategy = {
      id: Math.random().toString(36).slice(2, 10),
      name: name ?? "未命名策略",
      pineScript,
      inputs: inputs ?? [],
      description: description ?? "",
      createdAt: Date.now(),
      backtestCount: 0,
    };
    strategies.unshift(strategy);
    if (strategies.length > 50) strategies.length = 50;
    return NextResponse.json({ success: true, strategy });
  }

  if (action === "saveResult") {
    const { result, strategyId } = body;
    const results = getResults();
    const record: BacktestRecord = {
      id: result.id ?? Math.random().toString(36).slice(2, 10),
      strategyId,
      strategyName: result.strategyName,
      symbol: result.symbol,
      timeframe: result.timeframe,
      startDate: result.startDate,
      endDate: result.endDate,
      totalReturn: result.totalReturn,
      sharpeRatio: result.sharpeRatio,
      maxDrawdown: result.maxDrawdown,
      winRate: result.winRate,
      totalTrades: result.totalTrades,
      profitFactor: result.profitFactor,
      initialCapital: result.initialCapital,
      finalEquity: result.finalEquity,
      params: result.params ?? {},
      createdAt: Date.now(),
      fullResult: result,
    };
    results.unshift(record);
    if (results.length > 200) results.length = 200;

    // Update strategy backtest count
    if (strategyId) {
      const s = getStrategies().find(s => s.id === strategyId);
      if (s) { s.backtestCount++; s.lastBacktest = Date.now(); }
    }

    return NextResponse.json({ success: true, record });
  }

  if (action === "deleteStrategy") {
    const { id } = body;
    const strategies = getStrategies();
    const idx = strategies.findIndex(s => s.id === id);
    if (idx >= 0) strategies.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
