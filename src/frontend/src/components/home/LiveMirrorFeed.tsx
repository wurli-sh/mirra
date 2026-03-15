import { mirrorFeed } from '../../data/mock'

export function LiveMirrorFeed() {
  return (
    <section className="flex flex-col px-20 py-24 gap-10">
      {/* Header */}
      <div className="flex items-end justify-between w-full">
        <div className="flex flex-col gap-3">
          <span className="text-xs text-text-faint uppercase tracking-[0.1em]">Live Activity</span>
          <h2 className="text-5xl font-bold text-secondary tracking-tight">Mirror feed</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-sm text-text-muted">Updating live</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[180px] shrink-0">Follower</span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[180px] shrink-0">Leader</span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-[160px] shrink-0">Pair</span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium flex-1">Amount</span>
        <span className="text-xs text-text-faint uppercase tracking-widest font-medium w-20 shrink-0 text-right">Time</span>
      </div>

      {/* Rows */}
      {mirrorFeed.map((entry, i) => (
        <div key={i} className="flex items-center px-6 py-4 border-b border-border/60">
          <span className="text-sm text-secondary w-[180px] shrink-0">{entry.follower}</span>
          <span className="text-sm text-secondary w-[180px] shrink-0">{entry.leader}</span>
          <span className="text-sm font-medium text-secondary w-[160px] shrink-0">{entry.pair}</span>
          <span className="text-sm font-medium text-secondary flex-1">{entry.amount}</span>
          <span className="text-xs text-text-faint w-20 shrink-0 text-right">{entry.time}</span>
        </div>
      ))}
    </section>
  )
}
