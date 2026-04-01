import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, scrollViewport } from "@/lib/animations";

export function CallToAction() {
  return (
    <section className="py-24">
      <motion.div
        className="mx-auto max-w-4xl rounded-2xl bg-primary/5 border border-primary/20 px-8 py-16 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewport}
        variants={staggerContainer}
      >
        <motion.h2
          className="text-balance text-4xl font-bold tracking-tight text-secondary md:text-5xl"
          variants={fadeInUp}
        >
          Start Mirroring the Best Traders
        </motion.h2>

        <motion.p
          className="mx-auto mt-5 max-w-xl text-pretty text-lg text-text-muted"
          variants={fadeInUp}
        >
          Follow top leaders, mirror their trades automatically, and let
          on-chain reactivity do the rest. Powered by Somnia.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-center gap-3"
          variants={fadeInUp}
        >
          <Link to="/trade">
            <motion.button
              className="inline-flex items-center gap-2 rounded-xl bg-secondary px-8 py-3.5 text-sm font-semibold text-white cursor-pointer"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              Follow a Leader
              <ArrowRight size={14} />
            </motion.button>
          </Link>
          <Link
            to="/oni"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-secondary transition-colors duration-150"
          >
            or try the AI agent
            <ArrowRight size={12} />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
