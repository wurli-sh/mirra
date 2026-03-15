import { cn } from '../../lib/cn'

interface ProgressBarProps {
  value: number
  max?: number
  color?: 'success' | 'danger'
  className?: string
}

export function ProgressBar({ value, max = 100, color = 'success', className }: ProgressBarProps) {
  const percent = Math.min((value / max) * 100, 100)
  return (
    <div className={cn('flex w-full h-1 rounded-full', color === 'success' ? 'bg-success/10' : 'bg-danger/10', className)}>
      <div
        className={cn('h-1 rounded-full transition-all', color === 'success' ? 'bg-success' : 'bg-danger')}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
