import { motion } from 'framer-motion'
import { Dithering } from '@paper-design/shaders-react'
import { scrollViewport } from '@/lib/animations'

export function Footer() {
  return (
    <footer className="relative mt-24 -mx-6 flex min-h-[60vh] flex-col items-center justify-center overflow-hidden bg-secondary">
      {/* Dithering shader background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Dithering
          style={{ width: '100%', height: '100%' }}
          colorFront="#F5B8D9"
          shape="simplex"
          type="4x4"
          scale={0.5}
          speed={0.02}
        />
      </div>

      {/* Description text */}
      <motion.div
        className="relative z-10 w-full px-6"
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={scrollViewport}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <p className="mx-auto max-w-2xl text-center text-lg leading-relaxed text-white text-pretty">
          Leaders trade. Followers mirror. No bots, no backend, no trust assumptions.
          Fully on-chain copy-trading through reactive contracts. Powered by{' '}
          <span className="rounded bg-primary px-2 py-0.5 font-semibold text-secondary">
            Somnia.
          </span>
        </p>
      </motion.div>
    </footer>
  )
}
