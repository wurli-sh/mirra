import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, scrollViewport } from '@/lib/animations'

export function CallToAction() {
  return (
    <section className="py-24">
      <motion.div
        className="mx-auto max-w-4xl text-center"
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewport}
        variants={staggerContainer}
      >
        <motion.h2
          className="text-balance text-4xl font-bold tracking-tight text-secondary md:text-5xl"
          variants={fadeInUp}
        >
          Start Mirroring the{' '}
          <span className="text-secondary">Best Traders</span>
        </motion.h2>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-pretty text-lg text-text-muted"
          variants={fadeInUp}
        >
          Follow top leaders, mirror their trades automatically, and let on-chain reactivity do the rest. Powered by Somnia.
        </motion.p>

        <motion.div className="mt-10" variants={fadeInUp}>
          <Link to="/trade">
            <motion.button
              className="inline-flex items-center gap-2 rounded-lg bg-secondary px-8 py-3.5 text-base font-base text-white cursor-pointer hover:bg-secondary/90 transition-colors"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              Follow a Leader
              <ArrowRight size={16} />
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
