import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useAccount } from 'wagmi'
import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { SquarePen, Coins } from 'lucide-react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { SuggestedPrompts } from './SuggestedPrompts'
import { TextShimmer } from '@/components/ui/TextShimmer'
import { TextLoop } from '@/components/ui/TextLoop'
import { ThinkingSpinner } from '@/components/ui/ThinkingSpinner'
import { OniAvatar } from '@/components/ui/OniAvatar'
import { TopUpModal } from './TopUpModal'
import { useSessionStore } from '@/stores/session'
import { useSessionBalance } from '@/hooks/useSessionBalance'

export function ChatPanel() {
  const { address } = useAccount()
  // Scope storage to wallet address so different wallets don't share chat history
  const SESSION_KEY = address ? `mirra_chat_${address.toLowerCase()}` : 'mirra_chat_messages'
  const isSessionActive = useSessionStore((s) => s.status === 'active')
  const { stt: sessionStt, gas: sessionGas } = useSessionBalance()
  const [topUpOpen, setTopUpOpen] = useState(false)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: {
          userAddress: address,
        },
      }),
    [address]
  )

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
  })

  // Restore messages from sessionStorage
  const restored = useRef(false)
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setMessages(parsed)
      }
    } catch { /* ignore */ }
  }, [setMessages])

  const bottomRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'submitted' || status === 'streaming'

  // Pick a random label once per loading session (stable ref while isLoading stays true)
  const loadingLabelRef = useRef('')
  const wasLoading = useRef(false)

  if (isLoading && !wasLoading.current) {
    // Just started loading — pick a fresh label
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]
    loadingLabelRef.current = pick(['Hmm lemme think...', 'Oink oink...', 'Hold on...', 'Snout deep in thought...'])
  }
  wasLoading.current = isLoading

  const loadingLabel = (() => {
    if (!isLoading) return ''
    const lastMsg = messages[messages.length - 1]
    const hasToolParts = lastMsg?.role === 'assistant' &&
      lastMsg.parts?.some(p => p.type !== 'text')
    const hasTextStarted = lastMsg?.role === 'assistant' &&
      lastMsg.parts?.some(p => p.type === 'text' && p.text.trim().length > 0)

    if (hasTextStarted) return 'Oinking away...'
    if (hasToolParts) return 'Sniffing the chain...'
    return loadingLabelRef.current
  })()

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages))
    }
  }, [messages])

  // Auto-scroll
  useEffect(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [messages, isLoading, status])

  function handleSend(text: string) {
    sendMessage({ text })
  }

  function handleClearChat() {
    setMessages([])
    sessionStorage.removeItem(SESSION_KEY)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 sm:px-6">
      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-8"
          >
            <motion.div
              className="flex justify-center mb-4 cursor-pointer"
              animate={{ rotate: 0 }}
              whileHover="shake"
              variants={{
                shake: {
                  rotate: [0, -12, 12, -8, 8, -4, 4, 0],
                  transition: { duration: 0.5 },
                },
              }}
            >
              <OniAvatar size="lg" bare />
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-bold text-text tracking-normal">
              Hey! What are we{' '}
              <TextLoop interval={2.5} className="text-[#c4389a] bg-primary/50 px-2 py-0.5 rounded-md">
                <span>mirroring</span>
                <span>swapping</span>
                <span>following</span>
                <span>tracking</span>
                <span>vibing</span>
              </TextLoop>
              {' '}today?
            </h2>
            <p className="text-sm text-text-muted mt-1.5">
              Oni — Your AI agent on Mirra 🐷
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="w-full"
          >
            <ChatInput onSend={handleSend} disabled={isLoading} />
            <SuggestedPrompts onSelect={handleSend} />
          </motion.div>
        </div>
      ) : (
        <>
          {/* Header bar */}
          <div className="shrink-0 pt-2.5 pb-1 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleClearChat}
                className="flex items-center gap-1.5 text-text-muted hover:text-[#c4389a] text-xs font-medium px-3 py-1.5 rounded-md border border-border-strong hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <SquarePen size={12} />
                New Session
              </button>

              {isSessionActive && (
                <button
                  type="button"
                  onClick={() => setTopUpOpen(true)}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-border-strong hover:border-primary hover:bg-primary/10 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`size-1.5 rounded-full ${sessionStt > 0 ? 'bg-success' : 'bg-danger'}`} />
                    <span className="font-medium text-text tabular-nums">{sessionStt} STT</span>
                  </div>
                  <div className="w-px h-3 bg-border-strong" />
                  <div className="flex items-center gap-1">
                    <span className="text-text-faint">Gas</span>
                    <span className="font-medium text-text tabular-nums">{sessionGas}</span>
                  </div>
                  <div className="w-px h-3 bg-border-strong" />
                  <span className="text-text-muted group-hover:text-[#c4389a] transition-colors flex items-center gap-1">
                    <Coins size={11} />
                    Top Up
                  </span>
                </button>
              )}
            </div>
          </div>
          <TopUpModal open={topUpOpen} onClose={() => setTopUpOpen(false)} />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-custom">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2 pb-4">
              {messages.map((msg, idx) => {
                const isLastMsg = idx === messages.length - 1
                if (isLastMsg && msg.role === 'assistant' && (isLoading || error)) return null

                return <ChatMessage key={msg.id} message={msg} onQuickAction={handleSend} />
              })}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex items-center gap-3 mb-5"
                >
                  <OniAvatar size="sm" bare />
                  <div className="flex items-center gap-2">
                    <ThinkingSpinner className="size-4 text-[#c4389a]" />
                    <TextShimmer className="text-sm text-text-muted" active={true}>{loadingLabel}</TextShimmer>
                  </div>
                </motion.div>
              )}
              {error && !isLoading && (
                <div className="flex items-start gap-3 mb-4">
                  <OniAvatar size="sm" bare />
                  <div className="bg-danger/5 border border-danger/20 rounded-xl rounded-tl-sm px-4 py-3 text-sm text-danger">
                    {error.message?.includes('rate_limit') || error.message?.includes('Rate limit') || error.message?.includes('429')
                      ? 'Rate limit reached — chill for a sec and try again!'
                      : 'Oof, something broke. Try again in a moment!'}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Gradient fade */}
          <div className="pointer-events-none h-12 bg-gradient-to-t from-bg to-transparent -mt-12 relative z-10" />

          {/* Input */}
          <div className="shrink-0 px-4 pt-1 pb-2">
            <ChatInput onSend={handleSend} disabled={isLoading} />
          </div>
        </>
      )}
    </div>
  )
}
