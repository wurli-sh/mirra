import { motion } from 'framer-motion'
import { UserPlus, Crown, Medal, Award, X, Loader2 } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { cn } from '@/lib/cn'
import { formatPnl, formatCurrency } from '@/lib/format'
import { useUIStore } from '@/stores/ui'
import { useWallet } from '@/hooks/useWallet'
import { useUnfollow } from '@/hooks/useUnfollow'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'
import type { Leader } from '@/data/types'

interface LeaderRowProps {
  leader: Leader
}

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return (
    <div className="w-9 h-9 rounded-xl bg-rank-gold/15 flex items-center justify-center">
      <Crown size={16} className="text-rank-gold" />
    </div>
  )
  if (rank === 2) return (
    <div className="w-9 h-9 rounded-xl bg-rank-silver/15 flex items-center justify-center">
      <Medal size={16} className="text-rank-silver" />
    </div>
  )
  if (rank === 3) return (
    <div className="w-9 h-9 rounded-xl bg-rank-bronze/15 flex items-center justify-center">
      <Award size={16} className="text-rank-bronze" />
    </div>
  )
  return (
    <div className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center">
      <span className="text-sm font-bold text-text-faint">{rank}</span>
    </div>
  )
}

export function LeaderRow({ leader }: LeaderRowProps) {
  const openFollowModal = useUIStore((s) => s.openFollowModal)
  const { address } = useWallet()

  const { data: positionData } = useReadContract({
    address: contracts.followerVault,
    abi: FollowerVaultAbi,
    functionName: 'getPosition',
    args: address ? [address, leader.fullAddress] : undefined,
    query: { enabled: !!address, refetchInterval: 5_000 },
  })
  const isFollowing = !!(positionData as any)?.active

  const { unfollow, isPending: unfollowPending, isConfirming: unfollowConfirming } = useUnfollow()
  const unfollowLoading = unfollowPending || unfollowConfirming

  const pnlPositive = leader.pnl >= 0
  const isSelf = address?.toLowerCase() === leader.fullAddress.toLowerCase()
  const isTop3 = leader.rank <= 3

  const handleFollow = () => {
    openFollowModal(leader.fullAddress, leader.address)
  }

  const handleUnfollow = () => {
    unfollow(leader.fullAddress)
  }

  return (
    <motion.div
      className={cn(
        'group flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 rounded-xl transition-colors duration-200 cursor-default',
        isTop3 ? 'bg-surface hover:bg-surface-alt' : 'hover:bg-surface',
      )}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
    >
      {/* Rank badge */}
      <RankBadge rank={leader.rank} />

      {/* Leader info */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold text-xs sm:text-sm', isTop3 && 'font-bold')}>
            {leader.address}
          </span>
          {isSelf && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">you</span>
          )}
        </div>
        <span className="text-[10px] sm:text-xs text-text-faint mt-0.5">
          {leader.followers}f · {leader.winRate}% WR
        </span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center w-12 sm:w-16 shrink-0">
        <span className={cn('text-base sm:text-lg font-bold tabular-nums', isTop3 ? 'text-secondary' : 'text-text-muted')}>
          {leader.score}
        </span>
        <span className="text-[9px] sm:text-[10px] text-text-faint uppercase tracking-wider">Score</span>
      </div>

      {/* P&L — hide on very small */}
      <div className="hidden sm:flex flex-col items-end w-20 shrink-0">
        <span className={cn('text-sm font-bold tabular-nums', pnlPositive ? 'text-success' : 'text-danger')}>
          {formatPnl(leader.pnl)}
        </span>
        <span className="text-[10px] text-text-faint">{formatCurrency(leader.volume)} vol</span>
      </div>

      {/* Follow / Unfollow button */}
      <div className="w-20 sm:w-24 shrink-0 flex justify-end">
        {isSelf ? (
          <span className="text-xs text-text-faint italic">—</span>
        ) : isFollowing ? (
          <motion.button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 border border-danger/20 text-danger hover:bg-danger/10 transition-colors"
            onClick={handleUnfollow}
            disabled={unfollowLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            {unfollowLoading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
            {unfollowLoading ? 'Leaving...' : 'Unfollow'}
          </motion.button>
        ) : (
          <motion.button
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all',
              'bg-primary text-secondary opacity-0 group-hover:opacity-100 hover:bg-primary/80 transition-opacity duration-200',
            )}
            onClick={handleFollow}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <UserPlus size={12} />
            Follow
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
