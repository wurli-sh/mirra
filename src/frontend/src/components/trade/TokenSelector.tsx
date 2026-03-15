import { ChevronDown } from 'lucide-react'

interface TokenSelectorProps {
  token: string
}

export function TokenSelector({ token }: TokenSelectorProps) {
  return (
    <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-hover rounded-full">
      <span className="text-[13px] font-semibold text-secondary">{token}</span>
      <ChevronDown size={10} className="text-text-faint" />
    </div>
  )
}
