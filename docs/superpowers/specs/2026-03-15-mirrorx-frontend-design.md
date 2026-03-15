# MirrorX Frontend UI Spec

## Overview

UI-first build of MirrorX frontend — 3 pages matching Paper designs, all mock data, no contract integration. Desktop-first (1440px).

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19, Vite 6, TypeScript 5.7 |
| Styling | Tailwind CSS 4.0, CSS custom properties |
| State | Zustand (UI state only) |
| Routing | React Router v7 |
| Icons | lucide-react |
| Font | Space Grotesk (Google Fonts) |
| Shader | @paper-design/shaders-react (Dithering on hero) |
| Utils | clsx + tailwind-merge for className merging |

## Color System

All colors defined as CSS custom properties in `app.css`. **No hardcoded hex values in components.**

```css
:root {
  --color-primary: #FFD5F0;
  --color-secondary: #370305;
  --color-bg: #FFFFFF;
  --color-surface: #FFF5FB;
  --color-surface-alt: #F9F5F6;
  --color-surface-hover: #F0E8EA;
  --color-text: #370305;
  --color-text-muted: rgba(55, 3, 5, 0.5);
  --color-text-faint: rgba(55, 3, 5, 0.35);
  --color-border: rgba(55, 3, 5, 0.08);
  --color-border-strong: rgba(55, 3, 5, 0.12);
  --color-success: #16A34A;
  --color-danger: #DC2626;
  --color-warning: #F59E0B;
  --color-rank-gold: #F59E0B;
  --color-rank-silver: #9CA3AF;
  --color-rank-bronze: #CD7F32;
  --color-chart-1: #FFD5F0;
  --color-chart-2: #6366F1;
  --color-chart-3: #16A34A;
}
```

Tailwind v4 theme extension maps these vars to utility classes:

```css
@theme {
  --color-primary: var(--color-primary);
  --color-secondary: var(--color-secondary);
  --color-surface: var(--color-surface);
  --color-surface-alt: var(--color-surface-alt);
  --color-success: var(--color-success);
  --color-danger: var(--color-danger);
  --color-warning: var(--color-warning);
}
```

Usage: `bg-primary`, `text-secondary`, `border-border`, etc.

## Pages

### Page 1: Home (`/`)

**Navbar** — Shared across all pages. Logo (pink square + "MirrorX" bold), nav links (Home/Leaderboard/Trade — active state is font-weight 500), "Connect Wallet" pill button (dark bg, white text, rounded-full).

**Hero Section** — Full-width dark secondary bg. `<Dithering>` shader positioned absolute behind content. White headline: "Your trades follow the best. Near-instant. Zero trust." Muted white subtitle. Two CTA buttons: "Become a Leader" (white bg, dark text), "Start Following" (pink bg, dark text). Protocol stats bar below (glass-morphic bg with white text): 142 Active Leaders | 1,847 Active Followers | $2.4M Mirrored Volume.

**How It Works** — Centered section. Uppercase faint label "HOW IT WORKS". Bold heading "Three steps. Fully on-chain." Three cards in a row on surface bg: numbered pink badges (1/2/3), bold title, muted description. Pink pill badge below: "Powered by Somnia Reactivity — zero off-chain infrastructure".

**Live Mirror Feed** — Left-aligned section header with "Mirror feed" title + green live dot. Table with columns: Follower, Leader, Pair, Amount, Time. 4 mock rows with truncated addresses.

**Footer** — Border-top divider. Copyright left, Docs/GitHub/Twitter links right.

### Page 2: Leaderboard (`/leaderboard`)

**Page Header** — "RANKINGS" uppercase faint label, "Leaderboard" bold title. "Become a Leader" button with Star icon (pink bg).

**Tab Navigation** — Standings (active, bold + bottom border) | Stats | Activity | Chart.

**Filter Pills** — All (dark filled) | 7 Days (outline) | 30 Days (outline). Chart button (pink bg) on right.

**Leader Table** — Gray bg header row: #, Leader, Score, Win %, P&L, Volume, Fllwrs, Form, Trend. 5 data rows:
- Row 1: Gold left border, gold rank number, pink avatar, "0x7b2e...4f91", 94.2 score, 78.3% win, +$12,450 green, $84.2k, 23 followers, WWLWW form dots, green up sparkline
- Row 2: Silver border, similar pattern
- Row 3: Bronze border
- Rows 4-5: No colored border, one has negative P&L in red with red down sparkline

**Legend Bar** — Gray bg. Left: colored bars for Top Performer/Runner Up/Third Place. Right: green dot=Win, red dot=Loss.

**Ranking Chart** — Bordered card. TrendingUp icon + "Ranking Over Time" title. ChevronLeft/Right + "Week 12" navigation. SVG chart with Y-axis (positions 1-10), X-axis (W1-W12), grid lines, 3 colored lines (pink, indigo, green). End dots. Legend below with leader addresses.

**Follow Modal** — Absolute positioned card with shadow. Title "Follow 0x7b2e...4f91". Form fields: Deposit Amount (with balance display), Max Per Trade + Slippage % side by side, Stop-Loss Threshold. "Confirm & Follow" button.

### Page 3: Trade (`/trade`)

**Navbar** — Connected state: balance text ("12.4 STT") + dark pill with green dot + truncated address.

**Two-Column Layout** — Left: flex-1, Right: 400px fixed.

**Left Column:**

*Tab Navigation* — Positions (active) | Feed | Alerts. Right-aligned "Following 2 leaders" text.

*Position Card (healthy)* — 32px pink avatar, leader address + "Score 94.2 · Rank #1" subtitle. Large green P&L: "+$84.20" (20px bold) with "+16.8% unrealized" below. Stats row: Deposited 420 USDC | Max/Trade 80 | Slippage 0.5% | Stop-Loss 20%. Stop-loss progress bar: label + "0% of 20%" + empty green bar. Action buttons with lucide icons: Plus "Deposit" (pink bg), Minus "Withdraw" (outline), X "Unfollow" (red outline).

*Position Card (danger)* — Red-tinted bg (#FEF8F8). Red avatar bg. Large red P&L: "-$142.80" with "85% of stop-loss" warning. Progress bar 85% filled red. Same action buttons.

*Recent Activity* — Activity icon + "Recent Activity" + green live dot. Dense timeline rows: timestamp | status dot (green/red/amber) | description text | result or badge (FAIL/STOP).

**Right Column:**

*Swap Panel* — Pink surface bg, rounded-2xl. Wallet icon + "Swap" title + "LEADER" badge. "You sell" label → white input field with amount + token selector pill (STT with chevron). ArrowDownUp swap icon in pink square. "You receive" label → similar field (~124.8 USDC). Details section: price impact 0.12%, min output 124.2 USDC. "Swap & Mirror" dark button. Faint disclaimer.

*Your Stats* — Bordered card. BarChart3 icon + "Your Stats" title. Key-value rows with dividers: Score 72.4, Win Rate 68.2%, Total Trades 47, P&L +$3,240 (green), Followers 8, Pending Fees $124. "Claim $124" dark button with wallet icon + "Exit" outline button with LogOut icon.

## Component Architecture

```
src/
├── app.css                    # Tailwind imports + CSS custom properties
├── main.tsx                   # createRoot + StrictMode
├── App.tsx                    # BrowserRouter + Routes
├── data/
│   └── mock.ts                # All mock data
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx     # Navbar + <Outlet /> + Footer
│   ├── ui/
│   │   ├── Button.tsx         # variant: primary | secondary | outline | danger
│   │   ├── Badge.tsx          # variant: default | success | danger | warning
│   │   ├── ProgressBar.tsx    # value, max, color (success | danger)
│   │   ├── FormDots.tsx       # wins: boolean[] → green/red dots
│   │   ├── Sparkline.tsx      # points: number[], color, width, height
│   │   ├── Tabs.tsx           # items: {label, active}[], onChange
│   │   └── StatRow.tsx        # label, value, color?
│   ├── home/
│   │   ├── HeroSection.tsx    # Dithering bg + content
│   │   ├── HowItWorks.tsx     # 3-step cards
│   │   └── LiveMirrorFeed.tsx # Feed table + header
│   ├── leaderboard/
│   │   ├── LeaderTable.tsx    # Header + rows container
│   │   ├── LeaderRow.tsx      # Rank border, avatar, stats, form dots, sparkline
│   │   ├── RankingChart.tsx   # SVG chart
│   │   ├── LeaderLegend.tsx   # Color legend bar
│   │   └── FollowModal.tsx    # Follow form overlay
│   └── trade/
│       ├── PositionCard.tsx   # healthy | danger variant via props
│       ├── SwapPanel.tsx      # Swap form
│       ├── StatsPanel.tsx     # Key-value stat list
│       ├── TradeFeed.tsx      # Activity timeline
│       └── TokenSelector.tsx  # Token dropdown pill
├── pages/
│   ├── HomePage.tsx
│   ├── LeaderboardPage.tsx
│   └── TradePage.tsx
└── lib/
    ├── format.ts              # formatAddress, formatCurrency, formatTimeAgo
    └── cn.ts                  # clsx + twMerge wrapper
```

## Mock Data

```typescript
// data/mock.ts

export interface Leader {
  rank: number
  address: string
  score: number
  winRate: number
  pnl: number
  volume: number
  followers: number
  form: boolean[]  // true=win, false=loss
  trend: number[]  // sparkline points
}

export interface Position {
  leader: string
  score: number
  rank: number
  deposited: number
  token: string
  maxPerTrade: number
  slippage: number
  stopLoss: number
  pnl: number
  pnlPercent: number
  stopLossUsed: number  // 0-100
}

export interface FeedItem {
  time: string
  type: 'success' | 'fail' | 'stop'
  leader: string
  from?: string
  to?: string
  result?: string
  reason?: string
  loss?: string
}

export interface MirrorEntry {
  follower: string
  leader: string
  pair: string
  amount: string
  time: string
}

export const protocolStats = { leaders: 142, followers: 1847, volume: '$2.4M' }

export const leaders: Leader[] = [
  { rank: 1, address: '0x7b2e...4f91', score: 94.2, winRate: 78.3, pnl: 12450, volume: 84200, followers: 23, form: [true,true,false,true,true], trend: [16,14,10,8,6,4,2] },
  { rank: 2, address: '0x9f12...6b7c', score: 87.6, winRate: 72.1, pnl: 8920, volume: 62100, followers: 17, form: [true,true,true,false,true], trend: [14,12,16,10,6,4,3] },
  { rank: 3, address: '0xa3d7...2e18', score: 81.4, winRate: 69.5, pnl: 5340, volume: 41800, followers: 11, form: [false,true,true,true,false], trend: [12,10,8,6,8,5,4] },
  { rank: 4, address: '0x5c91...d4a6', score: 76.8, winRate: 64.2, pnl: -1280, volume: 28600, followers: 8, form: [false,false,true,false,true], trend: [6,8,10,12,14,16,17] },
  { rank: 5, address: '0xf4e2...8b31', score: 71.2, winRate: 61.8, pnl: 2180, volume: 19400, followers: 5, form: [true,false,true,true,false], trend: [10,8,12,10,8,10,8] },
]

export const positions: Position[] = [
  { leader: '0x7b2e...4f91', score: 94.2, rank: 1, deposited: 420, token: 'USDC', maxPerTrade: 80, slippage: 0.5, stopLoss: 20, pnl: 84.20, pnlPercent: 16.8, stopLossUsed: 0 },
  { leader: '0x9f12...6b7c', score: 87.6, rank: 2, deposited: 180, token: 'USDC', maxPerTrade: 50, slippage: 1, stopLoss: 15, pnl: -142.80, pnlPercent: -79.3, stopLossUsed: 85 },
]

export const feedItems: FeedItem[] = [
  { time: '12:04', type: 'success', leader: '0x7b2e', from: '80 USDC', to: '0.032 WETH', result: '+0.032' },
  { time: '11:47', type: 'success', leader: '0x9f12', from: '50 USDC', to: '124 STT', result: '+124' },
  { time: '11:22', type: 'fail', leader: '0x9f12', reason: 'slippage exceeded' },
  { time: '10:58', type: 'stop', leader: '0x9f12', loss: '-$28.40' },
]

export const mirrorFeed: MirrorEntry[] = [
  { follower: '0x3a1f...8c2d', leader: '0x7b2e...4f91', pair: 'STT → USDC', amount: '245.00 STT', time: '2s ago' },
  { follower: '0xd4c8...1a3e', leader: '0x9f12...6b7c', pair: 'WETH → STT', amount: '0.85 WETH', time: '14s ago' },
  { follower: '0x82af...5d90', leader: '0x7b2e...4f91', pair: 'USDC → WETH', amount: '1,200.00 USDC', time: '31s ago' },
  { follower: '0x1e5c...9a4b', leader: '0x9f12...6b7c', pair: 'STT → WETH', amount: '500.00 STT', time: '1m ago' },
]

export const leaderStats = {
  score: 72.4, winRate: 68.2, trades: 47, pnl: 3240, followers: 8, pendingFees: 124
}

export const rankingChartData = {
  weeks: ['W1','W3','W5','W7','W9','W12'],
  lines: [
    { leader: '0x7b2e', color: 'var(--color-chart-1)', positions: [3,2,1,1,1,1] },
    { leader: '0x9f12', color: 'var(--color-chart-2)', positions: [5,7,6,5,3,2] },
    { leader: '0xa3d7', color: 'var(--color-chart-3)', positions: [2,3,2,3,3,3] },
  ]
}
```

## Design Rules

1. **No hardcoded colors** — every color references a CSS variable
2. **No contract calls** — all data from `data/mock.ts`
3. **Space Grotesk only** — loaded via Google Fonts `<link>` in `index.html`
4. **lucide-react icons** — Star, TrendingUp, Users, BarChart3, Activity, AlertTriangle, Wallet, ArrowDownUp, Plus, Minus, X, ChevronLeft, ChevronRight, LogOut, Layers
5. **Dithering shader** — hero section only, `@paper-design/shaders-react`
6. **Desktop-first** — 1440px viewport, flex layouts provide basic responsiveness
7. **Presentational only** — no business logic, no form validation, no API calls
8. **SofaScore patterns** — tabs, colored rank borders, form dots, progress bars, dense data rows

## Out of Scope

- Contract integration (wagmi, viem, wallet connection logic)
- WebSocket real-time updates
- Form validation
- Transaction flows
- Mobile/tablet responsive breakpoints
- Error states
- Loading skeletons
- Animations/transitions (beyond Dithering shader)
