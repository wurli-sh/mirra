import { cn } from '../../lib/cn'

interface StatRowProps {
  label: string
  value: string | number
  color?: string
  last?: boolean
}

export function StatRow({ label, value, color, last }: StatRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-2.5', !last && 'border-b border-border')}>
      <span className="text-xs text-text-muted">{label}</span>
      <span className={cn('text-sm font-bold', color || 'text-secondary')}>{value}</span>
    </div>
  )
}
