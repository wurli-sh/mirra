import { cn } from '../../lib/cn'

interface FormDotsProps {
  results: boolean[]
  className?: string
}

export function FormDots({ results, className }: FormDotsProps) {
  return (
    <div className={cn('flex items-center gap-[3px]', className)}>
      {results.map((win, i) => (
        <div
          key={i}
          className={cn('w-2 h-2 rounded-full', win ? 'bg-success' : 'bg-danger')}
        />
      ))}
    </div>
  )
}
