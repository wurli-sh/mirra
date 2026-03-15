import { motion } from 'framer-motion'
import { BarChart3, Wallet, LogOut, Loader2 } from 'lucide-react'
import { StatRow } from '../ui/StatRow'
import { useIsLeader } from '@/hooks/useRegisterLeader'
import { useClaimFees, usePendingFees } from '@/hooks/useClaimFees'
import { useLeaderStats } from '@/hooks/useLeaderStats'
import { useWallet } from '@/hooks/useWallet'

export function StatsPanel() {
  const { isConnected } = useWallet()
  const { isLeader } = useIsLeader()
  const { fees } = usePendingFees()
  const { claim, isPending, isConfirming } = useClaimFees()
  const stats = useLeaderStats()

  const claimLoading = isPending || isConfirming

  return (
    <div className="border border-border rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 size={15} className="text-secondary" />
        <span className="font-bold text-sm text-secondary">Your Stats</span>
        {isLeader && (
          <span className="ml-auto text-xs bg-primary text-secondary px-2 py-0.5 rounded-full font-medium">
            Leader
          </span>
        )}
      </div>

      {/* Stats */}
      {!isConnected ? (
        <p className="text-sm text-text-muted py-4 text-center">
          Connect wallet to view stats
        </p>
      ) : stats.isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted ml-2">Loading...</span>
        </div>
      ) : (
        <div>
          <StatRow label="Score" value={stats.score} />
          <StatRow label="Win Rate" value={`${stats.winRate}%`} />
          <StatRow label="Total Trades" value={stats.trades} />
          <StatRow
            label="P&L"
            value={`${stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(2)} STT`}
            color={stats.pnl >= 0 ? 'text-success' : 'text-danger'}
          />
          <StatRow label="Followers" value={stats.followers} />
          <StatRow
            label="Pending Fees"
            value={fees > 0 ? `${fees.toFixed(2)} STT` : '0 STT'}
            last
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <motion.button
          className="flex-1 bg-secondary text-white rounded-xl py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer disabled:opacity-50"
          onClick={() => claim()}
          disabled={claimLoading || !isConnected || fees <= 0}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {claimLoading ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} className="text-white" />}
          {claimLoading ? 'Claiming...' : `Claim ${fees > 0 ? fees.toFixed(1) : '0'} STT`}
        </motion.button>
        <button className="border border-border-strong rounded-xl py-2.5 px-4 flex items-center justify-center gap-1.5 text-xs text-text-muted cursor-pointer">
          <LogOut size={14} />
          Exit
        </button>
      </div>
    </div>
  )
}
