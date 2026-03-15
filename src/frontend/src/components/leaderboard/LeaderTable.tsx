import { leaders } from '../../data/mock'
import { LeaderRow } from './LeaderRow'

export function LeaderTable() {
  return (
    <div>
      {/* Header row */}
      <div className="flex items-center bg-surface-alt px-4 py-2.5">
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[36px] shrink-0">
          #
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium flex-1">
          Leader
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[70px] text-center shrink-0">
          Score
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[70px] text-center shrink-0">
          Win %
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[90px] text-right shrink-0">
          P&L
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[90px] text-right shrink-0">
          Volume
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[70px] text-center shrink-0">
          Fllwrs
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[90px] text-center shrink-0">
          Form
        </span>
        <span className="text-[11px] text-text-faint uppercase tracking-widest font-medium w-[60px] text-center shrink-0">
          Trend
        </span>
      </div>

      {/* Leader rows */}
      {leaders.map((leader) => (
        <LeaderRow key={leader.rank} leader={leader} />
      ))}
    </div>
  )
}
