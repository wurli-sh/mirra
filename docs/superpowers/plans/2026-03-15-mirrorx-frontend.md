# MirrorX Frontend UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 3-page MirrorX frontend matching Paper designs with mock data, no contract integration.

**Architecture:** Vite 6 React 19 SPA with React Router v7. All colors via CSS custom properties in app.css, mapped to Tailwind v4 theme. Mock data in `src/frontend/data/mock.ts`. Components split by page domain.

**Tech Stack:** React 19, Vite 6, TypeScript 5.7, Tailwind CSS 4.0, React Router 7, Zustand, lucide-react, @paper-design/shaders-react, clsx, tailwind-merge

**Spec:** `docs/superpowers/specs/2026-03-15-mirrorx-frontend-design.md`

**Git identity:** Always commit as `wurli-sh <prabinvai10@gmail.com>` with `Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>`

---

## Chunk 1: Project Scaffold & Foundation

### Task 1: Scaffold Vite + React 19 project

**Files:**
- Create: `src/frontend/` (entire frontend directory)
- Create: `src/frontend/package.json`
- Create: `src/frontend/vite.config.ts`
- Create: `src/frontend/tsconfig.json`
- Create: `src/frontend/index.html`
- Create: `src/frontend/src/main.tsx`
- Create: `src/frontend/src/App.tsx`

The frontend lives in `src/frontend/` to stay separate from the contracts root package.json.

- [ ] **Step 1: Create frontend directory and initialize**

```bash
mkdir -p src/frontend/src
cd src/frontend
pnpm init
```

- [ ] **Step 2: Install dependencies**

```bash
cd src/frontend
pnpm add react@^19 react-dom@^19 react-router-dom@^7 zustand lucide-react clsx tailwind-merge @paper-design/shaders-react
pnpm add -D vite@^6 @vitejs/plugin-react typescript@~5.7 @types/react@^19 @types/react-dom@^19 tailwindcss@^4 @tailwindcss/vite
```

- [ ] **Step 3: Create vite.config.ts**

```typescript
// src/frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
})
```

- [ ] **Step 4: Create tsconfig.json**

```json
// src/frontend/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 5: Create index.html**

```html
<!-- src/frontend/index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MirrorX</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create main.tsx and App.tsx**

```tsx
// src/frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

```tsx
// src/frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { HomePage } from './pages/HomePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { TradePage } from './pages/TradePage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/trade" element={<TradePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
cd src/frontend && pnpm dev
```

Expected: Vite dev server running on http://localhost:5173 (will show blank page — that's fine)

- [ ] **Step 8: Commit**

```bash
git add src/frontend/
git commit -m "feat: scaffold Vite + React 19 frontend"
```

---

### Task 2: CSS Variables + Tailwind v4 Theme + Utilities

**Files:**
- Create: `src/frontend/src/app.css`
- Create: `src/frontend/src/lib/cn.ts`
- Create: `src/frontend/src/lib/format.ts`

- [ ] **Step 1: Create app.css with CSS variables and Tailwind theme**

```css
/* src/frontend/src/app.css */
@import "tailwindcss";

@theme {
  --font-sans: "Space Grotesk", sans-serif;

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

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text);
  margin: 0;
}
```

- [ ] **Step 2: Create cn.ts utility**

```typescript
// src/frontend/src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Create format.ts utility**

```typescript
// src/frontend/src/lib/format.ts
export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  return `$${value.toLocaleString()}`
}

export function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  if (Math.abs(value) >= 1000) {
    return `${prefix}$${Math.abs(value).toLocaleString()}`
  }
  return `${prefix}$${Math.abs(value).toFixed(2)}`
}
```

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/app.css src/frontend/src/lib/
git commit -m "feat: CSS variables, Tailwind theme, and utility functions"
```

---

### Task 3: Mock Data

**Files:**
- Create: `src/frontend/src/data/mock.ts`

- [ ] **Step 1: Create mock.ts with all types and data**

All types (`Leader`, `Position`, `FeedItem`, `MirrorEntry`) and mock data arrays as defined in the spec. Include `protocolStats`, `leaders`, `positions`, `feedItems`, `mirrorFeed`, `leaderStats`, `rankingChartData`.

Copy the complete mock data from the spec document `docs/superpowers/specs/2026-03-15-mirrorx-frontend-design.md` section "Mock Data".

- [ ] **Step 2: Commit**

```bash
git add src/frontend/src/data/
git commit -m "feat: add mock data and types"
```

---

### Task 4: UI Primitives

**Files:**
- Create: `src/frontend/src/components/ui/Button.tsx`
- Create: `src/frontend/src/components/ui/Badge.tsx`
- Create: `src/frontend/src/components/ui/ProgressBar.tsx`
- Create: `src/frontend/src/components/ui/FormDots.tsx`
- Create: `src/frontend/src/components/ui/Sparkline.tsx`
- Create: `src/frontend/src/components/ui/Tabs.tsx`
- Create: `src/frontend/src/components/ui/StatRow.tsx`

- [ ] **Step 1: Button component**

Variants: `primary` (bg-secondary text-white), `secondary` (bg-primary text-secondary), `outline` (border text-secondary), `danger` (border-danger text-danger). All use CSS var colors via Tailwind classes. Props: `variant`, `children`, `className`, `onClick`.

- [ ] **Step 2: Badge component**

Small pill label. Variants: `default` (bg-primary text-secondary), `success` (bg-success/10 text-success), `danger` (bg-danger/10 text-danger), `warning` (bg-warning/10 text-warning). Props: `variant`, `children`.

- [ ] **Step 3: ProgressBar component**

Props: `value` (0-100), `color` ('success' | 'danger'). Renders a thin bar with bg track and filled portion. Uses `bg-success` or `bg-danger` for fill.

- [ ] **Step 4: FormDots component**

Props: `results: boolean[]`. Renders a row of 8px circles — `bg-success` for true (win), `bg-danger` for false (loss).

- [ ] **Step 5: Sparkline component**

Props: `points: number[]`, `color: string`, `width?: number`, `height?: number`. Renders an SVG polyline from the points array. Color passed as CSS variable string.

- [ ] **Step 6: Tabs component**

Props: `items: { label: string; key: string }[]`, `active: string`, `onChange: (key: string) => void`. Renders horizontal tab bar with active state (bold + bottom border).

- [ ] **Step 7: StatRow component**

Props: `label: string`, `value: string | number`, `color?: string`. Renders a flex row with label left (muted), value right (bold), optional color on value. Bottom border divider.

- [ ] **Step 8: Commit**

```bash
git add src/frontend/src/components/ui/
git commit -m "feat: UI primitives — Button, Badge, ProgressBar, FormDots, Sparkline, Tabs, StatRow"
```

---

## Chunk 2: Layout & Home Page

### Task 5: Layout Components

**Files:**
- Create: `src/frontend/src/components/layout/Navbar.tsx`
- Create: `src/frontend/src/components/layout/Footer.tsx`
- Create: `src/frontend/src/components/layout/MainLayout.tsx`

- [ ] **Step 1: Navbar**

Logo (32px pink rounded square + "MirrorX" bold 20px). Nav links using `<NavLink>` from react-router — active link is font-weight 500, inactive is opacity-60. Right side: "Connect Wallet" button (dark pill). Max-width container centered. Padding 20px 80px.

For the Trade page connected state (balance + address pill with green dot), accept an optional `connected` prop — hardcode to `false` for Home/Leaderboard, `true` for Trade page.

- [ ] **Step 2: Footer**

Border-top divider. Flex between: "© 2026 MirrorX — Built on Somnia" left. "Docs", "GitHub", "Twitter" links right. Muted text, 13px.

- [ ] **Step 3: MainLayout**

Wraps `<Navbar />` + `<Outlet />` + `<Footer />`. Min-height screen. Flex column.

- [ ] **Step 4: Verify layout renders**

```bash
cd src/frontend && pnpm dev
```

Open http://localhost:5173 — should see navbar and footer with empty content area.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/layout/
git commit -m "feat: layout — Navbar, Footer, MainLayout"
```

---

### Task 6: Home Page

**Files:**
- Create: `src/frontend/src/components/home/HeroSection.tsx`
- Create: `src/frontend/src/components/home/HowItWorks.tsx`
- Create: `src/frontend/src/components/home/LiveMirrorFeed.tsx`
- Create: `src/frontend/src/pages/HomePage.tsx`

- [ ] **Step 1: HeroSection**

Full-width bg-secondary section. `<Dithering>` component from `@paper-design/shaders-react` positioned absolute, covering full hero. Content on top (relative z-10): white headline (72px, bold, tight tracking), muted white subtitle (20px), two CTA buttons using `<Link>` to `/trade` and `/leaderboard`. Protocol stats bar with glass-morphic bg (rgba white 0.08), white text — 3 stats with vertical dividers.

Import `protocolStats` from mock data.

- [ ] **Step 2: HowItWorks**

Centered section. Uppercase faint label, bold heading. 3 cards in flex row with gap-32px: each has a numbered pink badge (48px square), bold title, muted body text. All on bg-surface. Pink pill badge below center-aligned.

- [ ] **Step 3: LiveMirrorFeed**

Section with header (title + green live dot). Table structure using flex rows. Header row with uppercase faint column labels. 4 data rows from `mirrorFeed` mock data. Bottom border dividers between rows.

- [ ] **Step 4: HomePage**

Compose: `<HeroSection />` + `<HowItWorks />` + `<LiveMirrorFeed />`. No additional wrapper needed.

- [ ] **Step 5: Verify home page renders**

```bash
cd src/frontend && pnpm dev
```

Open http://localhost:5173 — should see full home page matching Paper design.

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/components/home/ src/frontend/src/pages/HomePage.tsx
git commit -m "feat: Home page — Hero with Dithering shader, HowItWorks, LiveMirrorFeed"
```

---

## Chunk 3: Leaderboard Page

### Task 7: Leaderboard Components

**Files:**
- Create: `src/frontend/src/components/leaderboard/LeaderTable.tsx`
- Create: `src/frontend/src/components/leaderboard/LeaderRow.tsx`
- Create: `src/frontend/src/components/leaderboard/LeaderLegend.tsx`
- Create: `src/frontend/src/components/leaderboard/RankingChart.tsx`
- Create: `src/frontend/src/components/leaderboard/FollowModal.tsx`

- [ ] **Step 1: LeaderRow**

Props: `leader: Leader`. Renders a flex row with:
- Left border colored by rank (1=gold, 2=silver, 3=bronze, else transparent)
- Rank number colored to match
- 28px avatar placeholder (rounded square)
- Address (semibold 14px)
- Score (bold), Win % (regular), P&L (colored green/red), Volume (muted), Followers
- `<FormDots>` with leader's form array
- `<Sparkline>` with leader's trend array, colored green (up) or red (down) based on P&L

- [ ] **Step 2: LeaderTable**

Renders the gray bg header row with column labels, then maps `leaders` array through `<LeaderRow>`.

- [ ] **Step 3: LeaderLegend**

Gray bg bar. Left side: 3 colored bars with labels (Top Performer, Runner Up, Third Place). Right side: green dot "Win", red dot "Loss".

- [ ] **Step 4: RankingChart**

Bordered card with:
- Header: TrendingUp icon + "Ranking Over Time" + week navigator (ChevronLeft/Right + "Week 12")
- SVG chart: Y-axis labels (1,3,5,7,10), X-axis labels (W1-W12), horizontal grid lines, 3 bezier paths from `rankingChartData`, end dots
- Legend: 3 colored bars with leader addresses

The chart is purely decorative SVG — hardcode the path data to match the mock `rankingChartData.lines[].positions`.

- [ ] **Step 5: FollowModal**

Absolute positioned card (480px wide, shadow). Title "Follow 0x7b2e...4f91". Form fields with labels: Deposit Amount (with "Balance: 2,340 USDC" helper), Max Per Trade + Slippage % side by side, Stop-Loss Threshold. Dark "Confirm & Follow" button. Controlled by Zustand `useUIStore` modal state.

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/components/leaderboard/
git commit -m "feat: leaderboard components — Table, Row, Legend, RankingChart, FollowModal"
```

---

### Task 8: Leaderboard Page

**Files:**
- Create: `src/frontend/src/pages/LeaderboardPage.tsx`
- Create: `src/frontend/src/stores/ui.ts`

- [ ] **Step 1: Create UI store**

```typescript
// src/frontend/src/stores/ui.ts
import { create } from 'zustand'

interface UIState {
  activeLeaderboardTab: string
  activeTradeTab: string
  followModalOpen: boolean
  setActiveLeaderboardTab: (tab: string) => void
  setActiveTradeTab: (tab: string) => void
  setFollowModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeLeaderboardTab: 'standings',
  activeTradeTab: 'positions',
  followModalOpen: false,
  setActiveLeaderboardTab: (tab) => set({ activeLeaderboardTab: tab }),
  setActiveTradeTab: (tab) => set({ activeTradeTab: tab }),
  setFollowModalOpen: (open) => set({ followModalOpen: open }),
}))
```

- [ ] **Step 2: LeaderboardPage**

Compose:
- Page header ("RANKINGS" label + "Leaderboard" title + "Become a Leader" button with Star icon)
- `<Tabs>` with Standings/Stats/Activity/Chart
- Filter pills row (All/7 Days/30 Days + Chart button)
- `<LeaderTable />`
- `<LeaderLegend />`
- `<RankingChart />`
- `<FollowModal />` (conditionally rendered from store)

Padding 80px horizontal to match Paper design.

- [ ] **Step 3: Verify leaderboard renders**

```bash
cd src/frontend && pnpm dev
```

Navigate to http://localhost:5173/leaderboard — should see full leaderboard matching Paper design.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/pages/LeaderboardPage.tsx src/frontend/src/stores/
git commit -m "feat: Leaderboard page with tabs, table, chart, and follow modal"
```

---

## Chunk 4: Trade Page

### Task 9: Trade Components

**Files:**
- Create: `src/frontend/src/components/trade/PositionCard.tsx`
- Create: `src/frontend/src/components/trade/SwapPanel.tsx`
- Create: `src/frontend/src/components/trade/StatsPanel.tsx`
- Create: `src/frontend/src/components/trade/TradeFeed.tsx`
- Create: `src/frontend/src/components/trade/TokenSelector.tsx`

- [ ] **Step 1: TokenSelector**

Props: `token: string`. Renders a pill with token name + ChevronDown icon. bg-surface-hover, rounded-full. Static (no dropdown logic needed for mock).

- [ ] **Step 2: PositionCard**

Props: `position: Position`. Determines healthy vs danger from `position.stopLossUsed > 70`. Renders:
- Avatar (pink or red bg depending on variant) + leader address + score/rank subtitle
- Large P&L (green or red, 20px bold) + percent/warning text
- Stats row: 4 items (deposited, max/trade, slippage, stop-loss)
- `<ProgressBar>` for stop-loss threshold
- Action buttons: Plus "Deposit" (secondary), Minus "Withdraw" (outline), X "Unfollow" (danger outline)

Uses lucide-react icons: `Plus`, `Minus`, `X`.

- [ ] **Step 3: SwapPanel**

Pink surface bg card. Header: Wallet icon + "Swap" + LEADER badge. Sell section: label + white input area with amount + `<TokenSelector token="STT" />`. ArrowDownUp icon in pink square. Receive section: similar with "~124.8" + USDC selector. Details: price impact + min output rows. Dark "Swap & Mirror" button. Faint disclaimer text.

All values are static/hardcoded from mock.

- [ ] **Step 4: StatsPanel**

Bordered card. BarChart3 icon + "Your Stats" title. Map `leaderStats` through `<StatRow>` components. P&L row colored green. Two buttons at bottom: "Claim $124" (primary dark with Wallet icon) + "Exit" (outline with LogOut icon).

- [ ] **Step 5: TradeFeed**

Header: Activity icon + "Recent Activity" + green live dot. Maps `feedItems` to dense rows: timestamp (faint, 36px wide) | status dot (5px, colored by type) | description text | result or Badge (FAIL/STOP).

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/components/trade/
git commit -m "feat: trade components — PositionCard, SwapPanel, StatsPanel, TradeFeed, TokenSelector"
```

---

### Task 10: Trade Page

**Files:**
- Create: `src/frontend/src/pages/TradePage.tsx`

- [ ] **Step 1: TradePage**

Two-column layout: left flex-1, right 400px.

Left column:
- `<Tabs>` with Positions/Feed/Alerts + "Following 2 leaders" text
- Map `positions` through `<PositionCard>`
- `<TradeFeed>`

Right column:
- `<SwapPanel />`
- `<StatsPanel />`

Gap 24px between columns. Padding 0 80px.

The Navbar should show connected state on this page. Pass `connected` prop or use a simple route-based check in Navbar.

- [ ] **Step 2: Verify trade page renders**

```bash
cd src/frontend && pnpm dev
```

Navigate to http://localhost:5173/trade — should see full trade page matching Paper design.

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/pages/TradePage.tsx
git commit -m "feat: Trade page with positions, swap panel, stats, and feed"
```

---

## Chunk 5: Final Polish & Verification

### Task 11: Visual verification and fixes

- [ ] **Step 1: Run dev server and check all 3 pages**

```bash
cd src/frontend && pnpm dev
```

Walk through each page:
- `/` — Hero with Dithering shader, stats, how it works, live feed, footer
- `/leaderboard` — Tabs, filter pills, table with rank borders and form dots, chart, legend
- `/trade` — Position cards (healthy + danger), swap panel, stats panel, feed

- [ ] **Step 2: Check color consistency**

Grep for any hardcoded hex values in components — there should be NONE (only in app.css):

```bash
cd src/frontend && grep -r '#[0-9A-Fa-f]\{3,8\}' src/ --include='*.tsx' --include='*.ts' | grep -v 'app.css' | grep -v 'mock.ts'
```

Expected: No output (or only in Dithering shader props which reference the design system colors).

- [ ] **Step 3: Fix any visual issues found**

Compare against Paper designs. Adjust spacing, typography, colors as needed.

- [ ] **Step 4: Add scripts to package.json**

Ensure `src/frontend/package.json` has:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 5: Final commit and push**

```bash
git add src/frontend/
git commit -m "feat: MirrorX frontend UI complete — 3 pages with mock data"
git push origin main
```
