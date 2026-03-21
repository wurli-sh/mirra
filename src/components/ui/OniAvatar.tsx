import { cn } from '@/lib/cn'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  bare?: boolean
}

const SIZES = {
  sm: 'size-7',
  md: 'size-10',
  lg: 'size-16',
}

export function OniAvatar({ size = 'sm', className, bare }: Props) {
  if (bare) {
    return <img src="/oni.svg" alt="Oni" className={cn('shrink-0', SIZES[size], className)} />
  }
  return (
    <div className={cn('rounded-lg bg-primary flex items-center justify-center shrink-0', SIZES[size], className)}>
      <img src="/oni.svg" alt="Oni" className="size-[80%]" />
    </div>
  )
}
