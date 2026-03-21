import { motion } from 'framer-motion'
import {
  Trophy, Users, TrendingUp, Wallet, BarChart3, Activity,
  ArrowRight, Radio,
} from 'lucide-react'
import { useReactiveEvents, type ReactiveEvent as SSEEvent } from '@/hooks/useReactiveEvents'

function truncateAddr(addr: string) {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function formatPnl(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`
}

// ─── Leaderboard Card ───

interface Leader {
  address: string
  shortAddress?: string
  score: number
  winRate: number
  pnl: number
  volume: number
  totalTrades: number
  followers: number
}

function LeaderboardCard({ leaders, count }: { leaders: Leader[]; count: number }) {
  return (
    <Card icon={Trophy} title="Leaderboard" subtitle={`${count} leader${count !== 1 ? 's' : ''}`}>
      {leaders.length === 0 ? (
        <p className="text-xs text-text-muted py-2">No leaders registered yet.</p>
      ) : (
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-muted border-b border-primary/15">
                <th className="text-left font-medium py-1.5 pl-4 pr-2">#</th>
                <th className="text-left font-medium py-1.5 px-2">Leader</th>
                <th className="text-right font-medium py-1.5 px-2">Score</th>
                <th className="text-right font-medium py-1.5 px-2">PnL</th>
                <th className="text-right font-medium py-1.5 px-2">Win%</th>
                <th className="text-right font-medium py-1.5 pr-4 pl-2">Followers</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((l, i) => (
                <tr key={l.address} className="border-b border-primary/10 last:border-0">
                  <td className="py-2 pl-4 pr-2 text-text-muted">{i + 1}</td>
                  <td className="py-2 px-2 font-mono text-text">{l.shortAddress ?? truncateAddr(l.address)}</td>
                  <td className="py-2 px-2 text-right font-semibold text-text">{l.score}</td>
                  <td className={`py-2 px-2 text-right font-semibold ${l.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatPnl(l.pnl)}
                  </td>
                  <td className="py-2 px-2 text-right text-text">{l.winRate}%</td>
                  <td className="py-2 pr-4 pl-2 text-right text-text-muted">{l.followers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ─── Leader Stats Card ───

function LeaderStatsCard({ data }: { data: Record<string, unknown> }) {
  return (
    <Card icon={TrendingUp} title="Leader Stats" subtitle={truncateAddr(data.address as string)}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Stat label="Score" value={String(data.score)} />
        <Stat label="Win Rate" value={`${data.winRate}%`} />
        <Stat label="PnL" value={`${formatPnl(data.pnl as number)} STT`} positive={(data.pnl as number) >= 0} />
        <Stat label="Volume" value={`${data.volume} STT`} />
        <Stat label="Trades" value={String(data.totalTrades)} />
        <Stat label="Followers" value={String(data.followers)} />
      </div>
    </Card>
  )
}

// ─── Balances Card ───

function BalancesCard({ data }: { data: Record<string, string> }) {
  const tokens = [
    { symbol: 'STT', amount: data.STT },
    { symbol: 'USDC', amount: data.USDC },
    { symbol: 'WETH', amount: data.WETH },
  ]
  return (
    <Card icon={Wallet} title="Your Balances">
      <div className="space-y-1.5">
        {tokens.map(t => (
          <div key={t.symbol} className="flex justify-between items-center">
            <span className="text-xs font-medium text-text">{t.symbol}</span>
            <span className="text-xs font-semibold text-text tabular-nums">
              {Number(t.amount).toFixed(4)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Positions Card ───

interface Position {
  leader: string
  score: number
  deposited: number
  pnl: number
  pnlPercent: number
  stopLoss: number
}

function PositionsCard({ positions }: { positions: Position[] }) {
  return (
    <Card icon={Users} title="Your Positions" subtitle={`${positions.length} active`}>
      {positions.length === 0 ? (
        <p className="text-xs text-text-muted py-2">No active positions. Follow a leader to get started!</p>
      ) : (
        <div className="space-y-2.5">
          {positions.map(p => (
            <div key={p.leader} className="flex items-center justify-between gap-3 py-1.5 border-b border-primary/10 last:border-0">
              <div className="min-w-0">
                <span className="text-xs font-mono text-text block">{truncateAddr(p.leader)}</span>
                <span className="text-[10px] text-text-muted">Score {p.score} · SL {p.stopLoss} STT</span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-text block">{p.deposited} STT</span>
                <span className={`text-[10px] font-semibold ${p.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatPnl(p.pnl)} STT ({p.pnlPercent > 0 ? '+' : ''}{p.pnlPercent}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Protocol Stats Card ───

function ProtocolStatsCard({ data }: { data: Record<string, unknown> }) {
  return (
    <Card icon={BarChart3} title="Protocol Stats">
      <div className="grid grid-cols-3 gap-3">
        <StatBlock label="Leaders" value={String(data.leaders)} />
        <StatBlock label="Followers" value={String(data.followers)} />
        <StatBlock label="Volume" value={String(data.volume)} />
      </div>
    </Card>
  )
}

// ─── Recent Trades Card ───

interface TradeEvent {
  type: string
  leader: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  timestamp: number
}

function RecentTradesCard({ events: toolEvents, lastTradeSecondsAgo }: { events: TradeEvent[]; lastTradeSecondsAgo: number | null }) {
  // Use live SSE stream — falls back to tool result if SSE has nothing
  const { events: liveEvents, isConnected } = useReactiveEvents(10)

  const displayEvents: TradeEvent[] = liveEvents.length > 0
    ? liveEvents.map(e => ({
        type: e.type,
        leader: e.leader,
        tokenIn: e.tokenIn,
        tokenOut: e.tokenOut,
        amountIn: e.amountIn,
        amountOut: e.amountOut,
        timestamp: e.timestamp,
      }))
    : toolEvents

  return (
    <Card
      icon={Activity}
      title="Recent Activity"
      subtitle={isConnected ? 'Live' : lastTradeSecondsAgo != null ? `${lastTradeSecondsAgo}s ago` : undefined}
    >
      {isConnected && (
        <div className="flex items-center gap-1.5 mb-2">
          <Radio size={10} className="text-success animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-success">Somnia Reactivity</span>
        </div>
      )}
      {displayEvents.length === 0 ? (
        <p className="text-xs text-text-muted py-2">No recent trades yet. Swaps will appear here in real time.</p>
      ) : (
        <div className="space-y-1.5">
          {displayEvents.slice(0, 5).map((e, i) => (
            <div key={`${e.timestamp}-${i}`} className="flex items-center gap-2 text-xs py-1 border-b border-primary/10 last:border-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-1.5 py-0.5 rounded shrink-0">
                {e.type === 'swap' ? 'SWAP' : 'MIRROR'}
              </span>
              <span className="text-text-muted truncate">{truncateAddr(e.leader)}</span>
              <span className="text-text shrink-0">
                {e.amountIn} {e.tokenIn}
              </span>
              <ArrowRight size={10} className="text-text-muted shrink-0" />
              <span className="text-text font-semibold shrink-0">
                {Number(e.amountOut).toFixed(2)} {e.tokenOut}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Shared Components ───

function Card({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Trophy
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="border border-primary/30 rounded-xl rounded-tl-sm overflow-hidden my-1 max-w-md"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 bg-primary/20 border-b border-primary/30">
        <div className="size-7 rounded-md bg-primary flex items-center justify-center">
          <Icon size={14} className="text-secondary" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-text">{title}</span>
          {subtitle && <span className="text-xs text-text-muted">{subtitle}</span>}
        </div>
      </div>
      <div className="px-4 py-3 bg-surface">
        {children}
      </div>
    </motion.div>
  )
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      <p className={`text-sm font-semibold ${positive === true ? 'text-success' : positive === false ? 'text-danger' : 'text-text'}`}>
        {value}
      </p>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold text-text">{value}</p>
      <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ─── Main Router ───

const DATA_TOOLS = new Set([
  'get_leaders', 'get_leader_stats', 'get_protocol_stats',
  'get_user_positions', 'get_token_balances', 'get_recent_trades',
])

export function isDataTool(toolName: string): boolean {
  return DATA_TOOLS.has(toolName)
}

export function DataCard({ toolName, data }: { toolName: string; data: Record<string, unknown> }) {
  if (!data || 'error' in data) return null

  switch (toolName) {
    case 'get_leaders':
      return <LeaderboardCard leaders={(data.leaders as Leader[]) ?? []} count={(data.count as number) ?? 0} />
    case 'get_leader_stats':
      return <LeaderStatsCard data={data} />
    case 'get_protocol_stats':
      return <ProtocolStatsCard data={data} />
    case 'get_user_positions':
      return <PositionsCard positions={(data.positions as Position[]) ?? []} />
    case 'get_token_balances':
      return <BalancesCard data={data as Record<string, string>} />
    case 'get_recent_trades':
      return <RecentTradesCard events={(data.events as TradeEvent[]) ?? []} lastTradeSecondsAgo={data.lastTradeSecondsAgo as number | null} />
    default:
      return null
  }
}
