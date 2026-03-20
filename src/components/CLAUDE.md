# src/components/CLAUDE.md

## Organization

Components are grouped by domain:

```
components/
├── home/          # Landing page sections
│   ├── HeroSection.tsx       # Hero with Dithering shader background
│   ├── HowItWorks.tsx        # 3-step interactive panel (stagger animation)
│   ├── ProtocolGateway.tsx   # Bento grid — 3 feature cards with images
│   ├── CallToAction.tsx      # CTA with launch button
│   └── LiveMirrorFeed.tsx    # (unused) live event feed
├── layout/        # App shell
│   ├── MainLayout.tsx        # Navbar + <Outlet /> wrapper
│   ├── Navbar.tsx            # Top nav with wallet connect
│   └── Footer.tsx            # Footer with Dithering shader
├── leaderboard/   # Leaderboard page components
│   └── RankingChart.tsx      # SVG sparkline chart
├── trade/         # Trade page components (swap, positions)
└── ui/            # Reusable primitives
    └── AnimatedImage.tsx     # Image with skeleton loader
```

## Patterns

- **Domain grouping:** Components live in folders matching their page/feature, not by type (no `buttons/`, `cards/` folders)
- **Animations:** Use `motion` from framer-motion. Shared variants live in `lib/animations.ts`. Use `scrollViewport` (includes `once: true`) for scroll-triggered entrances
- **Dithering shader:** `@paper-design/shaders-react` `Dithering` component. Keep `speed` low (0–0.15) to avoid GPU lag. Use `speed={0}` for static patterns
- **Images:** Use `AnimatedImage` wrapper for lazy-loaded images with skeleton placeholders
- **Styling:** Tailwind utility classes. Use `cn()` from `lib/cn.ts` for conditional classes. Theme colors via Tailwind tokens (`text-secondary`, `bg-primary`, etc.)
- **Icons:** `lucide-react` — import individual icons, not the whole library
