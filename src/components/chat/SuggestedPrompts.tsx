import { motion } from 'framer-motion'
import { TrendingUp, Users, ArrowRightLeft, HelpCircle } from 'lucide-react'

const PROMPTS = [
  { icon: Users, label: 'Who\'s on top?', text: 'Who are the top leaders on Mirra right now?' },
  { icon: TrendingUp, label: 'My bags', text: 'Show my current follow positions and PnL' },
  { icon: ArrowRightLeft, label: 'Swap time', text: 'I want to swap 2 STT for USDC' },
  { icon: HelpCircle, label: 'How does this work?', text: 'How does reactive copy-trading work on Mirra?' },
]

export function SuggestedPrompts({ onSelect }: { onSelect: (text: string) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 mt-3 max-w-2xl mx-auto flex-wrap">
      {PROMPTS.map((p, i) => (
        <motion.button
          key={p.text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.06, duration: 0.25 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelect(p.text)}
          className="flex items-center gap-1.5 text-xs font-medium text-text-muted border border-border-strong hover:border-primary hover:text-[#c4389a] hover:bg-primary/10 rounded-lg px-3.5 py-2 transition-all duration-150 cursor-pointer"
        >
          <p.icon size={13} />
          {p.label}
        </motion.button>
      ))}
    </div>
  )
}
