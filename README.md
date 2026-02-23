# BacktestNow - AI Strategy Backtesting Platform

TradingView PineScript strategy AI parameter optimization platform, supporting Binance live data and OpenAI intelligent suggestions.

## Features

- AI automatic parameter sweeping (1,000~10,000 combinations)
- Deep historical data integration (Binance)
- Comprehensive performance analysis (Sharpe, win rate, drawdown)
- One-click export of optimal PineScript code
- Supports 8 assets (4 crypto + 4 futures)
- Clerk authentication system

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Required:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - from https://clerk.com
- `CLERK_SECRET_KEY` - from https://clerk.com

Optional:
- `OPENAI_API_KEY` - enables AI parameter suggestions
- `BINANCE_API_KEY` / `BINANCE_SECRET_KEY` - live price data

### 3. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Deploy to Railway

1. Go to https://railway.app and create a new project
2. Connect your GitHub repository
3. Add all `.env.local` variables in Railway environment settings
4. Railway auto-detects Next.js and deploys

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Charts | Recharts |
| AI | OpenAI GPT-4o-mini |
| Price Data | Binance Public API |
| Deploy | Railway |

## Pages

```
/ - Landing Page
/sign-in - Sign In
/sign-up - Sign Up
/dashboard - Main dashboard (requires login)
  - New Optimization (OptimizePanel)
  - History
  - Performance Analysis (ResultsPanel)
  - Settings
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backtest/run` | POST | Run backtest optimization |
| `/api/prices` | GET | Get live quotes |
| `/api/ai/suggest` | POST | AI parameter suggestions |
