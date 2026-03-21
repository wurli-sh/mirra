import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Zap, Shield } from 'lucide-react'
import { fadeInUp, staggerContainer, scrollViewport } from '@/lib/animations'
import { OniAvatar } from '@/components/ui/OniAvatar'

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Chat to Trade',
    desc: 'Tell Oni what you want — swap tokens, follow leaders, check positions. No forms, just conversation.',
  },
  {
    icon: Zap,
    title: 'On-Chain Actions',
    desc: 'Oni proposes transactions as action cards. Review, confirm, done. Everything executes via your wallet.',
  },
  {
    icon: Shield,
    title: 'Live Data',
    desc: 'Real-time leader stats, pool quotes, and portfolio tracking. Oni fetches live on-chain data before every answer.',
  },
]

export function OniSection() {
  return (
    <section className="py-24">
      <motion.div
        className="mx-auto max-w-5xl"
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewport}
        variants={staggerContainer}
      >
        {/* Header */}
        <motion.div className="flex flex-col items-center text-center mb-14" variants={fadeInUp}>
          <OniAvatar size="lg" bare />
          <h2 className="text-4xl font-bold tracking-tight text-secondary mt-5 md:text-5xl">
            Meet Oni
          </h2>
          <p className="text-lg text-text-muted mt-3 max-w-lg">
            Your AI trading piggi. Chat with Oni to swap, follow leaders, and manage your portfolio — all through natural conversation.
          </p>
        </motion.div>

        {/* Chat preview + CTA */}
        <motion.div
          className="mt-10 bg-secondary rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
          variants={fadeInUp}
        >
          {/* Fake chat preview */}
          <div className="flex-1 space-y-3 w-full">
            <ChatBubble side="user">I want to swap 10 STT for USDC</ChatBubble>
            <ChatBubble side="oni">
              You're getting <strong>9.41 USDC</strong> for your 10 STT — solid rate! Want to go for it? 🐷
            </ChatBubble>
            <ChatBubble side="user">yes let's go</ChatBubble>
            <ChatBubble side="oni">
              Swap confirmed! Your bags are getting chunky! 🥓
            </ChatBubble>
          </div>

          {/* CTA */}
          <div className="shrink-0 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Try Oni now</h3>
            <p className="text-sm text-white/50 mb-5 max-w-[200px]">
              No complicated UIs. Just tell Oni what you need.
            </p>
            <Link to="/chat/piggi">
              <motion.button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-secondary cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Chat with Oni
                <ArrowRight size={14} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function ChatBubble({ side, children }: { side: 'user' | 'oni'; children: React.ReactNode }) {
  if (side === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-white/10 text-white/90 rounded-xl rounded-br-sm px-4 py-2.5 text-sm max-w-[75%]">
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-start gap-2">
      <OniAvatar size="sm" bare className="mt-0.5 opacity-80" />
      <div className="bg-primary/20 text-white/90 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[80%]">
        {children}
      </div>
    </div>
  )
}
