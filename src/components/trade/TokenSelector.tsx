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
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-surface-hover rounded-full cursor-pointer"
        onClick={() => tokens.length > 0 && setOpen(!open)}
      >
        <span className="text-xs font-semibold text-secondary">{token}</span>
        {tokens.length > 0 && <ChevronDown size={10} className="text-text-faint" />}
      </button>

      <AnimatePresence>
        {open && tokens.length > 0 && (
          <motion.div
            className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg z-10 py-1 min-w-[100px]"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {tokens
              .filter((t) => t !== token)
              .map((t) => (
                <button
                  key={t}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-secondary hover:bg-surface transition-colors cursor-pointer"
                  onClick={() => { onChange?.(t); setOpen(false) }}
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
