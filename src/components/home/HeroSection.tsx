import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useProtocolStats } from '@/hooks/useProtocolStats'
import { fadeInUp, staggerContainer, scrollViewport } from '@/lib/animations'

export function HeroSection() {
  const { stats } = useProtocolStats()

  return (
    <section className="relative overflow-hidden">
      {/* Content */}
      <motion.div
        className="flex flex-col items-center py-28 gap-12"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Headline */}
        <motion.div className="flex flex-col items-center gap-5 max-w-[900px]" variants={fadeInUp}>
          <h1 className="text-7xl font-bold text-secondary tracking-[-0.04em] leading-[76px] text-center">
            Your trades follow the best. Near-instant. Zero trust.
          </h1>
          <p className="text-xl text-text-muted leading-[30px] text-center max-w-[600px]">
            Reactive copy-trading on Somnia. Leaders trade, followers mirror — fully on-chain, no bots, no infrastructure.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div className="flex items-center gap-4" variants={fadeInUp}>
          <Link
            to="/trade"
            className="flex items-center px-9 py-4 bg-secondary text-white font-semibold text-base rounded-full hover:opacity-90 transition-opacity"
          >
            Become a Leader
          </Link>
          <Link
            to="/leaderboard"
            className="flex items-center px-9 py-4 bg-primary text-secondary font-semibold text-base rounded-full hover:opacity-90 transition-opacity"
          >
            Start Following
          </Link>
        </motion.div>

        {/* Protocol Stats */}
        <motion.div
          className="flex items-center gap-16 px-12 py-8 bg-surface rounded-2xl border border-border"
          variants={fadeInUp}
          viewport={scrollViewport}
        >
          <div className="flex flex-col items-center gap-1">
            <motion.span
              className="text-4xl font-bold text-secondary tracking-tight"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            >
              {stats.leaders}
            </motion.span>
            <span className="text-xs text-text-faint uppercase tracking-widest">Active Leaders</span>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="flex flex-col items-center gap-1">
            <motion.span
              className="text-4xl font-bold text-secondary tracking-tight"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
            >
              {stats.followers.toLocaleString()}
            </motion.span>
            <span className="text-xs text-text-faint uppercase tracking-widest">Active Followers</span>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="flex flex-col items-center gap-1">
            <motion.span
              className="text-4xl font-bold text-secondary tracking-tight"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
            >
              {stats.volume}
            </motion.span>
            <span className="text-xs text-text-faint uppercase tracking-widest">Mirrored Volume</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
