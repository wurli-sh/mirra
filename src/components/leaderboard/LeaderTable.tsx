import { useLeaders } from '@/hooks/useLeaders'
import { LeaderRow } from './LeaderRow'
import { Users } from 'lucide-react'

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-9 h-9 rounded-lg bg-surface-alt animate-pulse" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-28 rounded bg-surface-alt animate-pulse" />
        <div className="h-2.5 w-40 rounded bg-surface-alt/60 animate-pulse" />
      </div>
      <div className="w-16 h-5 rounded bg-surface-alt animate-pulse" />
      <div className="w-20 h-5 rounded bg-surface-alt animate-pulse" />
      <div className="w-20 h-5 rounded bg-surface-alt animate-pulse" />
    </div>
  )
}

export function LeaderTable() {
  const { leaders, isLoading } = useLeaders()

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 bg-surface-alt/60">
        <div className="w-9 shrink-0" />
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium flex-1">Leader</span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-12 sm:w-16 text-center shrink-0">Score</span>
        <span className="hidden sm:block text-xs text-text-faint uppercase tracking-widest font-medium w-20 text-right shrink-0">P&L</span>
        <span className="text-xs text-text-faint w-20 sm:w-24 text-right shrink-0">{isLoading ? '' : `${leaders.length} total`}</span>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="divide-y divide-border/40 px-1 py-1">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && leaders.length === 0 && (
        <div className="py-20 text-center">
          <Users size={32} className="text-text-faint mx-auto mb-4" />
          <p className="text-sm font-medium text-text-muted">No leaders registered yet</p>
          <p className="text-xs text-text-faint mt-1">Be the first — stake 10 STT to start.</p>
        </div>
      )}

      {/* Rows */}
      {!isLoading && leaders.length > 0 && (
        <div className="divide-y divide-border/40 px-1 py-1">
          {leaders.map((leader) => (
            <LeaderRow key={leader.fullAddress} leader={leader} />
          ))}
        </div>
      )}
    </div>
  )
}
