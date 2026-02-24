"use client";
import { useState } from "react";
import Link from "next/link";
import {
  BarChart3, Zap, History, Settings,
  TrendingUp, Activity, Target,
  LayoutDashboard, User, ChevronRight, Clock,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";

interface HistoryItem {
  id: number;
  name: string;
  symbol: string;
  strategy: string;
  returnPct: number;
  winRate: number;
  date: string;
  status: "profit" | "loss";
}

const MOCK_HISTORY: HistoryItem[] = [
  { id: 1, name: "BTC 均線策略", symbol: "BTC/USDT", strategy: "MA Cross", returnPct: 23.4, winRate: 61, date: "2024-01-15", status: "profit" },
  { id: 2, name: "ETH RSI 反轉", symbol: "ETH/USDT", strategy: "RSI", returnPct: -8.2, winRate: 44, date: "2024-01-10", status: "loss" },
  { id: 3, name: "SOL 動能交易", symbol: "SOL/USDT", strategy: "Momentum", returnPct: 41.7, winRate: 68, date: "2024-01-05", status: "profit" },
  { id: 4, name: "BTC 布林通道", symbol: "BTC/USDT", strategy: "Bollinger", returnPct: 12.1, winRate: 55, date: "2023-12-28", status: "profit" },
  { id: 5, name: "ETH MACD 策略", symbol: "ETH/USDT", strategy: "MACD", returnPct: -3.5, winRate: 48, date: "2023-12-20", status: "loss" },
];

const MARKET_DATA = [
  { symbol: "BTC/USDT", price: "67,234.50", change: "+2.34%", positive: true },
  { symbol: "ETH/USDT", price: "3,521.80", change: "+1.87%", positive: true },
  { symbol: "SOL/USDT", price: "182.40", change: "-0.92%", positive: false },
  { symbol: "BNB/USDT", price: "412.30", change: "+0.54%", positive: true },
];

const STATS = [
  { label: "總回測次數", value: "24", icon: BarChart3, color: "text-blue-400" },
  { label: "平均報酬率", value: "+18.3%", icon: TrendingUp, color: "text-green-400" },
  { label: "最佳策略勝率", value: "68%", icon: Target, color: "text-purple-400" },
  { label: "本月回測", value: "7", icon: Activity, color: "text-yellow-400" },
];

function HistoryTable({ items }: { items: HistoryItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${item.status === "profit" ? "bg-green-400" : "bg-red-400"}`} />
            <div>
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">{item.symbol} · {item.strategy} · {item.date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${item.status === "profit" ? "text-green-400" : "text-red-400"}`}>
              {item.returnPct > 0 ? "+" : ""}{item.returnPct}%
            </p>
            <p className="text-xs text-gray-500">勝率 {item.winRate}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      <aside className="w-64 bg-[#0f0f1a] border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">BacktestNow</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activeTab === "overview"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            總覽
          </button>
          <Link
            href="/dashboard/backtest"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <Zap className="w-5 h-5" />
            新增回測
          </Link>
          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              activeTab === "history"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <History className="w-5 h-5" />
            歷史記錄
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all">
            <Settings className="w-5 h-5" />
            設定
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">使用者</p>
              <p className="text-xs text-gray-500 truncate">backtestnow</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {activeTab === "overview" ? "儀表板總覽" : "回測歷史記錄"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString("zh-TW", {
                year: "numeric", month: "long", day: "numeric", weekday: "long"
              })}
            </p>
          </div>
          <Link
            href="/dashboard/backtest"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Zap className="w-4 h-4" />
            開始回測
          </Link>
        </header>

        <div className="p-6 space-y-6">
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-[#0f0f1a] border border-white/10 rounded-xl p-4">
                      <div className={`${stat.color} mb-3`}><Icon className="w-5 h-5" /></div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  即時市場報價
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {MARKET_DATA.map((m, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">{m.symbol}</p>
                      <p className="font-bold">${m.price}</p>
                      <p className={`text-sm flex items-center gap-1 mt-1 ${m.positive ? "text-green-400" : "text-red-400"}`}>
                        {m.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {m.change}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    最近回測
                  </h2>
                  <button
                    onClick={() => setActiveTab("history")}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    查看全部 <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <HistoryTable items={MOCK_HISTORY.slice(0, 3)} />
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div className="bg-[#0f0f1a] border border-white/10 rounded-xl p-5">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                所有回測記錄
              </h2>
              <HistoryTable items={MOCK_HISTORY} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
