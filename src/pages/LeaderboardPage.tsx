import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Loader2, ArrowRight, Users, TrendingUp, BarChart3, Trophy, Percent, Activity } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Tabs } from '@/components/ui/Tabs'
import { LeaderTable } from '@/components/leaderboard/LeaderTable'
import { FollowModal } from '@/components/leaderboard/FollowModal'
import { useUIStore } from '@/stores/ui'
import { useRegisterLeader, useDeregisterLeader, useIsLeader } from '@/hooks/useRegisterLeader'
import { useWallet } from '@/hooks/useWallet'
import { useLeaders } from '@/hooks/useLeaders'
import { useProtocolStats } from '@/hooks/useProtocolStats'
import { useLiveTradeFeed } from '@/hooks/useLiveEvents'
import { usePageReady } from '@/hooks/usePageReady'
import { formatPnl } from '@/lib/format'

const leaderboardTabs = [
  { label: 'Standings', key: 'standings' },
  { label: 'Stats', key: 'stats' },
  { label: 'Activity', key: 'activity' },
]

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-alt', className)} />
}

function PageSkeleton() {
  return (
    <div className="pt-16 pb-12">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      {/* Counter skeletons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl px-4 py-3.5 flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Tab skeleton */}
      <div className="flex gap-1 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 bg-surface-alt/60 flex gap-4">
          {['w-10', 'w-40', 'w-20', 'w-20', 'w-20'].map((w, i) => (
            <Skeleton key={i} className={cn('h-3', w)} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-t border-border/40">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-2.5 w-44" />
            </div>
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LeaderboardPage() {
  const ready = usePageReady()
  const activeTab = useUIStore((s) => s.activeLeaderboardTab)
  const setActiveTab = useUIStore((s) => s.setActiveLeaderboardTab)
  const followModalOpen = useUIStore((s) => s.followModalOpen)
  const { isConnected, isConnecting } = useWallet()
  const { isLeader, isLoading: leaderLoading, refetch: refetchLeader } = useIsLeader()
  const { register, isPending, isConfirming, isSuccess: registerSuccess } = useRegisterLeader()
  const { deregister, isPending: deregPending, isConfirming: deregConfirming, isSuccess: deregSuccess } = useDeregisterLeader()
  const { leaders, isLoading: leadersLoading } = useLeaders()
  const { stats, isLoading: statsLoading } = useProtocolStats()
  const { items: feedItems } = useLiveTradeFeed()

  const registerLoading = isPending || isConfirming
  const deregLoading = deregPending || deregConfirming

  // Refetch leader status after register/deregister confirms
  useEffect(() => {
    if (registerSuccess || deregSuccess) refetchLeader()
  }, [registerSuccess, deregSuccess, refetchLeader])
  const loading = !ready || statsLoading

  const topLeader = leaders[0]
  const avgWinRate = leaders.length > 0
    ? (leaders.reduce((s, l) => s + l.winRate, 0) / leaders.length).toFixed(1)
    : '0'
  const totalPnl = leaders.reduce((s, l) => s + l.pnl, 0)

  const handleBecomeLeader = () => {
    if (!isConnected || isLeader) return
    register('10')
  }

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
        className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-none">Leaderboard</h1>
          <p className="text-sm text-text-muted mt-1.5 max-w-sm">
            Follow the best leaders to mirror their trades automatically.
          </p>
        </div>
        {isConnecting || (isConnected && leaderLoading) ? (
          <Skeleton className="w-44 h-10 rounded-full" />
        ) : !isConnected ? (
          <motion.button
            className="rounded-full px-5 py-2.5 flex items-center gap-2 font-semibold text-sm cursor-pointer disabled:opacity-50 shrink-0 bg-secondary text-white"
            disabled
          >
            <Star size={14} />
            Connect to Start
          </motion.button>
        ) : isLeader ? (
          <motion.button
            className="rounded-full px-5 py-2.5 flex items-center gap-2 font-semibold text-sm cursor-pointer disabled:opacity-50 shrink-0 border border-danger/20 text-danger hover:bg-danger/10 transition-colors"
            onClick={() => deregister()}
            disabled={deregLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {deregLoading ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
            {deregLoading ? 'Deregistering...' : 'Deregister Leader'}
          </motion.button>
        ) : (
          <motion.button
            className="rounded-full px-5 py-2.5 flex items-center gap-2 font-semibold text-sm cursor-pointer disabled:opacity-50 shrink-0 bg-secondary text-white"
            onClick={handleBecomeLeader}
            disabled={registerLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            {registerLoading ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
            {registerLoading ? 'Registering...' : 'Become a Leader'}
          </motion.button>
        )}
      </motion.div>

      {/* Protocol counters */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl px-4 py-3.5 flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          ))
        ) : (
          [
            { icon: Users, value: stats.leaders, label: 'Active Leaders' },
            { icon: TrendingUp, value: stats.followers.toLocaleString(), label: 'Followers' },
            { icon: BarChart3, value: stats.volume, label: 'Mirrored Volume' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-surface rounded-xl px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <Icon size={16} className="text-secondary" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight">{value}</span>
                <span className="block text-[10px] text-text-faint uppercase tracking-wider">{label}</span>
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Tabs items={leaderboardTabs} active={activeTab} onChange={setActiveTab} />
      </motion.div>

      {/* === Standings === */}
      {activeTab === 'standings' && (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <LeaderTable />
        </motion.div>
      )}

      {/* === Stats === */}
      {activeTab === 'stats' && (
        <motion.div
          className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Top performer */}
          <div className="md:col-span-2 border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={14} className="text-rank-gold" />
              <h3 className="font-bold text-sm">Top Performer</h3>
            </div>
            {leadersLoading ? (
              <div className="flex items-center gap-5">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-14" />)}
                  </div>
                </div>
              </div>
            ) : topLeader ? (
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-rank-gold/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-rank-gold">1</span>
                </div>
                <div className="flex-1">
                  <span className="text-base font-bold">{topLeader.address}</span>
                  <div className="flex flex-wrap items-center gap-4 sm:gap-5 mt-1.5">
                    {[
                      { v: topLeader.score, l: 'Score' },
                      { v: `${topLeader.winRate}%`, l: 'Win Rate' },
                      { v: formatPnl(topLeader.pnl), l: 'P&L', c: topLeader.pnl >= 0 ? 'text-success' : 'text-danger' },
                      { v: topLeader.followers, l: 'Followers' },
                    ].map(({ v, l, c }) => (
                      <div key={l}>
                        <span className={cn('text-xl font-bold', c)}>{v}</span>
                        <span className="block text-[10px] text-text-faint uppercase tracking-wider">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted py-3">No leaders yet.</p>
            )}
          </div>

          {/* Aggregate cards */}
          <div className="flex flex-col gap-3">
            <div className="border border-border rounded-2xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Percent size={12} className="text-text-faint" />
                <span className="text-[10px] text-text-faint uppercase tracking-wider font-medium">Avg Win Rate</span>
              </div>
              {leadersLoading ? <Skeleton className="h-8 w-20" /> : <span className="text-2xl font-bold">{avgWinRate}%</span>}
            </div>
            <div className="border border-border rounded-2xl p-4 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={12} className="text-text-faint" />
                <span className="text-[10px] text-text-faint uppercase tracking-wider font-medium">Total P&L</span>
              </div>
              {leadersLoading ? <Skeleton className="h-8 w-24" /> : (
                <span className={cn('text-2xl font-bold', totalPnl >= 0 ? 'text-success' : 'text-danger')}>
                  {formatPnl(totalPnl)}
                </span>
              )}
            </div>
          </div>

          {/* Score distribution */}
          <div className="md:col-span-3 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-surface-alt/60">
              <h3 className="font-bold text-sm">Score Distribution</h3>
            </div>
            {leadersLoading ? (
              <div className="px-5 py-4 flex flex-col gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-5 h-4" />
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="flex-1 h-6 rounded-lg" />
                    <Skeleton className="w-28 h-4" />
                  </div>
                ))}
              </div>
            ) : leaders.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm text-text-muted">No leaders registered yet.</p>
              </div>
            ) : (
              <div className="px-5 py-4 flex flex-col gap-2.5">
                {leaders.map((leader) => {
                  const maxScore = leaders[0]?.score || 1
                  const barWidth = maxScore > 0 ? (leader.score / maxScore) * 100 : 0
                  return (
                    <div key={leader.fullAddress} className="flex items-center gap-3">
                      <span className={cn(
                        'font-bold text-xs w-5 shrink-0 tabular-nums',
                        leader.rank === 1 ? 'text-rank-gold' : leader.rank === 2 ? 'text-rank-silver' : leader.rank === 3 ? 'text-rank-bronze' : 'text-text-faint'
                      )}>
                        {leader.rank}
                      </span>
                      <span className="text-xs font-medium w-24 shrink-0 truncate">{leader.address}</span>
                      <div className="flex-1 h-6 bg-surface-alt rounded-lg overflow-hidden relative">
                        <div
                          className={cn(
                            'h-full rounded-lg',
                            leader.rank === 1 ? 'bg-rank-gold/25' : leader.rank === 2 ? 'bg-rank-silver/25' : leader.rank === 3 ? 'bg-rank-bronze/25' : 'bg-primary/30'
                          )}
                          style={{ width: `${Math.max(barWidth, 5)}%` }}
                        />
                        <span className="absolute inset-y-0 left-2.5 flex items-center text-xs font-bold tabular-nums">
                          {leader.score}
                        </span>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <span className="text-xs text-text-muted w-12 text-right">{leader.winRate}%</span>
                        <span className={cn('text-xs font-bold w-14 text-right tabular-nums', leader.pnl >= 0 ? 'text-success' : 'text-danger')}>
                          {formatPnl(leader.pnl)}
                        </span>
                        <span className="text-xs text-text-faint w-8 text-right">{leader.followers}f</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* === Activity === */}
      {activeTab === 'activity' && (
        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-surface-alt/60">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-text-muted" />
                <h3 className="font-bold text-sm">Live Swap Feed</h3>
              </div>
              <span className="text-xs bg-surface-alt px-2 py-0.5 rounded-full text-text-faint font-medium tabular-nums">
                {feedItems.length} event{feedItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            {feedItems.length === 0 ? (
              <div className="py-16 text-center">
                <Activity size={24} className="text-text-faint mx-auto mb-3" />
                <p className="text-sm font-medium text-text-muted">No swap activity yet</p>
                <p className="text-xs text-text-faint mt-1">Events appear here when leaders swap on SimpleDEX.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {feedItems.map((item, i) => (
                  <div key={`${item.time}-${item.leader}-${i}`} className="flex items-center px-3 sm:px-5 py-3 hover:bg-surface/40 transition-colors gap-2 sm:gap-3">
                    <span className="text-xs text-text-faint w-10 sm:w-12 shrink-0 tabular-nums font-medium">{item.time}</span>
                    <span className={cn(
                      'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0',
                      item.type === 'success' ? 'bg-success/10 text-success' : item.type === 'fail' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                    )}>
                      {item.type === 'success' ? 'SWAP' : item.type === 'fail' ? 'FAIL' : 'STOP'}
                    </span>
                    <span className="text-xs sm:text-sm text-secondary flex-1 flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="font-medium truncate">{item.leader}</span>
                      <ArrowRight size={14} className="text-text-muted shrink-0" />
                      <span className="truncate">{item.from}</span>
                      <ArrowRight size={14} className="text-text-muted shrink-0" />
                      <span className="truncate">{item.to}</span>
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-success tabular-nums shrink-0">{item.result}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Follow modal */}
      <AnimatePresence>
        {followModalOpen && <FollowModal />}
      </AnimatePresence>
    </div>
  )
}
