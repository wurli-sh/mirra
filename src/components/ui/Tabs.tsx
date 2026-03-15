import { cn } from '@/lib/cn'

interface TabItem {
  label: string
  key: string
}

interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
  className?: string
  trailing?: React.ReactNode
}

export function Tabs({ items, active, onChange, className, trailing }: TabsProps) {
  return (
    <div className={cn('flex items-center border-b border-border', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            'px-5 py-3.5 text-sm cursor-pointer transition-colors',
            active === item.key
              ? 'font-semibold text-secondary border-b-2 border-secondary'
              : 'text-text-faint hover:text-text-muted'
          )}
        >
          {item.label}
        </button>
      ))}
      {trailing && <div className="ml-auto">{trailing}</div>}
    </div>
  )
}
