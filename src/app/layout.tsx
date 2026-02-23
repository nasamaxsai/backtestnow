import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "BacktestNow - AI-Powered Strategy Optimizer",
  description:
    "Optimize your TradingView PineScript strategies with AI-driven parameter sweeping and deep historical data analysis.",
  keywords: ["backtesting", "PineScript", "TradingView", "AI", "trading strategy"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
