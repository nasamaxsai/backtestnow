"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BarChart3, Zap, History, Settings, PlusCircle,
  TrendingUp, TrendingDown, Activity, Target,
  LayoutDashboard, User
} from "lucide-react";
import OptimizePanel from "@/components/OptimizePanel";
import ResultsPanel from "@/components/ResultsPanel";

const NAV_ITEMS = [
  { icon: <Zap className="w-5 h-5" />, label: "快速優化", id: "optimize" },
  { icon: <History className="w-5 h-5" />, label: "歷史記錄", id: "history" },
  { icon: <BarChart3 className="w-5 h-5" />, label: "績效分析", id: "analytics" },
  { icon: <Settings className="w-5 h-5" />, label: "設定", id: "settings" },
];

const MOCK_HISTORY: {
  id: number;
  name: string;
  symbol: string;
  timeframe: string;
  status: string;
  sharpe: number | null;
  winrate: number | null;
  profit: number | null;
  date: string;
}[] = [
  { id: 1, name: "BTC RSI 策略", symbol: "BTC/USDT", timeframe: "4h", status: "completed", sharpe: 2.34, winrate: 67.3, profit: 142.5, date: "2026-02-20" },
  { id: 2, name: "ETH 均線策略", symbol: "ETH/USDT", timeframe: "1h", status: "completed", sharpe: 1.87, winrate: 61.2, profit: 89.3, date: "2026-02-18" },
  { id: 3, name: "SOL 動量策略", symbol: "SOL/USDT", timeframe: "15m", status: "running", sharpe: null, winrate: null, profit: null, date: "2026-02-23" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("optimize");
  const [selectedResult, setSelectedResult] = useState<number | null>(null);

  return (
    <div className="flex h-screen gradient-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass border-r border-indigo-500/10 flex flex-col">
        <div className="p-6 border-b border-indigo-500/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">BacktestNow</span>
          </Link>
          <p className="text-slate-500 text-xs mt-1">AI 策略優化平台</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-indigo-500/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-sm">
              <p className="text-white font-medium">我的帳戶</p>
              <p className="text-slate-500 text-xs">Pro 方案</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="glass border-b border-indigo-500/10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {NAV_ITEMS.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 text-sm">BacktestNow AI 量化平台</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/backtest">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-indigo-300 text-sm font-medium transition-all">
                <PlusCircle className="w-4 h-4" />
                新增回測
              </button>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeTab === "optimize" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <OptimizePanel />
              <ResultsPanel
                selectedResult={selectedResult}
                onSelectResult={setSelectedResult}
              />
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">歷史回測記錄</h2>
                <span className="text-slate-500 text-sm">{MOCK_HISTORY.length} 筆記錄</span>
              </div>
              {MOCK_HISTORY.map((run) => (
                <div
                  key={run.id}
                  className="glass rounded-2xl p-5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          run.status === "completed"
                            ? "bg-emerald-400"
                            : "bg-yellow-400 animate-pulse"
                        }`}
                      />
                      <div>
                        <p className="text-white font-medium">{run.name}</p>
                        <p className="text-slate-500 text-sm">
                          {run.symbol} · {run.timeframe} · {run.date}
                        </p>
                      </div>
                    </div>
                    {run.status === "completed" && (
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="text-slate-500">Sharpe</p>
                          <p className="text-white font-semibold">{run.sharpe}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500">勝率</p>
                          <p className="text-emerald-400 font-semibold">{run.winrate}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-slate-500">獲利</p>
                          <p
                            className={`font-semibold ${
                              (run.profit ?? 0) > 0 ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {(run.profit ?? 0) > 0 ? "+" : ""}
                            {run.profit}%
                          </p>
                        </div>
                      </div>
                    )}
                    {run.status === "running" && (
                      <span className="text-yellow-400 text-sm flex items-center gap-1">
                        <Activity className="w-4 h-4" /> 執行中...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "總回測次數",
                  value: "3",
                  icon: <Target className="w-5 h-5" />,
                  color: "indigo",
                },
                {
                  label: "平均勝率",
                  value: "64.3%",
                  icon: <TrendingUp className="w-5 h-5" />,
                  color: "emerald",
                },
                {
                  label: "最佳 Sharpe",
                  value: "2.34",
                  icon: <Activity className="w-5 h-5" />,
                  color: "purple",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass rounded-2xl p-6 border border-indigo-500/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-${stat.color}-500/20 flex items-center justify-center text-${stat.color}-400`}
                    >
                      {stat.icon}
                    </div>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="glass rounded-2xl p-8 border border-indigo-500/10 max-w-lg">
              <h2 className="text-lg font-semibold text-white mb-6">帳戶設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm">預設交易所</label>
                  <div className="mt-1 bg-white/5 rounded-xl px-4 py-3 text-white border border-white/10">
                    Binance
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">API 金鑰狀態</label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-sm">已連接</span>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-sm">方案</label>
                  <div className="mt-1 bg-white/5 rounded-xl px-4 py-3 text-white border border-white/10 flex items-center justify-between">
                    <span>Pro 方案</span>
                    <span className="text-indigo-400 text-sm">升級</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}