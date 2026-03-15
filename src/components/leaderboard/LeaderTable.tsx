import { useLeaders } from '@/hooks/useLeaders'
import { LeaderRow } from './LeaderRow'

export function LeaderTable() {
  const { leaders, isLoading } = useLeaders()

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center bg-surface-alt px-4 py-2.5">
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[36px] shrink-0">
          #
        </span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium flex-1">
          Leader
        </span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[70px] text-center shrink-0">
          Score
        </span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[70px] text-center shrink-0">
          Win %
        </span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[90px] text-right shrink-0">
          P&L
        </span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[90px] text-right shrink-0">
          Volume
        </span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[70px] text-center shrink-0">
          Fllwrs
        </span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[80px] text-center shrink-0">
          Action
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-muted ml-3">Loading leaders...</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && leaders.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-text-muted">No leaders registered yet.</p>
          <p className="text-xs text-text-faint mt-1">Be the first to register as a leader and start trading.</p>
        </div>
      )}

      {/* Leader rows */}
      {!isLoading && leaders.length > 0 && (
        <div>
          {leaders.map((leader) => (
            <LeaderRow key={leader.fullAddress} leader={leader} />
          ))}
        </div>
      )}
    </div>
  )
}
