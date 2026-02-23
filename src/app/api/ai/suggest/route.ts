import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code, symbol, timeframe } = await req.json();

    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey: openaiKey });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a quantitative trading expert specializing in TradingView PineScript strategy optimization. 
Analyze the given strategy and suggest optimal parameter ranges for backtesting on ${symbol} (${timeframe} timeframe).
Respond in JSON format with an array of parameter suggestions.`,
          },
          {
            role: "user",
            content: `Analyze this PineScript strategy and suggest optimal parameter ranges:\n\n${code}\n\nProvide suggestions as JSON: { "suggestions": [{ "name": "paramName", "min": number, "max": number, "step": number, "reason": "explanation" }] }`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      return NextResponse.json(result);
    }

    // Smart fallback suggestions based on code analysis
    const suggestions = [];
    if (code.includes("rsiLength") || code.includes("RSI")) {
      suggestions.push({ name: "rsiLength", min: 8, max: 21, step: 1, reason: "RSI 週期 8-21 在加密貨幣市場最為有效" });
      suggestions.push({ name: "rsiOverbought", min: 65, max: 80, step: 5, reason: "超買閾值建議在 65-80 之間測試" });
      suggestions.push({ name: "rsiOversold", min: 20, max: 35, step: 5, reason: "超賣閾值建議在 20-35 之間測試" });
    }
    if (code.includes("emaPeriod") || code.includes("ema")) {
      suggestions.push({ name: "emaPeriod", min: 100, max: 300, step: 50, reason: "EMA 趨勢過濾器建議使用 100-300 週期" });
    }
    if (code.includes("stopLoss") || code.includes("stop")) {
      suggestions.push({ name: "stopLossPct", min: 1.0, max: 5.0, step: 0.5, reason: "止損建議在 1%-5% 之間，避免過早止損" });
    }
    if (code.includes("takeProfit") || code.includes("limit")) {
      suggestions.push({ name: "takeProfitPct", min: 2.0, max: 10.0, step: 1.0, reason: "止盈建議至少為止損的 2 倍以上" });
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 500 });
  }
}
