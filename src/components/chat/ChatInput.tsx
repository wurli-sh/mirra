import { type FormEvent, type KeyboardEvent, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const handleAutoResize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  function doSend() {
    const text = ref.current?.value.trim()
    if (!text || disabled) return
    onSend(text)
    if (ref.current) {
      ref.current.value = ''
      ref.current.style.height = 'auto'
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    doSend()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      doSend()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="flex items-end gap-2 border border-border-strong bg-bg rounded-xl px-3 py-3 transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(255,213,240,0.3)]">
        <textarea
          ref={ref}
          rows={1}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          onInput={handleAutoResize}
          placeholder="Ask Oni anything..."
          className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none p-0 py-1.5 text-sm text-text placeholder:text-text-faint leading-snug"
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          disabled={disabled}
          aria-label="Send message"
          className="size-8 rounded-lg bg-secondary hover:bg-secondary/80 disabled:bg-surface-alt disabled:cursor-not-allowed text-primary flex items-center justify-center transition-colors shrink-0 cursor-pointer mb-0.5"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </motion.button>
      </div>
      <p className="text-center text-xs text-text-faint mt-1.5 mb-0">
        Oni tries her best but double-check the important stuff.
      </p>
    </form>
  )
}
