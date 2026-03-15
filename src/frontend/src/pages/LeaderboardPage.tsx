import { Star, TrendingUp } from 'lucide-react'
import { cn } from '../lib/cn'
import { Tabs } from '../components/ui/Tabs'
import { LeaderTable } from '../components/leaderboard/LeaderTable'
import { LeaderLegend } from '../components/leaderboard/LeaderLegend'
import { RankingChart } from '../components/leaderboard/RankingChart'
import { FollowModal } from '../components/leaderboard/FollowModal'
import { useUIStore } from '../stores/ui'

const leaderboardTabs = [
  { label: 'Standings', key: 'standings' },
  { label: 'Stats', key: 'stats' },
  { label: 'Activity', key: 'activity' },
  { label: 'Chart', key: 'chart' },
]

const filterPills = ['All', 'Top 10', 'New', 'Rising']

export function LeaderboardPage() {
  const activeTab = useUIStore((s) => s.activeLeaderboardTab)
  const setActiveTab = useUIStore((s) => s.setActiveLeaderboardTab)
  const followModalOpen = useUIStore((s) => s.followModalOpen)

  return (
    <div>
      {/* Header */}
      <div className="px-20 pt-14 pb-10 flex items-end justify-between">
        <div>
          <span className="text-[13px] text-text-faint uppercase tracking-[0.1em] block mb-1">
            RANKINGS
          </span>
          <h1 className="text-[44px] font-bold tracking-tight leading-none">
            Leaderboard
          </h1>
        </div>
        <button className="bg-primary rounded-full px-7 py-3.5 flex items-center gap-2 font-semibold text-sm cursor-pointer">
          <Star size={16} />
          Become a Leader
        </button>
      </div>

      {/* Tabs */}
      <div className="px-20">
        <Tabs
          items={leaderboardTabs}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Filter pills */}
      <div className="px-20 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs cursor-pointer transition-colors',
                pill === 'All'
                  ? 'bg-secondary text-white'
                  : 'border border-border-strong text-text-muted'
              )}
            >
              {pill}
            </button>
          ))}
        </div>
        <button className="bg-primary rounded-lg px-3.5 py-2 flex items-center gap-1.5 text-sm cursor-pointer">
          <TrendingUp size={14} />
          Chart
        </button>
      </div>

      {/* Leader table */}
      <div className="px-20">
        <LeaderTable />
      </div>

      {/* Legend */}
      <div className="px-20">
        <LeaderLegend />
      </div>

      {/* Ranking chart */}
      <div className="px-20 py-6">
        <RankingChart />
      </div>

      {/* Follow modal */}
      {followModalOpen && <FollowModal />}
    </div>
  )
}
