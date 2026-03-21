import { motion } from 'framer-motion'
import { Dithering } from '@paper-design/shaders-react'
import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-screen flex flex-col justify-center -mx-6">
      {/* Dithering canvas — fades in */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[65%] -mx-6 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      >
        <Dithering
          style={{ height: '100%', width: '100%' }}
          colorBack="#FFFFFF"
          colorFront="#F5B8D9"
          shape="simplex"
          type="4x4"
          scale={0.5}
          speed={0.02}
        />
      </motion.div>

      {/* Content — sits above the canvas */}
      <div className="relative z-10 flex flex-col items-center py-20 gap-12">
        {/* Headline */}
        <div className="flex flex-col items-center gap-5 max-w-[900px]">
          <motion.h1
            className="text-7xl font-bold text-secondary tracking-[-0.04em] leading-[76px] text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            Copy the best. Mirror every move. On-chain.
          </motion.h1>
          <motion.p
            className="text-xl text-text-muted leading-[30px] text-center max-w-[600px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            Leaders trade on SimpleDEX — followers mirror automatically in the same block. No bots, no backend. Just Somnia reactivity.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <Link to="/trade">
            <motion.button
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-secondary px-8 text-base font-base text-white cursor-pointer"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              Launch App
            </motion.button>
          </Link>
          <motion.a
            href="https://github.com/prabinKsh);/mirra"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-bg px-6 text-base font-medium text-secondary cursor-pointer hover:bg-surface transition-colors"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            View on Github
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
