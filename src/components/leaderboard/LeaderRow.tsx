import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatPnl, formatCurrency } from '@/lib/format'
import { useUIStore } from '@/stores/ui'
import { useWallet } from '@/hooks/useWallet'
import type { Leader } from '@/data/types'

interface LeaderRowProps {
  leader: Leader
}

export function LeaderRow({ leader }: LeaderRowProps) {
  const openFollowModal = useUIStore((s) => s.openFollowModal)
  const { address } = useWallet()

  const rankBorderClass =
    leader.rank === 1
      ? 'border-l-3 border-l-rank-gold'
      : leader.rank === 2
        ? 'border-l-3 border-l-rank-silver'
        : leader.rank === 3
          ? 'border-l-3 border-l-rank-bronze'
          : 'border-l-3 border-l-transparent'

  const rankTextClass =
    leader.rank === 1
      ? 'text-rank-gold'
      : leader.rank === 2
        ? 'text-rank-silver'
        : leader.rank === 3
          ? 'text-rank-bronze'
          : 'text-text-muted'

  const pnlPositive = leader.pnl >= 0
  const isSelf = address?.toLowerCase() === leader.fullAddress.toLowerCase()

  const handleFollow = () => {
    openFollowModal(leader.fullAddress, leader.address)
  }

  return (
    <div
      className={cn(
        'flex items-center px-4 py-3 border-b border-border/60 hover:bg-surface/50 transition-colors',
        rankBorderClass
      )}
    >
      {/* Rank */}
      <span className={cn('font-bold text-sm w-[33px] shrink-0', rankTextClass)}>
        {leader.rank}
      </span>

      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-lg shrink-0 mr-3',
          leader.rank === 1 ? 'bg-primary' : 'bg-surface-hover'
        )}
      />

      {/* Address */}
      <span className="font-semibold text-sm flex-1 min-w-0 truncate">
        {leader.address}
        {isSelf && <span className="ml-1.5 text-xs text-text-faint">(you)</span>}
      </span>

      {/* Score */}
      <span className="font-bold text-sm w-[70px] text-center shrink-0">
        {leader.score}
      </span>

      {/* Win Rate */}
      <span className="text-xs w-[70px] text-center shrink-0">
        {leader.winRate}%
      </span>

      {/* P&L */}
      <span
        className={cn(
          'font-semibold text-xs w-[90px] text-right shrink-0',
          pnlPositive ? 'text-success' : 'text-danger'
        )}
      >
        {formatPnl(leader.pnl)}
      </span>

      {/* Volume */}
      <span className="text-xs text-text-muted w-[90px] text-right shrink-0">
        {formatCurrency(leader.volume)}
      </span>

      {/* Followers */}
      <span className="font-medium text-xs w-[70px] text-center shrink-0">
        {leader.followers}
      </span>

      {/* Follow button */}
      <div className="w-[80px] flex justify-center shrink-0">
        {isSelf ? (
          <span className="text-xs text-text-faint">—</span>
        ) : (
          <motion.button
            className="flex items-center gap-1 bg-primary text-secondary px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
            onClick={handleFollow}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus size={11} />
            Follow
          </motion.button>
        )}
      </div>
    </div>
  )
}
