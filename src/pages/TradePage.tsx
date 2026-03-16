import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wallet, ArrowRight, Shield, TrendingUp, Percent, Users, BarChart3, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PositionCard } from '@/components/trade/PositionCard'
import { SwapPanel } from '@/components/trade/SwapPanel'
import { TradeFeed } from '@/components/trade/TradeFeed'
import { usePositions } from '@/hooks/usePositions'
import { useWallet } from '@/hooks/useWallet'
import { useIsLeader } from '@/hooks/useRegisterLeader'
import { useLeaderStats } from '@/hooks/useLeaderStats'
import { usePendingFees } from '@/hooks/useClaimFees'
import { usePageReady } from '@/hooks/usePageReady'

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-alt', className)} />
}

function PageSkeleton() {
  return (
    <div className="pt-16 pb-12">
      {/* Header skeleton */}
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats bar skeleton */}
      <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl px-4 py-3 flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left — Swap skeleton */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="bg-surface rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
            <div className="flex justify-center">
              <Skeleton className="w-10 h-10 rounded-xl" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>

        {/* Right — Positions skeleton */}
        <div className="flex flex-col flex-1 gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="border border-border rounded-2xl overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 border-b border-border/40 last:border-b-0">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-2.5 w-44" />
                </div>
                <Skeleton className="w-16 h-6" />
              </div>
            ))}
          </div>

          {/* Feed skeleton */}
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-surface-alt/60 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12 rounded-full" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-border/40">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function TradePage() {
  const ready = usePageReady()
  const { positions, isLoading } = usePositions()
  const { isConnected, isConnecting } = useWallet()
  const { isLeader, isLoading: leaderLoading } = useIsLeader()
  const stats = useLeaderStats()
  const { fees } = usePendingFees()

  if (!ready) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <PageSkeleton />
      </motion.div>
    )
  }

  return (
    <div className="pt-16 pb-12">
      {/* Header */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight leading-none">Trade</h1>
          {isConnected && !leaderLoading && (
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full',
              isLeader ? 'bg-primary/10 text-secondary' : 'bg-success/10 text-success'
            )}>
              {isLeader ? 'Leader' : 'Follower'}
            </span>
          )}
        </div>
        <p className="text-sm text-text-muted mt-1.5">
          {isLeader ? 'Swap tokens on SimpleDEX. Your trades are mirrored to followers automatically.' : 'View your mirrored positions and trade on SimpleDEX.'}
        </p>
      </motion.div>

      {/* Your stats bar */}
      {isConnecting ? (
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
              <Skeleton className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-2 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : isConnected && !leaderLoading ? (
        <div className={cn('grid gap-2 sm:gap-3 mb-6', isLeader ? 'grid-cols-3 lg:grid-cols-5' : 'grid-cols-3')}>
          {(isLeader ? [
            { icon: BarChart3, value: stats.isLoading ? null : (stats.score || '—'), label: 'Score' },
            { icon: Percent, value: stats.isLoading ? null : (stats.trades > 0 ? `${stats.winRate}%` : '—'), label: 'Win Rate' },
            { icon: TrendingUp, value: stats.isLoading ? null : (stats.trades > 0 ? `${stats.pnl >= 0 ? '+' : ''}${stats.pnl.toFixed(1)}` : '—'), label: 'P&L (STT)', color: stats.pnl >= 0 ? 'text-success' : 'text-danger' },
            { icon: Users, value: stats.isLoading ? null : stats.followers, label: 'Followers' },
            { icon: Wallet, value: stats.isLoading ? null : (fees > 0 ? `${fees.toFixed(1)}` : '0'), label: 'Pending Fees' },
          ] : [
            { icon: Copy, value: positions.length, label: 'Positions' },
            { icon: TrendingUp, value: positions.length > 0 ? `${positions.reduce((s, p) => s + p.pnl, 0).toFixed(1)}` : '—', label: 'Total P&L', color: positions.reduce((s, p) => s + p.pnl, 0) >= 0 ? 'text-success' : 'text-danger' },
            { icon: Wallet, value: positions.length > 0 ? `${positions.reduce((s, p) => s + p.deposited, 0).toFixed(0)}` : '—', label: 'Deposited (STT)' },
          ]).map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="bg-surface rounded-xl px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-secondary" />
              </div>
              <div className="min-w-0">
                {value === null ? (
                  <Skeleton className="h-4 w-10 mb-1" />
                ) : (
                  <span className={cn('text-base font-bold tracking-tight block truncate', color)}>{value}</span>
                )}
                <span className="text-[10px] text-text-faint uppercase tracking-wider">{label}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left — Swap */}
        <motion.div
          className="w-full lg:w-[360px] shrink-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SwapPanel />
        </motion.div>

        {/* Right — Positions + Feed */}
        <motion.div
          className="flex flex-col flex-1 gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {/* Positions header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-secondary" />
              <span className="font-bold text-sm">Your Positions</span>
            </div>
            <span className="text-xs text-text-faint">
              {isConnected ? `${positions.length} active` : ''}
            </span>
          </div>

          {/* Positions */}
          <div className="border border-border rounded-2xl overflow-hidden">
            {isConnecting ? (
              <div className="divide-y divide-border/40">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                ))}
              </div>
            ) : !isConnected ? (
              <div className="py-14 text-center">
                <Wallet size={24} className="text-text-faint mx-auto mb-3" />
                <p className="text-sm font-medium text-text-muted">Connect your wallet to view positions</p>
              </div>
            ) : isLoading ? (
              <div className="divide-y divide-border/40">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="flex-1 flex flex-col gap-2">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-2.5 w-40" />
                    </div>
                    <Skeleton className="w-16 h-6" />
                  </div>
                ))}
              </div>
            ) : positions.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-medium text-text-muted">No active positions</p>
                <p className="text-xs text-text-faint mt-1 mb-3">Follow a leader to start mirroring their trades.</p>
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-primary px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors"
                >
                  Browse Leaders <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {positions.map((pos) => (
                  <PositionCard key={pos.fullLeaderAddress} position={pos} />
                ))}
              </div>
            )}
          </div>

          {/* Feed */}
          <TradeFeed />
        </motion.div>
      </div>
    </div>
  )
}
