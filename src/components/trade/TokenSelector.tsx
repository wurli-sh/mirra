import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface TokenSelectorProps {
  token: string
  tokens?: string[]
  onChange?: (token: string) => void
}

export function TokenSelector({ token, tokens = [], onChange }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const filteredTokens = tokens.filter((t) => t !== token)
  if (filteredTokens.length === 0) {
    return (
      <div className="flex items-center px-3.5 py-1.5 bg-primary/20 rounded-full">
        <span className="text-xs font-semibold text-white">{token}</span>
      </div>
    )
  }

  return (
    <div className="relative z-50" ref={ref}>
      <button
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/20 hover:bg-primary/30 transition-colors rounded-full cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
      >
        <span className="text-xs font-semibold text-white">{token}</span>
        <ChevronDown size={10} className="text-white/50" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full mt-1 bg-secondary border border-white/10 rounded-b-xl shadow-lg z-50 py-1 min-w-[100px]"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {filteredTokens.map((t) => (
              <button
                key={t}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange?.(t)
                  setOpen(false)
                }}
              >
                {t}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
