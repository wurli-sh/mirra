# MirrorX — Live Demo (3–4 min)

> Reactive copy-trading on Somnia. One leader swap triggers an entire on-chain cascade — mirror execution + risk checks — zero bots, zero backend, just smart contracts.

---

## Setup (before demo)

- **Account 1 (Leader):** ~90 STT, already registered as leader
- **Account 2 (Follower):** ~50 STT
- Both on Somnia Shannon Testnet (Chain ID 50312)
- Use **two Chrome profiles** (each with its own MetaMask) or **Chrome + Brave/Firefox**
- App running: `pnpm dev` → `http://localhost:5173`
- **Pre-approve STT** on Acc 1 for SimpleDEX (do one approve tx on `/trade` beforehand)

### How two accounts work
Each Chrome profile has its own MetaMask extension. Create a second Chrome profile at `chrome://settings/manageProfile`, install MetaMask there, import your second wallet. Open the app in both profiles side-by-side.

---

## The Flow (single browser, switch accounts if needed)

### 0:00 – 0:20 | Landing Page

Open `/` — quick scroll:

> *"MirrorX is a reactive copy-trading protocol on Somnia. Leaders trade, followers mirror — fully on-chain, no bots, no infrastructure."*

- Point at hero headline
- Click through **How It Works** — 3 steps: Leader Swap → Mirror Execution → Risk Protection
- Point at Protocol Gateway cards

Click **"Launch App"** → `/leaderboard`

---

### 0:20 – 0:40 | Show the Leader (Acc 1)

On `/leaderboard`, Acc 1 is already connected and registered:

- Point at **"You are a Leader"** green badge
- Point at your row: gold crown, "you" tag, score, stats
- Point at **protocol stats bar** — leaders count, followers, volume

> *"This account is already registered as a leader with 10 STT staked. The reputation engine tracks every trade — win rate, volume, P&L — all computed on-chain."*

---

### 0:40 – 1:30 | Follow the Leader (Acc 2)

Switch to Acc 2 (second Chrome profile or switch MetaMask account):

1. On `/leaderboard`, **hover** the leader row → **"Follow"** button
2. Click **Follow** → modal opens with defaults:
   - Deposit: **30 STT**
   - Max Per Trade: **10 STT**
   - Slippage: **1%**
   - Stop-Loss: **15 STT**
3. Click **"Approve STT"** → confirm
4. Click **"Confirm & Follow"** → confirm
5. Success message → modal auto-closes

> *"Follower deposited 30 STT into a non-custodial vault. Max 10 STT per mirrored trade, 1% slippage tolerance, and if losses hit 15 STT the RiskGuardian will auto-close the position on-chain."*

Point at follower count incrementing on the leader row.

---

### 1:30 – 2:15 | Leader Swap — The Cascade (Acc 1)

Switch to Acc 1. Navigate to `/trade`:

1. Point at **Stats bar** — Score, Win Rate, Followers (now 1), Pending Fees
2. **Swap Panel**: Sell **20 STT** → Buy **USDC** (defaults pre-filled)
3. Show the live quote + price impact
4. Click **"Swap & Mirror"** → confirm

> *"This is the key moment. One swap triggers the whole cascade:"*
>
> *"SimpleDEX emits a Swap event → MirrorExecutor catches it reactively, pulls 10 STT from the follower's vault, executes the same swap proportionally, updates positions and reputation → RiskGuardian catches the MirrorExecuted event and checks the stop-loss. All in the same block. No bots. No servers."*

Point at **Live Trade Feed** — event appears in real-time.

---

### 2:15 – 3:00 | Follower Position (Acc 2)

Switch to Acc 2. Navigate to `/trade`:

- **Your Positions** shows the mirror position:
  - Leader address, rank, score
  - **P&L** with percentage
  - Deposited: ~20 STT remaining (10 was mirrored)
  - **Stop-loss progress bar**

> *"10 STT was auto-mirrored into USDC matching the leader's trade. The stop-loss bar shows how close to the 15 STT threshold."*

- Show action buttons: **Deposit** / **Withdraw** / **Unfollow**
  - Click Deposit to show the inline input (don't need to submit)

> *"Full position management — deposit more, partial withdraw, or unfollow to exit completely."*

---

### 3:00 – 3:30 | Leaderboard Analytics

Navigate to `/leaderboard` (either account):

1. **Standings** — table with ranks, scores, P&L, follow buttons
2. Click **Stats** tab — Top Performer, Avg Win Rate, Total P&L, Score Distribution chart
3. Click **Activity** tab — live swap event feed

> *"All data reads directly from the blockchain. No backend, no indexer. Reputation = 60% win rate + 20% volume + 20% recency."*

---

### 3:30 – 3:45 | Close

> *"One leader swap → reactive mirror execution → risk checks. Seven contracts, two reactive, three subscriptions. Zero bots, zero infrastructure. That's MirrorX on Somnia."*

---

## Budget Breakdown

| | Acc 1 (Leader) | Acc 2 (Follower) |
|---|---|---|
| Starting | ~90 STT | ~50 STT |
| Leader stake | -10 (already done) | — |
| Follow deposit | — | -30 |
| Swap demo (×3) | -60 (20 each) | — |
| Gas reserve | ~5 | ~5 |
| **Leftover** | **~15 STT** | **~15 STT** |

You can do **3 demo swaps** comfortably. Each swap mirrors 10 STT from the follower vault.

---

## If Judges Ask

**"What if there are more than 5 followers?"**
> MirrorExecutor processes 5 per tx, then emits a MirrorContinue event that triggers itself for the next batch. Paginated fan-out — Somnia's gas model caps at 10M per tx.

**"What about front-running?"**
> The reactive handler executes atomically — there's no mempool window. The swap and mirror happen in the same reactive call.

**"How is the reputation score calculated?"**
> 60% win rate + 20% volume (normalized to 1000 STT) + 20% recency (last 1000 blocks). All computed on-chain in the ReputationEngine contract.

**"Is the follower vault custodial?"**
> No. Tokens can only be pulled by MirrorExecutor (for mirroring) or RiskGuardian (for emergency close). The follower can withdraw or unfollow at any time.

---

## Architecture

```
Leader swaps on SimpleDEX
       │
       ▼ Swap event
  ┌────────────────────┐
  │  MirrorExecutor    │ ← reactive subscription
  │  pulls vault → swaps → updates position + reputation
  └────────┬───────────┘
           ▼ MirrorExecuted event
  ┌────────────────────┐
  │  RiskGuardian      │ ← reactive subscription
  │  checks stop-loss → emergency close if breached
  └────────────────────┘
```

**7 contracts** (Solidity 0.8.30) · **2 reactive** · **3 subscriptions** · React 19 + wagmi v2 + viem · Somnia Testnet (50312)
