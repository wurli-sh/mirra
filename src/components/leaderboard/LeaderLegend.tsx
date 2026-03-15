export function LeaderLegend() {
  return (
    <div className="bg-surface-alt rounded-b-xl px-4 py-4 flex items-center justify-between">
      {/* Rank legend */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-[3px] bg-rank-gold rounded" />
          <span className="text-xs text-text-muted">Gold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-[3px] bg-rank-silver rounded" />
          <span className="text-xs text-text-muted">Silver</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-[3px] bg-rank-bronze rounded" />
          <span className="text-xs text-text-muted">Bronze</span>
        </div>
      </div>

      {/* Win/Loss legend */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-xs text-text-muted">Win</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-xs text-text-muted">Loss</span>
        </div>
      </div>
    </div>
  )
}
