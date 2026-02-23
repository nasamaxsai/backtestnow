import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider>
      <html lang="zh-TW">
        <body className="gradient-bg min-h-screen">
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a2e",
                color: "#f1f5f9",
                border: "1px solid rgba(99,102,241,0.3)",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
