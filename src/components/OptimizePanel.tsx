"use client";
import { useState } from "react";
import { Play, Wand2, ChevronDown, ChevronUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface Parameter {
  name: string;
  defaultVal: string;
  min: string;
  max: string;
  step: string;
  enabled: boolean;
}

const SYMBOLS = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "GC", "NQ", "ES", "SIL"];
const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "2h", "4h", "1d"];

const SAMPLE_PINE = `//@version=5
strategy("RSI Strategy", overlay=true, default_qty_type=strategy.percent_of_equity, default_qty_value=10)

// Parameters
rsiLength = input.int(14, "RSI Length", minval=2, maxval=50)
rsiOverbought = input.int(70, "Overbought Level", minval=60, maxval=90)
rsiOversold = input.int(30, "Oversold Level", minval=10, maxval=40)
emaPeriod = input.int(200, "EMA Period", minval=50, maxval=500)
stopLossPct = input.float(2.0, "Stop Loss %", minval=0.5, maxval=10.0, step=0.5)
takeProfitPct = input.float(4.0, "Take Profit %", minval=1.0, maxval=20.0, step=0.5)

// Calculations
rsi = ta.rsi(close, rsiLength)
ema = ta.ema(close, emaPeriod)

// Signals
longCondition = rsi < rsiOversold and close > ema
shortCondition = rsi > rsiOverbought and close < ema

if longCondition
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", stop=close*(1-stopLossPct/100), limit=close*(1+takeProfitPct/100))

if shortCondition
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", stop=close*(1+stopLossPct/100), limit=close*(1-takeProfitPct/100))
`;

function parsePineParams(code: string): Parameter[] {
  const params: Parameter[] = [];
  const intRegex = /(\w+)\s*=\s*input\.int\((\d+)/g;
  const floatRegex = /(\w+)\s*=\s*input\.float\(([\d.]+)/g;

  let m;
  while ((m = intRegex.exec(code)) !== null) {
    params.push({ name: m[1], defaultVal: m[2], min: String(Math.max(1, Number(m[2]) - 10)), max: String(Number(m[2]) + 20), step: "1", enabled: true });
  }
  while ((m = floatRegex.exec(code)) !== null) {
    params.push({ name: m[1], defaultVal: m[2], min: String(Math.max(0.1, Number(m[2]) - 2)), max: String(Number(m[2]) + 5), step: "0.5", enabled: true });
  }
  return params;
}

type RunStatus = "idle" | "running" | "done" | "error";

export default function OptimizePanel() {
  const [code, setCode] = useState("");
  const [params, setParams] = useState<Parameter[]>([]);
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [timeframe, setTimeframe] = useState("4h");
  const [startDate, setStartDate] = useState("2023-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [maxCombinations, setMaxCombinations] = useState("1000");
  const [strategyName, setStrategyName] = useState("");
  const [status, setStatus] = useState<RunStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [showCode, setShowCode] = useState(true);

  const handleParseParams = () => {
    const src = code || SAMPLE_PINE;
    if (!code) setCode(SAMPLE_PINE);
    const parsed = parsePineParams(src);
    if (parsed.length === 0) {
      toast.error("找不到可調整的參數，請確認代碼包含 input.int() 或 input.float()");
      return;
    }
    setParams(parsed);
    toast.success(`已擷取 ${parsed.length} 個可優化參數`);
    setShowCode(false);
  };

  const handleRun = async () => {
    if (!code && params.length === 0) {
      toast.error("請先貼上 PineScript 代碼並解析參數");
      return;
    }
    setStatus("running");
    setProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) { clearInterval(interval); return p; }
        return p + Math.random() * 8;
      });
    }, 400);

    try {
      const res = await fetch("/api/backtest/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code || SAMPLE_PINE, params, symbol, timeframe, startDate, endDate, maxCombinations: Number(maxCombinations), strategyName }),
      });
      clearInterval(interval);
      setProgress(100);
      if (res.ok) {
        setStatus("done");
        toast.success("優化完成！查看績效分析頁面");
      } else {
        throw new Error("Server error");
      }
    } catch {
      clearInterval(interval);
      setStatus("error");
      toast.error("回測執行失敗，請稍後再試");
    }
  };

  const updateParam = (i: number, field: keyof Parameter, value: string | boolean) => {
    setParams((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const combinations = params.filter(p => p.enabled).reduce((acc, p) => {
    const steps = Math.floor((Number(p.max) - Number(p.min)) / Number(p.step || 1)) + 1;
    return acc * steps;
  }, 1);

  return (
    <div className="space-y-6">
      {/* Strategy Info */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs flex items-center justify-center font-bold">1</span>
          策略基本設定
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">策略名稱</label>
            <input className="input-dark" placeholder="例如：RSI 動量策略" value={strategyName} onChange={e => setStrategyName(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">交易對</label>
            <select className="input-dark" value={symbol} onChange={e => setSymbol(e.target.value)}>
              {SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">時間框架</label>
            <select className="input-dark" value={timeframe} onChange={e => setTimeframe(e.target.value)}>
              {TIMEFRAMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">最大組合數</label>
            <select className="input-dark" value={maxCombinations} onChange={e => setMaxCombinations(e.target.value)}>
              <option value="100">100 組合（快速）</option>
              <option value="500">500 組合</option>
              <option value="1000">1,000 組合（建議）</option>
              <option value="5000">5,000 組合（深度）</option>
              <option value="10000">10,000 組合（完整）</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">開始日期</label>
            <input type="date" className="input-dark" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">結束日期</label>
            <input type="date" className="input-dark" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Code Input */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs flex items-center justify-center font-bold">2</span>
            PineScript 代碼
          </h3>
          <button onClick={() => setShowCode(!showCode)} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
            {showCode ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showCode ? "收起" : "展開"}
          </button>
        </div>
        {showCode && (
          <>
            <textarea
              className="input-dark font-mono text-xs h-48 resize-none"
              placeholder={SAMPLE_PINE}
              value={code}
              onChange={e => setCode(e.target.value)}
            />
            <div className="flex gap-3 mt-3">
              <button onClick={handleParseParams} className="btn-secondary flex items-center gap-2 text-sm">
                <Wand2 className="w-4 h-4" /> 自動解析參數
              </button>
              <button onClick={() => { setCode(SAMPLE_PINE); }} className="text-slate-400 hover:text-white text-sm underline underline-offset-2">
                載入範例代碼
              </button>
            </div>
          </>
        )}
      </div>

      {/* Parameters */}
      {params.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs flex items-center justify-center font-bold">3</span>
              參數優化範圍
            </h3>
            <div className="text-sm">
              <span className="text-slate-400">預估組合數：</span>
              <span className={`font-mono font-bold ml-1 ${combinations > 10000 ? "text-red-400" : combinations > 1000 ? "text-amber-400" : "text-emerald-400"}`}>
                {combinations.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs">
                  <th className="text-left pb-3 pr-4">啟用</th>
                  <th className="text-left pb-3 pr-4">參數名稱</th>
                  <th className="text-left pb-3 pr-4">預設值</th>
                  <th className="text-left pb-3 pr-4">最小值</th>
                  <th className="text-left pb-3 pr-4">最大值</th>
                  <th className="text-left pb-3">間距</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {params.map((p, i) => (
                  <tr key={i} className={!p.enabled ? "opacity-40" : ""}>
                    <td className="pr-4 py-2">
                      <input type="checkbox" checked={p.enabled} onChange={e => updateParam(i, "enabled", e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 cursor-pointer" />
                    </td>
                    <td className="pr-4 py-2 font-mono text-indigo-300 font-medium">{p.name}</td>
                    <td className="pr-4 py-2 text-slate-400 font-mono">{p.defaultVal}</td>
                    <td className="pr-4 py-2">
                      <input className="input-dark py-1 px-2 w-20 font-mono text-xs" value={p.min} onChange={e => updateParam(i, "min", e.target.value)} disabled={!p.enabled} />
                    </td>
                    <td className="pr-4 py-2">
                      <input className="input-dark py-1 px-2 w-20 font-mono text-xs" value={p.max} onChange={e => updateParam(i, "max", e.target.value)} disabled={!p.enabled} />
                    </td>
                    <td className="py-2">
                      <input className="input-dark py-1 px-2 w-20 font-mono text-xs" value={p.step} onChange={e => updateParam(i, "step", e.target.value)} disabled={!p.enabled} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Run */}
      <div className="glass-card p-6">
        {status === "running" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> 正在執行回測優化...
              </span>
              <span className="text-slate-400 text-sm font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-slate-500 text-xs">AI 引擎正在掃描 {Number(maxCombinations).toLocaleString()} 個參數組合，請稍候...</p>
          </div>
        ) : status === "done" ? (
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">優化完成！請前往「績效分析」頁面查看結果。</span>
          </div>
        ) : status === "error" ? (
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">執行失敗，請確認設定後再試。</span>
          </div>
        ) : (
          <button onClick={handleRun} className="btn-primary flex items-center gap-2 text-base py-3 px-8">
            <Play className="w-5 h-5" /> 開始執行回測優化
          </button>
        )}
      </div>
    </div>
  );
}
