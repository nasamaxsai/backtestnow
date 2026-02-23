import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    const suggestions = [];
    if (code.includes("rsiLength") || code.includes("RSI")) {
      suggestions.push({ name: "rsiLength", min: 8, max: 21, step: 1, reason: "RSI period 8-21 is most effective in crypto markets" });
      suggestions.push({ name: "rsiOverbought", min: 65, max: 80, step: 5, reason: "Overbought threshold recommended between 65-80" });
      suggestions.push({ name: "rsiOversold", min: 20, max: 35, step: 5, reason: "Oversold threshold recommended between 20-35" });
    }
    if (code.includes("emaPeriod") || code.includes("ema")) {
      suggestions.push({ name: "emaPeriod", min: 100, max: 300, step: 50, reason: "EMA trend filter recommended 100-300 periods" });
    }
    if (code.includes("stopLoss") || code.includes("stop")) {
      suggestions.push({ name: "stopLossPct", min: 1.0, max: 5.0, step: 0.5, reason: "Stop loss recommended 1%-5%" });
    }
    if (code.includes("takeProfit") || code.includes("limit")) {
      suggestions.push({ name: "takeProfitPct", min: 2.0, max: 10.0, step: 1.0, reason: "Take profit recommended at least 2x stop loss" });
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI suggest error:", error);
    return NextResponse.json({ error: "AI suggestion failed" }, { status: 500 });
  }
}
