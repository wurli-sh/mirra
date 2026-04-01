import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, Zap, Shield } from "lucide-react";
import { fadeInUp, staggerContainer, scrollViewport } from "@/lib/animations";
import { OniAvatar } from "@/components/ui/OniAvatar";

const ease = [0.23, 1, 0.32, 1] as const;

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Talk to Trade",
    desc: "Tell Oni what you want — swap tokens, follow leaders, check positions. No forms, just conversation.",
  },
  {
    icon: Zap,
    title: "On-Chain Actions",
    desc: "Oni proposes transactions as action cards. Review, confirm, done. Everything executes via your wallet.",
  },
  {
    icon: Shield,
    title: "Live Data",
    desc: "Real-time leader stats, pool quotes, and portfolio tracking. Oni reads on-chain data before every answer.",
  },
];

const chatMessages = [
  { side: "user" as const, text: "I want to swap 2 STT for USDC" },
  {
    side: "oni" as const,
    text: "You're getting <strong>9.41 USDC</strong> for your 2 STT — solid rate! Want to go for it?",
  },
  { side: "user" as const, text: "yes let's go" },
  {
    side: "oni" as const,
    text: "Swap confirmed! Your bags are getting chunky!",
  },
];

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
        <motion.div
          className="flex flex-col items-center text-center mb-14"
          variants={fadeInUp}
        >
          <OniAvatar size="lg" bare />
          <h2 className="text-4xl font-bold tracking-tight text-secondary mt-5 md:text-5xl">
            Meet Oni
          </h2>
          <p className="text-lg text-text-muted mt-3 max-w-lg">
            Your on-chain AI agent. Oni swaps, follows leaders, and manages your
            portfolio — all through natural conversation.
          </p>
        </motion.div>

        {/* Chat preview + CTA */}
        <motion.div
          className="bg-secondary rounded-2xl p-6 md:p-10 flex flex-col md:flex-row items-center gap-8"
          variants={fadeInUp}
        >
          {/* Animated chat preview */}
          <div className="flex-1 space-y-3 w-full">
            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.3, delay: 0.2 + i * 0.4, ease }}
              >
                <ChatBubble side={msg.side} text={msg.text} />
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="shrink-0 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Try Oni now</h3>
            <p className="text-sm text-white/50 mb-5 max-w-[200px]">
              No complicated UIs. Your AI agent handles it.
            </p>
            <Link to="/oni">
              <motion.button
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-secondary cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Try Oni Agent
                <ArrowRight size={14} />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function ChatBubble({ side, text }: { side: "user" | "oni"; text: string }) {
  if (side === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-white/10 text-white/90 rounded-xl rounded-br-sm px-4 py-2.5 text-sm max-w-[75%]">
          {text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <OniAvatar size="sm" bare className="mt-0.5 opacity-80" />
      <div
        className="bg-primary/20 text-white/90 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[80%]"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
}
