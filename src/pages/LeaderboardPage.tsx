import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, TrendingUp, Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Tabs } from '@/components/ui/Tabs'
import { LeaderTable } from '@/components/leaderboard/LeaderTable'
import { LeaderLegend } from '@/components/leaderboard/LeaderLegend'
import { RankingChart } from '@/components/leaderboard/RankingChart'
import { FollowModal } from '@/components/leaderboard/FollowModal'
import { StatRow } from '@/components/ui/StatRow'
import { useUIStore } from '@/stores/ui'
import { useRegisterLeader, useIsLeader } from '@/hooks/useRegisterLeader'
import { useWallet } from '@/hooks/useWallet'
import { useLeaders } from '@/hooks/useLeaders'
import { useProtocolStats } from '@/hooks/useProtocolStats'
import { useLiveTradeFeed } from '@/hooks/useLiveEvents'
import { formatPnl, formatCurrency } from '@/lib/format'

const leaderboardTabs = [
  { label: 'Standings', key: 'standings' },
  { label: 'Stats', key: 'stats' },
  { label: 'Activity', key: 'activity' },
  { label: 'Chart', key: 'chart' },
]

export function LeaderboardPage() {
  const activeTab = useUIStore((s) => s.activeLeaderboardTab)
  const setActiveTab = useUIStore((s) => s.setActiveLeaderboardTab)
  const followModalOpen = useUIStore((s) => s.followModalOpen)
  const { isConnected } = useWallet()
  const { isLeader } = useIsLeader()
  const { register, isPending, isConfirming } = useRegisterLeader()
  const { leaders } = useLeaders()
  const { stats } = useProtocolStats()
  const { items: feedItems } = useLiveTradeFeed()

  const registerLoading = isPending || isConfirming

  const handleBecomeLeader = () => {
    if (!isConnected || isLeader) return
    register('10') // 10 STT min stake
  }

  return (
    <div>
      {/* Header */}
      <div className="pt-24 pb-10 flex items-end justify-between">
        <div>
          <span className="text-xs text-text-faint uppercase tracking-[0.1em] block mb-1">
            RANKINGS
          </span>
          <h1 className="text-5xl font-bold tracking-tight leading-none">
            Leaderboard
          </h1>
        </div>
        <motion.button
          className={cn(
            'rounded-full px-7 py-3.5 flex items-center gap-2 font-semibold text-sm cursor-pointer disabled:opacity-50',
            isLeader ? 'bg-success/10 text-success' : 'bg-primary'
          )}
          onClick={handleBecomeLeader}
          disabled={registerLoading || isLeader || !isConnected}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {registerLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Star size={16} />
          )}
          {isLeader ? 'You are a Leader' : registerLoading ? 'Registering...' : 'Become a Leader'}
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="">
        <Tabs
          items={leaderboardTabs}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* === Standings Tab === */}
      {activeTab === 'standings' && (
        <>
          <div className="pt-4">
            <LeaderTable />
          </div>
          <div className="">
            <LeaderLegend />
          </div>
        </>
      )}

      {/* === Stats Tab === */}
      {activeTab === 'stats' && (
        <div className="py-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Protocol stats */}
            <div className="border border-border rounded-2xl p-6">
              <h3 className="font-bold text-sm text-secondary mb-4">Protocol Overview</h3>
              <StatRow label="Active Leaders" value={stats.leaders} />
              <StatRow label="Active Followers" value={stats.followers} />
              <StatRow label="Total Volume" value={stats.volume} last />
            </div>

            {/* Top leaders */}
            <div className="border border-border rounded-2xl p-6 col-span-2">
              <h3 className="font-bold text-sm text-secondary mb-4">Top Leaders</h3>
              {leaders.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">No leaders registered yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {leaders.slice(0, 5).map((leader) => (
                    <div key={leader.fullAddress} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'font-bold text-sm w-6',
                          leader.rank === 1 ? 'text-rank-gold' : leader.rank === 2 ? 'text-rank-silver' : leader.rank === 3 ? 'text-rank-bronze' : 'text-text-muted'
                        )}>
                          {leader.rank}
                        </span>
                        <span className="text-sm font-medium">{leader.address}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-xs text-text-muted">Score: {leader.score}</span>
                        <span className="text-xs text-text-muted">{leader.winRate}% WR</span>
                        <span className={cn('text-xs font-semibold', leader.pnl >= 0 ? 'text-success' : 'text-danger')}>
                          {formatPnl(leader.pnl)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === Activity Tab === */}
      {activeTab === 'activity' && (
        <div className="py-6">
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-surface-alt">
              <h3 className="font-bold text-sm text-secondary">Recent Swap Activity</h3>
              <span className="text-xs text-text-faint">
                {feedItems.length} event{feedItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            {feedItems.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm text-text-muted">No swap activity yet.</p>
                <p className="text-xs text-text-faint mt-1">Events will appear here when leaders swap on SimpleDEX.</p>
              </div>
            ) : (
              <div>
                {feedItems.map((item, i) => (
                  <div key={`${item.time}-${item.leader}-${i}`} className="flex items-center px-6 py-3.5 border-b border-border/40 last:border-0">
                    <span className="text-xs text-text-faint w-12 shrink-0">{item.time}</span>
                    <div className={cn(
                      'w-[6px] h-[6px] rounded-full shrink-0 mr-3',
                      item.type === 'success' ? 'bg-success' : item.type === 'fail' ? 'bg-danger' : 'bg-warning'
                    )} />
                    <span className="text-sm text-secondary flex-1">
                      <span className="flex items-center gap-1">{item.leader} swapped {item.from} <ArrowRight size={10} /> {item.to}</span>
                    </span>
                    <span className="text-sm font-semibold text-success">{item.result}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Chart Tab === */}
      {activeTab === 'chart' && (
        <div className="py-6">
          <RankingChart />
        </div>
      )}

      {/* Follow modal */}
      <AnimatePresence>
        {followModalOpen && <FollowModal />}
      </AnimatePresence>
    </div>
  )
}
