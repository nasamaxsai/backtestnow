// Pine Script Parser - detects inputs and strategy logic

export interface PineInput {
  name: string;
  type: "int" | "float" | "bool" | "string";
  defaultValue: number | boolean | string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  title?: string;
}

export interface ParsedStrategy {
  name: string;
  inputs: PineInput[];
  hasLongEntry: boolean;
  hasShortEntry: boolean;
  usesSMA: boolean;
  usesEMA: boolean;
  usesRSI: boolean;
  usesMACD: boolean;
  usesBB: boolean;
  usesATR: boolean;
  description: string;
}

export function parsePineScript(code: string): ParsedStrategy {
  const inputs: PineInput[] = [];

  // Extract strategy name
  const nameMatch = code.match(/strategy\s*\(\s*["']([^"']+)["']/);
  const name = nameMatch ? nameMatch[1] : "自定義策略";

  // Parse input.int
  const intRe = /(\w+)\s*=\s*input\.int\(\s*(-?[\d.]+)(?:[^,)]*,\s*title\s*=\s*["']([^"']+)["'])?(?:[^,)]*,\s*minval\s*=\s*(-?[\d.]+))?(?:[^,)]*,\s*maxval\s*=\s*(-?[\d.]+))?(?:[^,)]*,\s*step\s*=\s*(-?[\d.]+))?/g;
  let m: RegExpExecArray | null;
  while ((m = intRe.exec(code)) !== null) {
    const defVal = Number(m[2]);
    inputs.push({
      name: m[1],
      type: "int",
      defaultValue: defVal,
      title: m[3] || m[1],
      minValue: m[4] !== undefined ? Number(m[4]) : Math.max(1, Math.floor(defVal * 0.2)),
      maxValue: m[5] !== undefined ? Number(m[5]) : Math.ceil(defVal * 3),
      step: m[6] !== undefined ? Number(m[6]) : Math.max(1, Math.floor(defVal * 0.1)),
    });
  }

  // Parse input.float
  const floatRe = /(\w+)\s*=\s*input\.float\(\s*(-?[\d.]+)(?:[^,)]*,\s*title\s*=\s*["']([^"']+)["'])?(?:[^,)]*,\s*minval\s*=\s*(-?[\d.]+))?(?:[^,)]*,\s*maxval\s*=\s*(-?[\d.]+))?(?:[^,)]*,\s*step\s*=\s*(-?[\d.]+))?/g;
  while ((m = floatRe.exec(code)) !== null) {
    const defVal = Number(m[2]);
    inputs.push({
      name: m[1],
      type: "float",
      defaultValue: defVal,
      title: m[3] || m[1],
      minValue: m[4] !== undefined ? Number(m[4]) : Math.max(0.01, defVal * 0.2),
      maxValue: m[5] !== undefined ? Number(m[5]) : defVal * 3,
      step: m[6] !== undefined ? Number(m[6]) : defVal * 0.1,
    });
  }

  // Parse input() legacy
  const legacyRe = /(\w+)\s*=\s*input\(\s*(-?[\d.]+)(?:[^,)]*,\s*title\s*=\s*["']([^"']+)["'])?(?:[^,)]*,\s*minval\s*=\s*(-?[\d.]+))?(?:[^,)]*,\s*maxval\s*=\s*(-?[\d.]+))?/g;
  while ((m = legacyRe.exec(code)) !== null) {
    const defVal = Number(m[2]);
    if (!inputs.find(i => i.name === m![1])) {
      inputs.push({
        name: m[1],
        type: Number.isInteger(defVal) ? "int" : "float",
        defaultValue: defVal,
        title: m[3] || m[1],
        minValue: m[4] !== undefined ? Number(m[4]) : Math.max(1, Math.floor(defVal * 0.2)),
        maxValue: m[5] !== undefined ? Number(m[5]) : Math.ceil(defVal * 3),
        step: Number.isInteger(defVal) ? Math.max(1, Math.floor(defVal * 0.1)) : defVal * 0.1,
      });
    }
  }

  // Detect indicators used
  const usesSMA = /ta\.sma|sma\(/.test(code);
  const usesEMA = /ta\.ema|ema\(/.test(code);
  const usesRSI = /ta\.rsi|rsi\(/.test(code);
  const usesMACD = /ta\.macd|macd\(/.test(code);
  const usesBB = /ta\.bb|bb\(|bollinger/.test(code);
  const usesATR = /ta\.atr|atr\(/.test(code);

  const hasLongEntry = /strategy\.entry.*long|strategy\.long/.test(code);
  const hasShortEntry = /strategy\.entry.*short|strategy\.short/.test(code);

  // Build description
  const indicators = [
    usesSMA && "SMA", usesEMA && "EMA", usesRSI && "RSI",
    usesMACD && "MACD", usesBB && "Bollinger Bands", usesATR && "ATR"
  ].filter(Boolean).join(", ");

  const direction = hasLongEntry && hasShortEntry ? "多空雙向" : hasLongEntry ? "做多" : "做空";
  const description = `${direction}策略${indicators ? `，使用 ${indicators}` : ""}，偵測到 ${inputs.length} 個可優化參數`;

  return { name, inputs, hasLongEntry, hasShortEntry, usesSMA, usesEMA, usesRSI, usesMACD, usesBB, usesATR, description };
}

// Generate smart optimization ranges based on param name heuristics
export function smartOptimizeRange(input: PineInput): { min: number; max: number; step: number } {
  const n = input.name.toLowerCase();
  const def = Number(input.defaultValue);

  // Period-like params
  if (/length|period|lookback|window|bars/.test(n)) {
    return { min: Math.max(2, Math.floor(def * 0.3)), max: Math.ceil(def * 2.5), step: Math.max(1, Math.floor(def * 0.1)) };
  }
  // Percent / threshold params
  if (/pct|percent|threshold|level/.test(n)) {
    return { min: Math.max(1, Math.floor(def * 0.3)), max: Math.ceil(def * 2), step: Math.max(1, Math.floor(def * 0.1)) };
  }
  // Multiplier params
  if (/mult|factor|ratio|atr/.test(n)) {
    return { min: Math.max(0.5, def * 0.3), max: def * 3, step: 0.1 };
  }
  // Fast/slow MA crossover
  if (/fast/.test(n)) {
    return { min: Math.max(2, Math.floor(def * 0.4)), max: Math.ceil(def * 2), step: 1 };
  }
  if (/slow/.test(n)) {
    return { min: Math.max(5, Math.floor(def * 0.4)), max: Math.ceil(def * 2), step: 2 };
  }
  // Default
  return {
    min: input.minValue ?? Math.max(1, Math.floor(def * 0.3)),
    max: input.maxValue ?? Math.ceil(def * 2.5),
    step: input.step ?? Math.max(1, Math.floor(def * 0.1)),
  };
}
