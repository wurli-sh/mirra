import { motion } from 'framer-motion'
import { Activity, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from '../ui/Badge'
import { useLiveTradeFeed } from '@/hooks/useLiveEvents'
import { pulse } from '@/lib/animations'

export function TradeFeed() {
  const { items, loaded } = useLiveTradeFeed()

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center px-4 gap-2">
        <Activity size={14} className="text-secondary" />
        <span className="font-semibold text-xs text-secondary">Recent Activity</span>
        <div className="flex-1" />
        <motion.div className="w-1.5 h-1.5 bg-success rounded-full" animate={pulse} />
        <span className="text-xs text-text-faint">
          {items.length > 0 ? 'Connected' : 'Listening...'}
        </span>
      </div>

      {/* Feed items */}
      {!loaded ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted ml-2">Loading activity...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-text-muted">No trades yet. Swap events will appear here in real time.</p>
        </div>
      ) : (
        <div>
          {items.map((item, i) => (
            <div
              key={`${item.time}-${item.leader}-${i}`}
              className="flex items-center px-4 py-2.5 border-t border-border/60 gap-2.5"
            >
              <span className="text-xs text-text-faint w-9 shrink-0">{item.time}</span>
              <div
                className={cn(
                  'w-[5px] h-[5px] rounded-full shrink-0',
                  item.type === 'success' && 'bg-success',
                  item.type === 'fail' && 'bg-danger',
                  item.type === 'stop' && 'bg-warning'
                )}
              />
              <span
                className={cn(
                  'text-xs flex-1',
                  item.type === 'success' && 'text-secondary',
                  item.type === 'fail' && 'text-danger',
                  item.type === 'stop' && 'text-warning'
                )}
              >
                {item.type === 'success' && (
                  <span className="flex items-center gap-1">
                    Swapped {item.leader} <ArrowRight size={10} /> {item.from} <ArrowRight size={10} /> {item.to}
                  </span>
                )}
                {item.type === 'fail' && `Failed: ${item.leader} — ${item.reason}`}
                {item.type === 'stop' && `Stop-loss: ${item.leader} closed · ${item.loss} returned`}
              </span>
              {item.type === 'success' && (
                <span className="text-xs font-semibold text-success">{item.result}</span>
              )}
              {item.type === 'fail' && <Badge variant="danger">FAIL</Badge>}
              {item.type === 'stop' && <Badge variant="warning">STOP</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
