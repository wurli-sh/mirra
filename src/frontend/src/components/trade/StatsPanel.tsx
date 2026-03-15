import { BarChart3, Wallet, LogOut } from 'lucide-react'
import { StatRow } from '../ui/StatRow'
import { leaderStats } from '../../data/mock'

export function StatsPanel() {
  return (
    <div className="border border-border rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 size={15} className="text-secondary" />
        <span className="font-bold text-[15px] text-secondary">Your Stats</span>
      </div>

      {/* Stats */}
      <div>
        <StatRow label="Score" value={leaderStats.score} />
        <StatRow label="Win Rate" value={`${leaderStats.winRate}%`} />
        <StatRow label="Total Trades" value={leaderStats.trades} />
        <StatRow label="P&L" value={`+$${leaderStats.pnl.toLocaleString()}`} color="text-success" />
        <StatRow label="Followers" value={leaderStats.followers} />
        <StatRow label="Pending Fees" value={`$${leaderStats.pendingFees}`} last />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button className="flex-1 bg-secondary text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-[13px] font-semibold">
          <Wallet size={14} className="text-white" />
          Claim ${leaderStats.pendingFees}
        </button>
        <button className="border border-border-strong rounded-xl py-2.5 px-4 flex items-center justify-center gap-1.5 text-[13px] text-text-muted">
          <LogOut size={14} />
          Exit
        </button>
      </div>
    </div>
  )
}
