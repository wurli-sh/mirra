import { cn } from '../../lib/cn'
import { formatPnl, formatCurrency } from '../../lib/format'
import { FormDots } from '../ui/FormDots'
import { Sparkline } from '../ui/Sparkline'
import type { Leader } from '../../data/mock'

interface LeaderRowProps {
  leader: Leader
}

export function LeaderRow({ leader }: LeaderRowProps) {
  const rankBorderClass =
    leader.rank === 1
      ? 'border-l-3 border-l-rank-gold'
      : leader.rank === 2
        ? 'border-l-3 border-l-rank-silver'
        : leader.rank === 3
          ? 'border-l-3 border-l-rank-bronze'
          : 'border-l-3 border-l-transparent'

  const rankTextClass =
    leader.rank === 1
      ? 'text-rank-gold'
      : leader.rank === 2
        ? 'text-rank-silver'
        : leader.rank === 3
          ? 'text-rank-bronze'
          : 'text-text-muted'

  const pnlPositive = leader.pnl >= 0
  const sparklineColor = pnlPositive ? 'var(--color-success)' : 'var(--color-danger)'

  return (
    <div
      className={cn(
        'flex items-center px-4 py-3 border-b border-border/60',
        rankBorderClass
      )}
    >
      {/* Rank */}
      <span className={cn('font-bold text-sm w-[33px] shrink-0', rankTextClass)}>
        {leader.rank}
      </span>

      {/* Avatar */}
      <div
        className={cn(
          'w-7 h-7 rounded-lg shrink-0 mr-3',
          leader.rank === 1 ? 'bg-primary' : 'bg-surface-hover'
        )}
      />

      {/* Address */}
      <span className="font-semibold text-sm flex-1 min-w-0 truncate">
        {leader.address}
      </span>

      {/* Score */}
      <span className="font-bold text-sm w-[70px] text-center shrink-0">
        {leader.score}
      </span>

      {/* Win Rate */}
      <span className="text-[13px] w-[70px] text-center shrink-0">
        {leader.winRate}%
      </span>

      {/* P&L */}
      <span
        className={cn(
          'font-semibold text-[13px] w-[90px] text-right shrink-0',
          pnlPositive ? 'text-success' : 'text-danger'
        )}
      >
        {formatPnl(leader.pnl)}
      </span>

      {/* Volume */}
      <span className="text-[13px] text-text-muted w-[90px] text-right shrink-0">
        {formatCurrency(leader.volume)}
      </span>

      {/* Followers */}
      <span className="font-medium text-[13px] w-[70px] text-center shrink-0">
        {leader.followers}
      </span>

      {/* Form Dots */}
      <div className="w-[90px] flex justify-center shrink-0">
        <FormDots results={leader.form} />
      </div>

      {/* Sparkline */}
      <div className="w-[60px] flex justify-center shrink-0">
        <Sparkline points={leader.trend} color={sparklineColor} />
      </div>
    </div>
  )
}
