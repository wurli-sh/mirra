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
        transition={{ duration: 4, delay: 0.3 }}
      >
        <Dithering
          style={{ height: '100%', width: '100%' }}
          colorBack="#FFFFFF"
          colorFront="#F5B8D9"
          shape="simplex"
          type="4x4"
          pxSize={2}
          offsetX={0}
          offsetY={0}
          scale={0.5}
          rotation={0}
          speed={1.2}
        />
      </motion.div>

      {/* Content — sits above the canvas */}
      <div className="relative z-10 flex flex-col items-center py-20 gap-12">
        {/* Headline */}
        <div className="flex flex-col items-center gap-5 max-w-[900px]">
          <motion.h1
            className="text-7xl font-bold text-secondary tracking-[-0.04em] leading-[76px] text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            Your trades follow the best. Near-instant. Zero trust.
          </motion.h1>
          <motion.p
            className="text-xl text-text-muted leading-[30px] text-center max-w-[600px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            Reactive copy-trading on Somnia. Leaders trade, followers mirror — fully on-chain, no bots, no infrastructure.
          </motion.p>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Link
              to="/leaderboard"
              className="inline-flex items-center px-8 py-3 bg-secondary text-white font-bold text-base rounded-full"
            >
              Launch App
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
