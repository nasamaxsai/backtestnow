"use client";
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter
} from "recharts";
import { Download, Trophy, TrendingUp, TrendingDown, Target, AlertTriangle, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

// Mock results data
const MOCK_RESULTS = Array.from({ length: 50 }, (_, i) => ({
  rank: i + 1,
  rsiLength: Math.floor(Math.random() * 20) + 8,
  rsiOverbought: Math.floor(Math.random() * 20) + 65,
  rsiOversold: Math.floor(Math.random() * 15) + 25,
  emaPeriod: Math.floor(Math.random() * 200) + 100,
  stopLossPct: (Math.random() * 3 + 1).toFixed(1),
  takeProfitPct: (Math.random() * 6 + 2).toFixed(1),
  sharpe: (Math.random() * 2 + 0.5).toFixed(2),
  winrate: (Math.random() * 25 + 50).toFixed(1),
  profit: (Math.random() * 200 - 20).toFixed(1),
  maxDrawdown: (Math.random() * 20 + 5).toFixed(1),
  trades: Math.floor(Math.random() * 200 + 50),
  profitFactor: (Math.random() * 2 + 0.8).toFixed(2),
})).sort((a, b) => Number(b.sharpe) - Number(a.sharpe));

const EQUITY_CURVE = Array.from({ length: 100 }, (_, i) => ({
  day: i,
  equity: 10000 * Math.exp(i * 0.015 + (Math.random() - 0.4) * 0.3),
  benchmark: 10000 * (1 + i * 0.008),
}));

const MONTHLY_RETURNS = [
  { month: "Jan", return: 8.2 }, { month: "Feb", return: -3.1 },
  { month: "Mar", return: 12.5 }, { month: "Apr", return: 5.7 },
  { month: "May", return: -1.8 }, { month: "Jun", return: 9.3 },
  { month: "Jul", return: 15.2 }, { month: "Aug", return: -4.5 },
  { month: "Sep", return: 7.8 }, { month: "Oct", return: 11.1 },
  { month: "Nov", return: -2.3 }, { month: "Dec", return: 6.9 },
];

const BEST = MOCK_RESULTS[0];

function StatCard({ label, value, sub, up }: { label: string; value: string; sub?: string; up?: boolean }) {
  return (
    <div className="glass-card p-5">
      <p className="text-slate-400 text-xs font-medium mb-2">{label}</p>
      <p className={`text-2xl font-bold font-mono ${up === true ? "text-emerald-400" : up === false ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function ResultsPanel({ resultId }: { resultId: number | null }) {
  const [selectedRow, setSelectedRow] = useState(0);
  const [tab, setTab] = useState<"table" | "chart" | "monthly">("chart");
  const [copied, setCopied] = useState(false);

  const selected = MOCK_RESULTS[selectedRow];

  const generatePineCode = (params: typeof BEST) => `
//@version=5
strategy("RSI Strategy [Optimized]", overlay=true, 
  default_qty_type=strategy.percent_of_equity, 
  default_qty_value=10)

// Optimized Parameters (BacktestNow AI)
rsiLength = input.int(${params.rsiLength}, "RSI Length")
rsiOverbought = input.int(${params.rsiOverbought}, "Overbought Level")
rsiOversold = input.int(${params.rsiOversold}, "Oversold Level")
emaPeriod = input.int(${params.emaPeriod}, "EMA Period")
stopLossPct = input.float(${params.stopLossPct}, "Stop Loss %", step=0.5)
takeProfitPct = input.float(${params.takeProfitPct}, "Take Profit %", step=0.5)

// Calculations
rsi = ta.rsi(close, rsiLength)
ema = ta.ema(close, emaPeriod)

// Signals
longCondition = rsi < rsiOversold and close > ema
shortCondition = rsi > rsiOverbought and close < ema

if longCondition
    strategy.entry("Long", strategy.long)
    strategy.exit("Long Exit", "Long", 
      stop=close*(1-stopLossPct/100), 
      limit=close*(1+takeProfitPct/100))

if shortCondition
    strategy.entry("Short", strategy.short)
    strategy.exit("Short Exit", "Short", 
      stop=close*(1+stopLossPct/100), 
      limit=close*(1-takeProfitPct/100))
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatePineCode(selected));
    setCopied(true);
    toast.success("代碼已複製到剪貼簿！");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Best Result Banner */}
      <div className="glass-card p-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-white">最佳參數組合 #{BEST.rank}</h3>
          <span className="badge-green ml-2">AI 推薦</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
          {[
            ["RSI Length", BEST.rsiLength],
            ["Overbought", BEST.rsiOverbought],
            ["Oversold", BEST.rsiOversold],
            ["EMA Period", BEST.emaPeriod],
            ["Stop Loss", `${BEST.stopLossPct}%`],
            ["Take Profit", `${BEST.takeProfitPct}%`],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-white/5 rounded-lg p-3">
              <p className="text-slate-400 text-xs">{k}</p>
              <p className="text-white font-mono font-bold">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sharpe Ratio" value={BEST.sharpe} sub="風險調整後收益" up={Number(BEST.sharpe) > 1.5} />
        <StatCard label="總獲利" value={`+${BEST.profit}%`} sub="回測期間" up={true} />
        <StatCard label="勝率" value={`${BEST.winrate}%`} sub={`共 ${BEST.trades} 筆交易`} />
        <StatCard label="最大回撤" value={`-${BEST.maxDrawdown}%`} sub="最大虧損幅度" up={false} />
      </div>

      {/* Charts */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <h3 className="font-bold text-white flex-1">績效圖表</h3>
          {[
            { id: "chart", label: "權益曲線" },
            { id: "monthly", label: "月度收益" },
            { id: "table", label: "排行榜" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`text-sm px-4 py-2 rounded-lg transition-all ${tab === t.id ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "text-slate-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "chart" && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={EQUITY_CURVE}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "天數", position: "insideBottom", fill: "#64748b", dy: 10 }} />
              <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #6366f1", borderRadius: "8px", color: "#f1f5f9" }}
                formatter={(v: number) => [`$${v.toFixed(0)}`, ""]}
              />
              <Line type="monotone" dataKey="equity" stroke="#6366f1" strokeWidth={2} dot={false} name="策略" />
              <Line type="monotone" dataKey="benchmark" stroke="#475569" strokeWidth={1.5} dot={false} strokeDasharray="5 5" name="基準" />
            </LineChart>
          </ResponsiveContainer>
        )}

        {tab === "monthly" && (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MONTHLY_RETURNS}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid #6366f1", borderRadius: "8px", color: "#f1f5f9" }}
                formatter={(v: number) => [`${v}%`, "月度收益"]}
              />
              <Bar dataKey="return" radius={[4, 4, 0, 0]}
                fill="#6366f1"
                label={false}
                // Color bars individually based on value
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {tab === "table" && (
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm data-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="text-left">#</th>
                  <th className="text-right">Sharpe</th>
                  <th className="text-right">獲利%</th>
                  <th className="text-right">勝率%</th>
                  <th className="text-right">最大回撤</th>
                  <th className="text-right">利潤因子</th>
                  <th className="text-right">交易次數</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RESULTS.slice(0, 20).map((row, i) => (
                  <tr key={i} onClick={() => setSelectedRow(i)}
                    className={`cursor-pointer ${selectedRow === i ? "bg-indigo-500/10" : ""}`}>
                    <td className="font-bold text-slate-400">
                      {i === 0 && <Trophy className="w-4 h-4 text-amber-400 inline mr-1" />}
                      {row.rank}
                    </td>
                    <td className="text-right font-mono text-white">{row.sharpe}</td>
                    <td className={`text-right font-mono font-bold ${Number(row.profit) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {Number(row.profit) >= 0 ? "+" : ""}{row.profit}%
                    </td>
                    <td className="text-right font-mono text-slate-300">{row.winrate}%</td>
                    <td className="text-right font-mono text-red-400">-{row.maxDrawdown}%</td>
                    <td className="text-right font-mono text-slate-300">{row.profitFactor}</td>
                    <td className="text-right text-slate-400">{row.trades}</td>
                    <td className="text-right">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedRow(i); }}
                        className="text-indigo-400 hover:text-indigo-300 text-xs">選擇</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export Code */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">匯出優化後的 PineScript 代碼</h3>
          <div className="flex gap-3">
            <button onClick={handleCopy} className="btn-primary flex items-center gap-2 text-sm py-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "已複製！" : "複製代碼"}
            </button>
            <button onClick={() => {
              const blob = new Blob([generatePineCode(selected)], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "strategy_optimized.pine"; a.click();
              URL.revokeObjectURL(url);
              toast.success("代碼已下載！");
            }} className="btn-secondary flex items-center gap-2 text-sm py-2">
              <Download className="w-4 h-4" /> 下載 .pine
            </button>
          </div>
        </div>
        <pre className="bg-black/30 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-64 overflow-y-auto border border-indigo-500/10">
          {generatePineCode(selected)}
        </pre>
      </div>
    </div>
  );
}
