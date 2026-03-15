import { Activity } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Badge } from '../ui/Badge'
import { feedItems } from '../../data/mock'

export function TradeFeed() {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center px-4 gap-2">
        <Activity size={14} className="text-secondary" />
        <span className="font-semibold text-[13px] text-secondary">Recent Activity</span>
        <div className="flex-1" />
        <div className="w-1.5 h-1.5 bg-success rounded-full" />
        <span className="text-[11px] text-text-faint">Live</span>
      </div>

      {/* Feed items */}
      {feedItems.map((item, i) => (
        <div key={i} className="flex items-center px-4 py-2.5 border-t border-border/60 gap-2.5">
          {/* Timestamp */}
          <span className="text-[10px] text-text-faint w-9 shrink-0">{item.time}</span>

          {/* Status dot */}
          <div
            className={cn(
              'w-[5px] h-[5px] rounded-full shrink-0',
              item.type === 'success' && 'bg-success',
              item.type === 'fail' && 'bg-danger',
              item.type === 'stop' && 'bg-warning'
            )}
          />

          {/* Description */}
          <span
            className={cn(
              'text-xs flex-1',
              item.type === 'success' && 'text-secondary',
              item.type === 'fail' && 'text-danger',
              item.type === 'stop' && 'text-warning'
            )}
          >
            {item.type === 'success' && `Mirrored ${item.leader} → ${item.from} → ${item.to}`}
            {item.type === 'fail' && `Failed: ${item.leader} — ${item.reason}`}
            {item.type === 'stop' && `Stop-loss: ${item.leader} closed · ${item.loss} returned`}
          </span>

          {/* Result / Badge */}
          {item.type === 'success' && (
            <span className="text-[11px] font-semibold text-success">{item.result}</span>
          )}
          {item.type === 'fail' && <Badge variant="danger">FAIL</Badge>}
          {item.type === 'stop' && <Badge variant="warning">STOP</Badge>}
        </div>
      ))}
    </div>
  )
}
