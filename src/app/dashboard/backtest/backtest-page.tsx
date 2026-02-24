"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BarChart3, ArrowLeft, Play, Clock, Calendar,
  TrendingUp, AlertCircle, CheckCircle2, Loader2,
  Target, DollarSign, Percent, Activity, Code2
} from "lucide-react";

const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC/USDT", name: "比特幣" },
  { value: "ETHUSDT", label: "ETH/USDT", name: "以太坊" },
  { value: "SOLUSDT", label: "SOL/USDT", name: "Solana" },
  { value: "BNBUSDT", label: "BNB/USDT", name: "幣安幣" },
  { value: "XRPUSDT", label: "XRP/USDT", name: "瑞波幣" },
  { value: "ADAUSDT", label: "ADA/USDT", name: "Cardano" },
  { value: "DOGEUSDT", label: "DOGE/USDT", name: "狗狗幣" },
  { value: "AVAXUSDT", label: "AVAX/USDT", name: "Avalanche" },
];

const TIMEFRAMES = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
  { value: "1w", label: "1w" },
];

const PINE_PLACEHOLDER = `//@version=5
strategy("My RSI Strategy", overlay=true)

// 輸入參數
rsiLength = input.int(14, "RSI Length", minval=5, maxval=50)
overbought = input.int(70, "Overbought", minval=60, maxval=90)
oversold   = input.int(30, "Oversold",   minval=10, maxval=40)

// 指標計算
rsi = ta.rsi(close, rsiLength)

// 進出場邏輯
if rsi < oversold
    strategy.entry("Long", strategy.long)
if rsi > overbought
    strategy.close("Long")`;

type BacktestResult = {
  strategyName: string;
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  parsedParams: Record<string, number>;
};

function BacktestPageInner() {
  const searchParams = useSearchParams();
  const urlSymbol = searchParams.get("symbol");

  const defaultSymbol = urlSymbol
    ? SYMBOLS.find((s) => s.label === urlSymbol)?.value ?? "BTCUSDT"
    : "BTCUSDT";

  const [symbol, setSymbol] = useState(defaultSymbol);
  const [timeframe, setTimeframe] = useState("4h");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2026-02-01");
  const [initialCapital, setInitialCapital] = useState(10000);
  const [commission, setCommission] = useState(0.1);
  const [pineScript, setPineScript] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const runBacktest = async () => {
    if (!pineScript.trim()) {
      setError("請先貼上 Pine Script 策略代碼");
      return;
    }
    setRunning(true);
    setResult(null);
    setError("");
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) { clearInterval(progressInterval); return prev; }
        return prev + Math.random() * 12;
      });
    }, 300);

    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pineScript,
          symbol,
          timeframe,
          startDate,
          endDate,
          initialCapital,
          commission,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "回測失敗");
      setResult(data);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "回測執行失敗，請稍後再試");
    } finally {
      setRunning(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const selectedSymbolInfo = SYMBOLS.find((s) => s.value === symbol);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass border-b border-indigo-500/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">返回 Dashboard</span>
            </Link>
            <div className="w-px h-5 bg-indigo-500/20" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white">Pine Script 回測</span>
            </div>
          </div>
          <button
            onClick={runBacktest}
            disabled={running || !pineScript.trim()}
            className="btn-primary flex items-center gap-2 py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {running
              ? <><Loader2 className="w-4 h-4 animate-spin" /> 執行中...</>
              : <><Play className="w-4 h-4" /> 執行回測</>}
          </button>
        </div>
        {running && (
          <div className="h-1 bg-dark-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: Settings */}
          <div className="lg:col-span-1 space-y-6">

            {/* Symbol & Timeframe */}
            <div className="glass-card p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" /> 回測標的
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">交易對</label>
                  <select
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="input-dark w-full"
                  >
                    {SYMBOLS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label} ({s.name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">時間週期</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf.value}
                        onClick={() => setTimeframe(tf.value)}
                        className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                          timeframe === tf.value
                            ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50"
                            : "glass text-slate-400 hover:text-white border border-transparent"
                        }`}
                      >
                        {tf.value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="glass-card p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" /> 回測區間
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">開始日期</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-dark w-full"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">結束日期</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-dark w-full"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">快速選擇</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "3M", months: 3 },
                      { label: "6M", months: 6 },
                      { label: "1Y", months: 12 },
                      { label: "2Y", months: 24 },
                      { label: "3Y", months: 36 },
                      { label: "5Y", months: 60 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          const end = new Date();
                          const start = new Date();
                          start.setMonth(start.getMonth() - preset.months);
                          setStartDate(start.toISOString().split("T")[0]);
                          setEndDate(end.toISOString().split("T")[0]);
                        }}
                        className="py-1.5 px-2 rounded-lg text-xs glass text-slate-400 hover:text-white border border-transparent hover:border-indigo-500/30 transition-all"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Capital Settings */}
            <div className="glass-card p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-400" /> 資金設定
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">初始資金 (USDT)</label>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className="input-dark w-full"
                    min={100}
                    step={1000}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm mb-2 block">手續費率 (%)</label>
                  <input
                    type="number"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    className="input-dark w-full"
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <p className="text-slate-500 text-xs mt-1">Binance 現貨約 0.1%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Pine Script + Results */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pine Script Editor */}
            <div className="glass-card p-6">
              <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                Pine Script 策略代碼
              </h2>
              <textarea
                value={pineScript}
                onChange={(e) => setPineScript(e.target.value)}
                placeholder={PINE_PLACEHOLDER}
                className="w-full h-72 bg-black/40 border border-indigo-500/20 rounded-xl p-4 text-sm font-mono text-slate-300 placeholder-slate-600 resize-y focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                spellCheck={false}
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-slate-500 text-xs">
                  貼上你的 TradingView Pine Script v5 策略代碼，系統將自動解析參數並執行回測
                </p>
                {pineScript && (
                  <button
                    onClick={() => { setPineScript(""); setResult(null); setError(""); }}
                    className="text-xs text-slate-500 hover:text-red-400 transition-colors ml-4 shrink-0"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>

            {/* Pre-run summary */}
            {!result && !running && !error && pineScript.trim() && (
              <div className="glass-card p-6">
                <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" /> 回測摘要
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  {[
                    { label: "交易對", value: selectedSymbolInfo?.label ?? symbol },
                    { label: "時間週期", value: TIMEFRAMES.find((t) => t.value === timeframe)?.label ?? timeframe },
                    { label: "回測期間", value: `${startDate} ~ ${endDate}` },
                    { label: "初始資金", value: `$${initialCapital.toLocaleString()} USDT` },
                    { label: "手續費率", value: `${commission}%` },
                    { label: "代碼行數", value: `${pineScript.split("\n").length} 行` },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/5">
                      <div className="text-slate-500 text-xs mb-1">{item.label}</div>
                      <div className="text-white font-medium text-sm">{item.value}</div>
                    </div>
                  ))}
                </div>
                <button onClick={runBacktest} className="btn-primary w-full mt-5 flex items-center justify-center gap-2 py-3">
                  <Play className="w-4 h-4" /> 執行回測
                </button>
              </div>
            )}

            {/* Empty state */}
            {!result && !running && !error && !pineScript.trim() && (
              <div className="glass-card p-10 text-center border border-dashed border-indigo-500/20">
                <Code2 className="w-12 h-12 text-indigo-500/40 mx-auto mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">貼上你的策略代碼</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  在上方編輯器貼上 TradingView Pine Script 策略，設定回測參數後點擊「執行回測」
                </p>
              </div>
            )}

            {/* Running */}
            {running && (
              <div className="glass-card p-10 text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">回測執行中...</h3>
                <p className="text-slate-400 text-sm mb-4">
                  正在對 {selectedSymbolInfo?.label} 執行策略回測
                </p>
                <div className="max-w-xs mx-auto">
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs mt-2">{Math.round(Math.min(progress, 100))}%</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="glass-card p-6 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-red-400 font-medium mb-1">回測失敗</h3>
                    <p className="text-slate-400 text-sm">{error}</p>
                    <button onClick={runBacktest} className="btn-primary text-sm py-2 mt-3">
                      重新執行
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {result && !running && (
              <div className="space-y-4">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-white font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 回測結果
                    </h2>
                    <span className="text-slate-400 text-sm">
                      {selectedSymbolInfo?.label} · {result.strategyName}
                    </span>
                  </div>

                  {/* Main metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className={`text-2xl font-bold font-mono ${result.totalReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {result.totalReturn >= 0 ? "+" : ""}{result.totalReturn.toFixed(2)}%
                      </div>
                      <div className="text-slate-400 text-xs mt-1">總報酬率</div>
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                      <div className="text-2xl font-bold font-mono text-indigo-300">
                        {result.sharpeRatio.toFixed(2)}
                      </div>
                      <div className="text-slate-400 text-xs mt-1">Sharpe Ratio</div>
                    </div>
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                      <div className="text-2xl font-bold font-mono text-red-400">
                        -{result.maxDrawdown.toFixed(2)}%
                      </div>
                      <div className="text-slate-400 text-xs mt-1">最大回撤</div>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                      <div className="text-2xl font-bold font-mono text-purple-300">
                        {result.winRate.toFixed(1)}%
                      </div>
                      <div className="text-slate-400 text-xs mt-1">勝率</div>
                    </div>
                  </div>

                  {/* Secondary metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    {[
                      { label: "總交易次數", value: `${result.totalTrades} 次`, icon: <Activity className="w-4 h-4" /> },
                      { label: "利潤因子", value: result.profitFactor.toFixed(2), icon: <TrendingUp className="w-4 h-4" /> },
                      { label: "平均獲利", value: `+${result.avgWin.toFixed(2)}%`, icon: <Percent className="w-4 h-4" /> },
                      { label: "平均虧損", value: `-${result.avgLoss.toFixed(2)}%`, icon: <Percent className="w-4 h-4" /> },
                    ].map((stat) => (
                      <div key={stat.label} className="p-3 rounded-xl bg-white/5 flex items-center gap-3">
                        <div className="text-slate-500">{stat.icon}</div>
                        <div>
                          <div className="text-white font-mono font-medium text-sm">{stat.value}</div>
                          <div className="text-slate-500 text-xs">{stat.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Parsed params */}
                  {result.parsedParams && Object.keys(result.parsedParams).length > 0 && (
                    <div className="mt-6 pt-5 border-t border-indigo-500/10">
                      <h3 className="text-slate-300 font-medium text-sm mb-3">識別到的策略參數</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(result.parsedParams).map(([k, v]) => (
                          <span key={k} className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
                            {k} = {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={runBacktest}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 py-2.5"
                  >
                    <Play className="w-4 h-4" /> 重新執行
                  </button>
                  <Link
                    href="/dashboard"
                    className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5"
                  >
                    <BarChart3 className="w-4 h-4" /> 返回 Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BacktestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen gradient-bg flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        </div>
      }
    >
      <BacktestPageInner />
    </Suspense>
  );
}