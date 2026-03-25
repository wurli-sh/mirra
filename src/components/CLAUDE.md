# src/components/CLAUDE.md

## Organization

Components are grouped by domain:

```
components/
├── home/          # Landing page sections
│   ├── HeroSection.tsx       # Hero with Dithering shader background
│   ├── HowItWorks.tsx        # 3-step interactive panel (stagger animation)
│   ├── ProtocolGateway.tsx   # Bento grid — 3 feature cards (currently commented out)
│   ├── OniSection.tsx        # Oni showcase with chat preview + CTA
│   ├── CallToAction.tsx      # CTA with launch button
│   └── LiveMirrorFeed.tsx    # (unused) live event feed
├── layout/        # App shell
│   ├── MainLayout.tsx        # Navbar + <Outlet /> wrapper
│   ├── Navbar.tsx            # Voiceflow-style navbar: logo left, pill nav center, wallet right
│   └── Footer.tsx            # Footer with Dithering shader
├── leaderboard/   # Leader components (used in unified Trade page)
│   ├── LeaderTable.tsx       # Leader rankings table with follow/unfollow
│   ├── LeaderRow.tsx         # Individual leader row with rank badge
│   ├── FollowModal.tsx       # Follow configuration modal
│   ├── LeaderModal.tsx       # Reusable register/deregister leader modal
│   ├── LeaderLegend.tsx      # Rank tier color legend (gold/silver/bronze)
│   └── RankingChart.tsx      # SVG line chart showing leader ranking trends
├── trade/         # Trade page components
│   ├── SwapPanel.tsx         # Dark charcoal swap card with token selectors
│   ├── PositionCard.tsx      # Follow position display
│   ├── TradeFeed.tsx         # Live activity feed (SSE-powered)
│   ├── TokenSelector.tsx     # Token dropdown selector
│   └── StatsPanel.tsx        # Leader stats + pending fees + claim button
├── chat/          # AI chat agent components
│   ├── ChatPanel.tsx         # Main chat container (useChat, session storage, Oni avatar)
│   ├── ChatMessage.tsx       # Message rendering (markdown + DataCard/ActionCard detection)
│   ├── ChatInput.tsx         # Auto-resizing textarea input
│   ├── SuggestedPrompts.tsx  # Quick prompt buttons
│   ├── ActionCard.tsx        # Wagmi-based tx execution card (9 action types, toast, follow-ups)
│   ├── ExecutedCard.tsx      # Auto-executed result card for session key mode (green, tx link)
│   ├── DataCard.tsx          # Read tool result cards (leaderboard, positions, balances, activity)
│   ├── ActivateAgentModal.tsx # Session key onboarding flow (sign → fund → gas → done)
│   └── TopUpModal.tsx        # Transfer more STT to session wallet
└── ui/            # Reusable primitives
    ├── OniAvatar.tsx         # Piggi SVG avatar (bare/bg modes, sm/md/lg sizes)
    ├── AnimatedImage.tsx     # Image with skeleton loader
    ├── Button.tsx            # Styled button (primary/secondary/outline/danger variants)
    ├── TextShimmer.tsx       # Character shimmer loading animation
    ├── TextLoop.tsx          # Cycling text with framer-motion
    ├── ThinkingSpinner.tsx   # SVG pulsing grid spinner
    ├── Tabs.tsx              # Animated tab switcher with sliding indicator
    ├── Badge.tsx             # Status badge component
    ├── FormDots.tsx          # Win/loss dot indicator (green/red circles)
    ├── ProgressBar.tsx       # Horizontal progress bar (success/danger colors)
    ├── Sparkline.tsx         # Inline SVG sparkline chart
    └── StatRow.tsx           # Label-value row for stats panels
```

## Patterns

- **Domain grouping:** Components live in folders matching their page/feature
- **Animations:** Use `motion` from framer-motion. Shared variants live in `lib/animations.ts` with fast cubic-bezier easing. Use `scrollViewport` (includes `once: true`) for scroll-triggered entrances
- **Dithering shader:** `@paper-design/shaders-react` `Dithering` component. Use `speed={0}` for static or `speed={0.02}` for subtle. No `pxSize` prop (deprecated)
- **Styling:** Tailwind utility classes. Use `cn()` from `lib/cn.ts` for conditional classes. Theme colors via Tailwind tokens — no hardcoded hex values
- **Icons:** `lucide-react` — import individual icons, not the whole library

## Chat Component Patterns

- **ExecutedCard flow (autonomous):** Session active → server executes tx → returns `{ executed: true, txHash }` → `ChatMessage` renders `ExecutedCard` (green success, tx link, follow-ups)
- **ActionCard flow (manual):** No session → server returns ActionCard data → `ChatMessage` renders `ActionCard` → user clicks Confirm → wagmi `useWriteContract` → toast lifecycle → follow-up buttons
- **Fallback:** When session wallet has insufficient tokens, executable tools return ActionCard data instead (graceful degradation)
- **DataCard flow:** Server read tools return data → `ChatMessage` detects data tool names → renders `DataCard` (leaderboard table, positions, balances, recent activity with live SSE)
- **Text suppression:** Text parts after a DataCard/ActionCard/ExecutedCard are hidden — prevents LLM from repeating card data
- **XML sanitization:** `sanitizeText()` strips hallucinated `<PascalCase>` tags from LLM output
- **Session persistence:** Messages in `sessionStorage`, ActionCard tx hashes in `sessionStorage`
- **Loading labels:** Randomized piggi-themed labels picked once per loading session via `useRef`

## Trade Page (Unified)

The Trade page combines the former Leaderboard and Trade pages:
- Left column: SwapPanel (charcoal card)
- Right column: Tabbed content (Leaders / Positions / Activity)
- Top stats bar: Protocol counters + user-specific stat
- Leader register/deregister via `LeaderModal` component
