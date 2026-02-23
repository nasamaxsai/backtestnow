"use client";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  BarChart3, Zap, History, Settings, PlusCircle,
  TrendingUp, TrendingDown, Activity, Target, Clock
} from "lucide-react";
import OptimizePanel from "@/components/OptimizePanel";
import ResultsPanel from "@/components/ResultsPanel";

const NAV_ITEMS = [
  { icon: <Zap className="w-5 h-5" />, label: "新增優化", id: "optimize" },
  { icon: <History className="w-5 h-5" />, label: "歷史記錄", id: "history" },
  { icon: <BarChart3 className="w-5 h-5" />, label: "績效分析", id: "analytics" },
  { icon: <Settings className="w-5 h-5" />, label: "設定", id: "settings" },
];

const MOCK_HISTORY = [
  { id: 1, name: "BTC RSI 策略", symbol: "BTC/USDT", timeframe: "4h", status: "completed", sharpe: 2.34, winrate: 67.3, profit: 142.5, date: "2026-02-20" },
  { id: 2, name: "ETH 布林通道", symbol: "ETH/USDT", timeframe: "1h", status: "completed", sharpe: 1.87, winrate: 61.2, profit: 89.3, date: "2026-02-18" },
  { id: 3, name: "SOL 突破策略", symbol: "SOL/USDT", timeframe: "15m", status: "running", sharpe: null, winrate: null, profit: null, date: "2026-02-23" },
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
          <p className="text-slate-500 text-xs mt-1">AI 策略回測優化平台</p>
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
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-sm">
              <p className="text-white font-medium">我的帳號</p>
              <p className="text-slate-500 text-xs">免費方案</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === "optimize" && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">新增策略優化</h1>
              <p className="text-slate-400 mt-1">貼上您的 PineScript 代碼，AI 將自動分析並優化參數</p>
            </div>
            <OptimizePanel />
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">優化歷史記錄</h1>
                <p className="text-slate-400 mt-1">查看過去的回測與優化結果</p>
              </div>
              <button onClick={() => setActiveTab("optimize")} className="btn-primary flex items-center gap-2 text-sm py-2">
                <PlusCircle className="w-4 h-4" /> 新增優化
              </button>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th className="text-left">策略名稱</th>
                    <th className="text-left">交易對</th>
                    <th className="text-left">時間框架</th>
                    <th className="text-left">狀態</th>
                    <th className="text-right">Sharpe Ratio</th>
                    <th className="text-right">勝率</th>
                    <th className="text-right">總獲利 %</th>
                    <th className="text-left">日期</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_HISTORY.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium text-white">{row.name}</td>
                      <td className="font-mono text-slate-300">{row.symbol}</td>
                      <td className="text-slate-400">{row.timeframe}</td>
                      <td>
                        {row.status === "completed" ? (
                          <span className="badge-green">完成</span>
                        ) : (
                          <span className="badge-purple flex items-center gap-1 w-fit">
                            <Activity className="w-3 h-3 animate-pulse" /> 執行中
                          </span>
                        )}
                      </td>
                      <td className="text-right font-mono text-white">
                        {row.sharpe ?? <span className="text-slate-500">-</span>}
                      </td>
                      <td className="text-right">
                        {row.winrate ? (
                          <span className="text-emerald-400 font-mono">{row.winrate}%</span>
                        ) : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="text-right">
                        {row.profit ? (
                          <span className={`font-mono font-bold ${row.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {row.profit >= 0 ? "+" : ""}{row.profit}%
                          </span>
                        ) : <span className="text-slate-500">-</span>}
                      </td>
                      <td className="text-slate-500 text-xs">{row.date}</td>
                      <td>
                        {row.status === "completed" && (
                          <button
                            onClick={() => { setSelectedResult(row.id); setActiveTab("analytics"); }}
                            className="text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                          >
                            查看詳情
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">績效分析</h1>
              <p className="text-slate-400 mt-1">深度分析回測結果與最佳參數組合</p>
            </div>
            <ResultsPanel resultId={selectedResult} />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">設定</h1>
              <p className="text-slate-400 mt-1">管理您的帳號與 API 設定</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-bold text-white mb-4">API 金鑰設定</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">Binance API Key</label>
                    <input type="password" className="input-dark" placeholder="輸入您的 Binance API Key" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">Binance Secret Key</label>
                    <input type="password" className="input-dark" placeholder="輸入您的 Secret Key" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-sm mb-1 block">OpenAI API Key</label>
                    <input type="password" className="input-dark" placeholder="輸入您的 OpenAI API Key" />
                  </div>
                  <button className="btn-primary w-full">儲存設定</button>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-bold text-white mb-4">使用量統計</h3>
                <div className="space-y-4">
                  {[
                    { label: "本月回測次數", value: "3 / 10", pct: 30 },
                    { label: "API 呼叫次數", value: "127 / 500", pct: 25 },
                    { label: "儲存空間", value: "2.3 MB / 100 MB", pct: 2 },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">{stat.label}</span>
                        <span className="text-white font-mono">{stat.value}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${stat.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
