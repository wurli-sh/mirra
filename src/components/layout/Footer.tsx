import { motion } from 'framer-motion'
import { Dithering } from '@paper-design/shaders-react'
import { scrollViewport } from '@/lib/animations'

export function Footer() {
  return (
    <footer className="relative mt-20 -mx-6 flex min-h-[60vh] flex-col items-start justify-start overflow-hidden bg-secondary">
      {/* Dithering shader background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Dithering
          style={{ width: '100%', height: '100%' }}
          colorBack="#1A1A1A"
          colorFront="#F5B8D9"
          shape="simplex"
          type="4x4"
          pxSize={2}
          scale={0.5}
          speed={0.05}
        />
      </div>

      {/* Description text */}
      <motion.div
        className="relative z-10 w-full pt-20 px-6"
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

      {/* Giant brand text — pinned to bottom */}
      <motion.p
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 select-none text-center font-black text-white/10 leading-[0.8]"
        style={{ fontSize: '18vw' }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={scrollViewport}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      >
        MIRRA
      </motion.p>
    </footer>
  )
}
