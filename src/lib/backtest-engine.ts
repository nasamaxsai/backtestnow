// Real backtest engine - simulates Pine Script logic on OHLCV data

export interface OHLCVBar {
  time: number; // unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: number;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  direction: "long" | "short";
  pnl: number;
  pnlPct: number;
  bars: number;
}

export interface EquityPoint {
  time: number;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  id: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalEquity: number;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownDuration: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  avgTradeDuration: number;
  bestTrade: number;
  worstTrade: number;
  expectancy: number;
  equityCurve: EquityPoint[];
  trades: Trade[];
  monthlyReturns: { month: string; return: number }[];
  params: Record<string, number>;
}

// --- Indicator functions ---
function sma(closes: number[], period: number, idx: number): number {
  if (idx < period - 1) return closes[idx];
  let sum = 0;
  for (let i = idx - period + 1; i <= idx; i++) sum += closes[i];
  return sum / period;
}

function ema(closes: number[], period: number, idx: number, cache: Map<string, number[]>): number {
  const key = `ema_${period}`;
  if (!cache.has(key)) {
    const arr: number[] = new Array(closes.length).fill(0);
    arr[0] = closes[0];
    const k = 2 / (period + 1);
    for (let i = 1; i < closes.length; i++) arr[i] = closes[i] * k + arr[i - 1] * (1 - k);
    cache.set(key, arr);
  }
  return cache.get(key)![idx];
}

function rsi(closes: number[], period: number, idx: number, cache: Map<string, number[]>): number {
  const key = `rsi_${period}`;
  if (!cache.has(key)) {
    const arr: number[] = new Array(closes.length).fill(50);
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period && i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) avgGain += diff / period;
      else avgLoss += -diff / period;
    }
    for (let i = period; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      arr[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
    cache.set(key, arr);
  }
  return cache.get(key)![idx];
}

function atr(bars: OHLCVBar[], period: number, idx: number, cache: Map<string, number[]>): number {
  const key = `atr_${period}`;
  if (!cache.has(key)) {
    const arr: number[] = new Array(bars.length).fill(0);
    let sum = 0;
    for (let i = 1; i < bars.length; i++) {
      const tr = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      );
      if (i <= period) { sum += tr; arr[i] = sum / Math.min(i, period); }
      else arr[i] = (arr[i - 1] * (period - 1) + tr) / period;
    }
    cache.set(key, arr);
  }
  return cache.get(key)![idx];
}

function macd(closes: number[], fast: number, slow: number, signal: number, idx: number, cache: Map<string, number[]>): { macdLine: number; signalLine: number; histogram: number } {
  const fastEma = (i: number) => ema(closes, fast, i, cache);
  const slowEma = (i: number) => ema(closes, slow, i, cache);
  const macdKey = `macd_${fast}_${slow}`;
  if (!cache.has(macdKey)) {
    const arr = closes.map((_, i) => fastEma(i) - slowEma(i));
    cache.set(macdKey, arr);
  }
  const macdLine = cache.get(macdKey)![idx];
  const sigKey = `macd_sig_${fast}_${slow}_${signal}`;
  if (!cache.has(sigKey)) {
    const macdArr = cache.get(macdKey)!;
    const sigArr: number[] = new Array(closes.length).fill(0);
    sigArr[0] = macdArr[0];
    const k = 2 / (signal + 1);
    for (let i = 1; i < closes.length; i++) sigArr[i] = macdArr[i] * k + sigArr[i - 1] * (1 - k);
    cache.set(sigKey, sigArr);
  }
  const signalLine = cache.get(sigKey)![idx];
  return { macdLine, signalLine, histogram: macdLine - signalLine };
}

// --- Strategy signal detection ---
function detectSignals(
  bars: OHLCVBar[],
  code: string,
  params: Record<string, number>,
  cache: Map<string, number[]>
): { longEntry: boolean[]; longExit: boolean[]; shortEntry: boolean[]; shortExit: boolean[] } {
  const n = bars.length;
  const closes = bars.map(b => b.close);
  const longs: boolean[] = new Array(n).fill(false);
  const longExits: boolean[] = new Array(n).fill(false);
  const shorts: boolean[] = new Array(n).fill(false);
  const shortExits: boolean[] = new Array(n).fill(false);

  const hasRSI = /ta\.rsi|rsi\(/.test(code);
  const hasMACD = /ta\.macd|macd\(/.test(code);
  const hasSMA = /ta\.sma|sma\(/.test(code);
  const hasEMA = /ta\.ema|ema\(/.test(code);
  const hasBB = /ta\.bb|bollinger/i.test(code);
  const hasATR = /ta\.atr|atr\(/.test(code);

  // Extract key params with smart defaults
  const fastLen = params.fastLength ?? params.fast ?? params.fastPeriod ?? 12;
  const slowLen = params.slowLength ?? params.slow ?? params.slowPeriod ?? 26;
  const signalLen = params.signalLength ?? params.signal ?? 9;
  const rsiLen = params.rsiLength ?? params.rsiPeriod ?? params.length ?? 14;
  const rsiOb = params.rsiOverbought ?? params.overbought ?? 70;
  const rsiOs = params.rsiOversold ?? params.oversold ?? 30;
  const maLen = params.maLength ?? params.length ?? params.period ?? 20;
  const atrLen = params.atrLength ?? params.atrPeriod ?? 14;
  const atrMult = params.atrMultiplier ?? params.multiplier ?? params.mult ?? 2;
  const stopPct = params.stopLossPct ?? params.stopLoss ?? params.stop ?? 5;

  for (let i = Math.max(slowLen, 50); i < n; i++) {
    if (hasMACD && !hasRSI) {
      const { macdLine, signalLine, histogram } = macd(closes, fastLen, slowLen, signalLen, i, cache);
      const prev = macd(closes, fastLen, slowLen, signalLen, i - 1, cache);
      longs[i] = prev.histogram < 0 && histogram > 0;
      shorts[i] = prev.histogram > 0 && histogram < 0;
      longExits[i] = histogram < 0;
      shortExits[i] = histogram > 0;
    } else if (hasRSI && !hasMACD) {
      const rsiVal = rsi(closes, rsiLen, i, cache);
      const prevRsi = rsi(closes, rsiLen, i - 1, cache);
      longs[i] = prevRsi < rsiOs && rsiVal >= rsiOs;
      longExits[i] = rsiVal > rsiOb;
      shorts[i] = prevRsi > rsiOb && rsiVal <= rsiOb;
      shortExits[i] = rsiVal < rsiOs;
    } else if (hasEMA && (hasSMA || fastLen !== slowLen)) {
      const fast = ema(closes, fastLen, i, cache);
      const slow = hasEMA ? ema(closes, slowLen, i, cache) : sma(closes, slowLen, i);
      const prevFast = ema(closes, fastLen, i - 1, cache);
      const prevSlow = hasEMA ? ema(closes, slowLen, i - 1, cache) : sma(closes, slowLen, i - 1);
      longs[i] = prevFast < prevSlow && fast > slow;
      shorts[i] = prevFast > prevSlow && fast < slow;
      longExits[i] = fast < slow;
      shortExits[i] = fast > slow;
    } else if (hasSMA) {
      const fast = sma(closes, fastLen, i);
      const slow = sma(closes, slowLen, i);
      const prevFast = sma(closes, fastLen, i - 1);
      const prevSlow = sma(closes, slowLen, i - 1);
      longs[i] = prevFast < prevSlow && fast > slow;
      shorts[i] = prevFast > prevSlow && fast < slow;
      longExits[i] = fast < slow;
      shortExits[i] = fast > slow;
    } else {
      // Fallback: generic momentum
      const ma20 = sma(closes, 20, i);
      const ma50 = sma(closes, 50, i);
      const prevMa20 = sma(closes, 20, i - 1);
      const prevMa50 = sma(closes, 50, i - 1);
      longs[i] = prevMa20 < prevMa50 && ma20 > ma50;
      shorts[i] = prevMa20 > prevMa50 && ma20 < ma50;
      longExits[i] = ma20 < ma50;
      shortExits[i] = ma20 > ma50;
    }
  }

  return { longEntry: longs, longExit: longExits, shortEntry: shorts, shortExit: shortExits };
}

// --- Main backtest runner ---
export function runBacktest(
  bars: OHLCVBar[],
  code: string,
  params: Record<string, number>,
  config: {
    strategyName: string;
    symbol: string;
    timeframe: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    commission: number; // percent
  }
): BacktestResult {
  const cache = new Map<string, number[]>();
  const { longEntry, longExit, shortEntry, shortExit } = detectSignals(bars, code, params, cache);

  const { initialCapital, commission } = config;
  let equity = initialCapital;
  let peak = equity;
  let maxDD = 0;
  let maxDDStart = 0;
  let maxDDDuration = 0;
  let ddStart = 0;

  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];
  const hasShort = /strategy\.entry.*["']short["']|strategy\.short/.test(code);

  let position: { dir: "long" | "short"; entryIdx: number; entryPrice: number; size: number } | null = null;
  let tradeId = 0;

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const commFactor = commission / 100;

    // Exit logic
    if (position) {
      let exit = false;
      if (position.dir === "long" && longExit[i]) exit = true;
      if (position.dir === "short" && shortExit[i]) exit = true;

      // Stop loss check (simple % stop)
      const stopPct = params.stopLossPct ?? params.stopLoss ?? 0;
      if (stopPct > 0) {
        if (position.dir === "long" && bar.low < position.entryPrice * (1 - stopPct / 100)) exit = true;
        if (position.dir === "short" && bar.high > position.entryPrice * (1 + stopPct / 100)) exit = true;
      }

      if (exit) {
        const exitPrice = bar.close;
        const pnlPct = position.dir === "long"
          ? (exitPrice - position.entryPrice) / position.entryPrice * 100 - commFactor * 200
          : (position.entryPrice - exitPrice) / position.entryPrice * 100 - commFactor * 200;
        const pnl = equity * pnlPct / 100;
        equity += pnl;
        trades.push({
          id: ++tradeId,
          entryTime: bars[position.entryIdx].time,
          exitTime: bar.time,
          entryPrice: position.entryPrice,
          exitPrice,
          direction: position.dir,
          pnl: Math.round(pnl * 100) / 100,
          pnlPct: Math.round(pnlPct * 100) / 100,
          bars: i - position.entryIdx,
        });
        position = null;
      }
    }

    // Entry logic
    if (!position) {
      if (longEntry[i]) {
        position = { dir: "long", entryIdx: i, entryPrice: bar.close * (1 + commFactor), size: equity };
      } else if (hasShort && shortEntry[i]) {
        position = { dir: "short", entryIdx: i, entryPrice: bar.close * (1 - commFactor), size: equity };
      }
    }

    // Track equity & drawdown
    if (equity > peak) { peak = equity; ddStart = i; }
    const dd = (peak - equity) / peak * 100;
    if (dd > maxDD) {
      maxDD = dd;
      maxDDStart = ddStart;
      maxDDDuration = i - ddStart;
    }

    equityCurve.push({
      time: bar.time,
      equity: Math.round(equity * 100) / 100,
      drawdown: Math.round(dd * 100) / 100,
    });
  }

  // Close open position at end
  if (position) {
    const bar = bars[bars.length - 1];
    const commFactor = commission / 100;
    const exitPrice = bar.close;
    const pnlPct = position.dir === "long"
      ? (exitPrice - position.entryPrice) / position.entryPrice * 100 - commFactor * 200
      : (position.entryPrice - exitPrice) / position.entryPrice * 100 - commFactor * 200;
    const pnl = equity * pnlPct / 100;
    equity += pnl;
    trades.push({
      id: ++tradeId,
      entryTime: bars[position.entryIdx].time,
      exitTime: bar.time,
      entryPrice: position.entryPrice,
      exitPrice,
      direction: position.dir,
      pnl: Math.round(pnl * 100) / 100,
      pnlPct: Math.round(pnlPct * 100) / 100,
      bars: bars.length - 1 - position.entryIdx,
    });
  }

  // Calculate stats
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  const totalReturn = (equity - initialCapital) / initialCapital * 100;
  const days = (bars[bars.length - 1].time - bars[0].time) / 86400000;
  const annualizedReturn = days > 0 ? (Math.pow(equity / initialCapital, 365 / days) - 1) * 100 : 0;

  // Sharpe: daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    dailyReturns.push((equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity);
  }
  const meanR = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const stdR = Math.sqrt(dailyReturns.reduce((a, b) => a + Math.pow(b - meanR, 2), 0) / (dailyReturns.length || 1));
  const sharpe = stdR > 0 ? (meanR / stdR) * Math.sqrt(252) : 0;

  const downR = dailyReturns.filter(r => r < 0);
  const stdDown = Math.sqrt(downR.reduce((a, b) => a + b * b, 0) / (downR.length || 1));
  const sortino = stdDown > 0 ? (meanR / stdDown) * Math.sqrt(252) : 0;

  const avgWin = wins.length > 0 ? wins.reduce((a, t) => a + t.pnlPct, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, t) => a + t.pnlPct, 0) / losses.length : 0;
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const avgDuration = trades.length > 0 ? trades.reduce((a, t) => a + t.bars, 0) / trades.length : 0;
  const bestTrade = trades.length > 0 ? Math.max(...trades.map(t => t.pnlPct)) : 0;
  const worstTrade = trades.length > 0 ? Math.min(...trades.map(t => t.pnlPct)) : 0;
  const expectancy = trades.length > 0
    ? (winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss
    : 0;

  // Monthly returns
  const monthlyMap: Record<string, number> = {};
  for (const t of trades) {
    const d = new Date(t.exitTime);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] ?? 0) + t.pnlPct;
  }
  const monthlyReturns = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, ret]) => ({ month, return: Math.round(ret * 100) / 100 }));

  const id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  return {
    id,
    strategyName: config.strategyName,
    symbol: config.symbol,
    timeframe: config.timeframe,
    startDate: config.startDate,
    endDate: config.endDate,
    initialCapital,
    finalEquity: Math.round(equity * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    sharpeRatio: Math.round(sharpe * 1000) / 1000,
    sortinoRatio: Math.round(sortino * 1000) / 1000,
    maxDrawdown: Math.round(maxDD * 100) / 100,
    maxDrawdownDuration: maxDDDuration,
    winRate: Math.round(winRate * 10) / 10,
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    profitFactor: Math.round(profitFactor * 1000) / 1000,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    avgTradeDuration: Math.round(avgDuration * 10) / 10,
    bestTrade: Math.round(bestTrade * 100) / 100,
    worstTrade: Math.round(worstTrade * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    equityCurve,
    trades,
    monthlyReturns,
    params,
  };
}
