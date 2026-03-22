import { motion } from 'framer-motion'
import { Activity, ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLiveTradeFeed } from '@/hooks/useLiveEvents'
import { contracts } from '@/config/contracts'
import { pulse } from '@/lib/animations'

const EXPLORER = 'https://shannon-explorer.somnia.network'

export function TradeFeed() {
  const { items, loaded, isReactive } = useLiveTradeFeed()

  return (
    <div className="border border-border rounded-xl overflow-hidden max-h-[460px] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-5 py-3.5 bg-surface-alt/60 gap-2">
        <Activity size={14} className="text-secondary" />
        <span className="font-semibold text-sm text-secondary">Recent Activity</span>
        <div className="flex-1" />
        {isReactive && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
            Somnia Reactivity
          </span>
        )}
        <motion.div className={cn('w-1.5 h-1.5 rounded-full', isReactive ? 'bg-success' : 'bg-warning')} animate={pulse} />
        <span className="text-xs text-text-faint">
          {isReactive ? 'Live' : items.length > 0 ? 'Cached' : 'Connecting...'}
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
        <div className="divide-y divide-border/40 overflow-y-auto flex-1">
          {items.map((item, i) => (
            <motion.a
              key={`${item.time}-${item.leader}-${i}`}
              href={`${EXPLORER}/address/${contracts.simpleDex}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 sm:px-5 py-3.5 gap-2 sm:gap-4 hover:bg-surface transition-colors duration-150 cursor-pointer group"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              {/* Time */}
              <span className="text-sm text-text-faint w-12 shrink-0 tabular-nums font-medium">{item.time}</span>

              {/* Type badge */}
              <span className={cn(
                'text-xs font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0',
                item.type === 'success' ? 'bg-success/10 text-success' : item.type === 'fail' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
              )}>
                {item.type === 'success' ? 'SWAP' : item.type === 'fail' ? 'FAIL' : 'STOP'}
              </span>

              {/* Details */}
              <span className="text-sm text-secondary flex-1 flex items-center gap-1.5 min-w-0">
                <span className="font-semibold truncate">{item.leader}</span>
                <ArrowRight size={14} className="text-text-muted shrink-0" />
                <span className="truncate">{item.from}</span>
                <ArrowRight size={14} className="text-text-muted shrink-0" />
                <span className="truncate">{item.to}</span>
              </span>

              {/* Result + explorer icon */}
              {item.type === 'success' && (
                <span className="text-sm font-bold text-success tabular-nums shrink-0">{item.result}</span>
              )}
              <ExternalLink size={12} className="text-text-faint group-hover:text-text-muted transition-colors shrink-0" />
            </motion.a>
          ))}
        </div>
      )}
    </div>
  )
}
