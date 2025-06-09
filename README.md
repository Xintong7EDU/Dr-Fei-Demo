# Sunday Demo

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/xintong-lius-projects/v0-sunday-demo)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/6gUaOTCbHon)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/xintong-lius-projects/v0-sunday-demo](https://vercel.com/xintong-lius-projects/v0-sunday-demo)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/6gUaOTCbHon](https://v0.dev/chat/projects/6gUaOTCbHon)**

## Environment Variables

Create a `.env` file based on `.env.example` and provide your Supabase project credentials:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Authentication Flow

Users can sign up and sign in with email and password. Authentication state is managed on the client through a `useSession` hook which listens for Supabase auth changes. The main navigation shows a **Sign Out** button when a session is active.


## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

---

## TODO

### High Priority
- [ ] **Refactor Chart Component**: Move `StockChartWidget` to its own file under `components/` for better modularity.
- [ ] **Improve Chart Loading State**: Display a loading spinner or skeleton UI while the TradingView widget is initializing.
- [ ] **Fix Chart Toggling**: Ensure that clicking a row toggles the chart visibility correctly without interfering with edit/delete buttons.

### Medium Priority
- [ ] **Add Stock Search/Filter**: Implement a search bar on the `StockTable` to filter stocks by code or name.
- [ ] **Historical Data**: Fetch and display basic historical data (e.g., 52-week high/low) in the expanded view.
- [ ] **Refine Yahoo Finance URL**: Improve `generateYahooFinanceUrl` for Chinese stocks to correctly differentiate between Shanghai (`.SS`) and Shenzhen (`.SZ`) exchanges. This might require adding an `exchange` field to the `stocks` table.

### Low Priority
- [ ] **User Watchlists**: Allow authenticated users to create and manage personal stock watchlists.
- [ ] **Real-time Price Updates**: Investigate using WebSockets or a real-time data provider to show live price changes.
- [ ] **Add Component Tests**: Write unit tests for the `StockTable` and `StockChartWidget` components.
