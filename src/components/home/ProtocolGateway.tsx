import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { scrollViewport } from "@/lib/animations";
import { AnimatedImage } from "@/components/ui/AnimatedImage";

import globeImg from "@/assets/gateway/globe.webp";
import funnelImg from "@/assets/gateway/funnel.webp";
import cubesImg from "@/assets/gateway/cubes.webp";

export function ProtocolGateway() {
  return (
    <section className="py-[12vh]">
      <div className="mx-auto max-w-4xl">
        {/* Section heading */}
        <motion.h2
          className="text-center text-4xl font-bold tracking-tight text-secondary md:text-5xl text-balance"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={scrollViewport}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          The Protocol Behind the Mirror
        </motion.h2>
        <motion.p
          className="mt-4 text-center text-text-muted"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={scrollViewport}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          Fully reactive. No bots. No infrastructure. Just on-chain events doing
          the work.
        </motion.p>

        {/* Bento grid */}
        <div className="mt-16 grid gap-5 md:grid-cols-2">
          {/* Left — tall card: Reactive Mirroring with globe */}
          <motion.div
            className="group relative row-span-2 overflow-hidden rounded-xl bg-secondary p-8 text-white"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={scrollViewport}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255, 213, 240, 0.4) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10">
              <h3 className="text-xl font-bold">Reactive Copy-Trading</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
                Leaders swap, followers mirror — automatically, in one
                transaction.
              </p>
            </div>
            <div className="relative mt-6 flex items-center justify-center">
              <AnimatedImage
                src={globeImg}
                alt="Global reactive mirroring"
                className="relative z-10 w-full max-w-sm object-contain drop-shadow-2xl group-hover:scale-[1.03] transition-transform duration-200"
                placeholderClass="w-full max-w-sm h-64"
              />
            </div>
          </motion.div>

          {/* Right top — Risk Guardian with funnel */}
          <motion.div
            className="group relative overflow-hidden rounded-xl border border-border bg-primary/5"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={scrollViewport}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(55, 3, 5, 0.5) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-bl from-primary/15 via-transparent to-transparent" />
            <div className="relative flex justify-end">
              <AnimatedImage
                src={funnelImg}
                alt="Risk Guardian"
                className="relative z-10 h-52 object-contain object-top-right drop-shadow-xl group-hover:scale-[1.03] transition-transform duration-200"
                placeholderClass="h-52 w-full"
              />
            </div>
            <div className="relative z-10 px-6 pb-6">
              <h3 className="text-xl font-bold text-secondary">
                Risk Guardian
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Auto stop-loss on every mirror. Positions close when your
                threshold is hit.
              </p>
            </div>
          </motion.div>

          {/* Right bottom — Reputation Engine with cubes */}
          <motion.div
            className="group relative overflow-hidden rounded-xl border border-border bg-primary/5"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={scrollViewport}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(55, 3, 5, 0.5) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-bl from-primary/15 via-transparent to-transparent" />
            <div className="relative flex justify-end">
              <AnimatedImage
                src={cubesImg}
                alt="Reputation scoring"
                className="relative z-10 h-52 object-contain object-top-right drop-shadow-xl group-hover:scale-[1.03] transition-transform duration-200"
                placeholderClass="h-52 w-full"
              />
            </div>
            <div className="relative z-10 px-6 pb-6">
              <h3 className="text-xl font-bold text-secondary">
                Reputation Scoring
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Composite scores from win rate, volume, and recency. Trust the
                numbers.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Bottom banner */}
        <motion.div
          className="mt-8 flex items-center justify-center gap-3 rounded-xl bg-surface border border-border px-6 py-4"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={scrollViewport}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          <Users size={16} className="text-text-faint" />
          <span className="text-sm text-text-muted">
            <span className="font-semibold text-secondary">7 contracts</span> —
            2 reactive, 5 regular — powering the full cascade on Somnia Shannon
            Testnet
          </span>
        </motion.div>
      </div>
    </section>
  );
}
