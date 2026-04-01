import { motion } from "framer-motion";
import { Dithering } from "@paper-design/shaders-react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";

const ease = [0.23, 1, 0.32, 1] as const;

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden flex flex-col justify-center -mx-6"
      style={{ minHeight: "70vh" }}
    >
      {/* Dithering canvas — subtle strip at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[45%] z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Dithering
          style={{ height: "100%", width: "100%" }}
          colorBack="#FFFFFF"
          colorFront="#F5B8D9"
          shape="simplex"
          type="4x4"
          scale={0.5}
          speed={0.02}
        />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center py-16 gap-10">
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
        >
          <div className="size-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs font-medium text-text-muted">
            Live on Somnia Shannon Testnet
          </span>
        </motion.div>

        {/* Headline */}
        <div className="flex flex-col items-center gap-5 max-w-[900px] px-4">
          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold text-secondary tracking-[-0.04em] leading-tight text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06, ease }}
          >
            Copy the best.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-[#c4389a] to-secondary">
              Mirror every move.
            </span>
          </motion.h1>
          <motion.p
            className="text-lg sm:text-xl text-text-muted leading-relaxed text-center max-w-[560px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12, ease }}
          >
            Leaders trade on SimpleDEX — followers mirror automatically in the
            same block. No bots, no backend. Just Somnia reactivity.
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          className="flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.18, ease }}
        >
          <Link to="/trade">
            <motion.button
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-secondary px-7 text-sm font-semibold text-white cursor-pointer"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              Launch App
              <ArrowRight size={14} />
            </motion.button>
          </Link>
          <motion.a
            href="https://github.com/wurli-sh/mirra"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-border-strong bg-bg px-6 text-sm font-medium text-secondary cursor-pointer hover:bg-surface transition-colors duration-150"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            View on Github
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={20} className="text-text-faint" />
        </motion.div>
      </motion.div>
    </section>
  );
}
