import { motion } from 'framer-motion'
import { Activity, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLiveTradeFeed } from '@/hooks/useLiveEvents'
import { pulse } from '@/lib/animations'

export function TradeFeed() {
  const { items, loaded } = useLiveTradeFeed()

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-5 py-3.5 bg-surface-alt/60 gap-2">
        <Activity size={14} className="text-secondary" />
        <span className="font-bold text-xs text-secondary">Recent Activity</span>
        <div className="flex-1" />
        <motion.div className="w-1.5 h-1.5 bg-success rounded-full" animate={pulse} />
        <span className="text-xs text-text-faint">
          {items.length > 0 ? 'Live' : 'Listening...'}
        </span>
      </div>

      {/* Feed items */}
      {!loaded ? (
        <div className="divide-y divide-border/40">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="animate-pulse rounded bg-surface-alt h-3 w-10" />
              <div className="animate-pulse rounded bg-surface-alt h-4 w-12" />
              <div className="animate-pulse rounded bg-surface-alt h-3 flex-1" />
              <div className="animate-pulse rounded bg-surface-alt h-3 w-14" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-xs text-text-muted">No trades yet. Swap events will appear here in real time.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {items.map((item, i) => (
            <motion.div
              key={`${item.time}-${item.leader}-${i}`}
              className="flex items-center px-5 py-3 gap-3 hover:bg-surface transition-colors duration-150"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              {/* Time */}
              <span className="text-xs text-text-faint w-10 shrink-0 tabular-nums">{item.time}</span>

              {/* Type badge */}
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0',
                item.type === 'success' ? 'bg-success/10 text-success' : item.type === 'fail' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
              )}>
                {item.type === 'success' ? 'SWAP' : item.type === 'fail' ? 'FAIL' : 'STOP'}
              </span>

              {/* Details */}
              <span className="text-xs text-secondary flex-1 flex items-center gap-1">
                <span className="font-medium">{item.leader}</span>
                <ArrowRight size={10} className="text-text-faint" />
                <span>{item.from}</span>
                <ArrowRight size={10} className="text-text-faint" />
                <span>{item.to}</span>
              </span>

              {/* Result */}
              {item.type === 'success' && (
                <span className="text-xs font-bold text-success tabular-nums shrink-0">{item.result}</span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
