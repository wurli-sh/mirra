import { useState } from "react";
import {
  CircleCheckBig,
  Zap,
  Copy,
  ShieldCheck,
  ArrowLeftRight,
  Coins,
  Users,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import { fadeInUp, staggerContainer, scrollViewport } from "@/lib/animations";

const steps = [
  {
    id: 1,
    label: "Leader Swap",
    sub: "Trigger",
    icon: Zap,
    description:
      "Leader swaps on SimpleDEX — emits an on-chain event that triggers the cascade.",
    highlights: [
      {
        label: "Pairs",
        value: "STT",
        value2: "USDC / WETH",
        icon: ArrowLeftRight,
      },
      { label: "Min Stake", value: "10 STT", icon: Coins },
    ],
    details: [
      "Swap event emitted with token and amount data",
      "Leader must be registered with stake",
    ],
  },
  {
    id: 2,
    label: "Mirror Execution",
    sub: "React",
    icon: Copy,
    description:
      "MirrorExecutor catches the event and mirrors trades to followers — no bots needed.",
    highlights: [
      { label: "Per Transaction", value: "Up to 5", icon: Users },
      { label: "Latency", value: "Same block", icon: Clock },
    ],
    details: [
      "Pulls tokens from FollowerVault automatically",
      "Updates positions and reputation inline",
    ],
  },
  {
    id: 3,
    label: "Risk Protection",
    sub: "Guard",
    icon: ShieldCheck,
    description:
      "RiskGuardian monitors every position — auto-closes if losses breach your threshold.",
    highlights: [
      { label: "Trigger", value: "Stop-loss hit", icon: Target },
      { label: "Action", value: "Emergency close", icon: AlertTriangle },
    ],
    details: [
      "Reacts to every mirrored trade event",
      "Force-closes to protect follower capital",
    ],
  },
];

export function HowItWorks() {
  const [selectedStep, setSelectedStep] = useState(1);
  const step = steps.find((s) => s.id === selectedStep)!;
  const Icon = step.icon;

  return (
    <section className="py-24">
      <motion.div
        className="mx-auto max-w-4xl"
        initial="hidden"
        whileInView="visible"
        viewport={scrollViewport}
        variants={staggerContainer}
      >
        <motion.h2
          variants={fadeInUp}
          className="text-balance text-center text-4xl font-bold tracking-tight text-secondary md:text-5xl"
        >
          Three steps. Fully on-chain.
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mt-4 text-center text-text-muted"
        >
          Reactive contracts cascade automatically — zero bots, zero
          infrastructure.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="mt-16 flex flex-col md:grid md:grid-cols-[200px_1fr] overflow-hidden rounded-xl border border-border"
        >
          {/* Step list — horizontal on mobile, vertical sidebar on desktop */}
          <div className="flex md:flex-col md:border-r border-b md:border-b-0 border-border bg-primary/5 overflow-x-auto">
            {steps.map((s) => {
              const StepIcon = s.icon;
              return (
                <motion.button
                  key={s.id}
                  onClick={() => setSelectedStep(s.id)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    "flex flex-1 md:flex-none cursor-pointer items-center justify-center md:justify-between px-4 md:px-5 py-3 md:py-4 text-left transition-colors duration-150",
                    selectedStep === s.id
                      ? "border-b-2 md:border-b-0 md:border-l-2 border-primary bg-primary/15"
                      : "border-b-2 md:border-b-0 md:border-l-2 border-transparent hover:bg-primary/10",
                  )}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center size-7 rounded-md transition-colors duration-150",
                        selectedStep === s.id ? "bg-primary" : "bg-primary/20",
                      )}
                    >
                      <StepIcon
                        size={13}
                        className={cn(
                          selectedStep === s.id
                            ? "text-secondary"
                            : "text-text-muted",
                        )}
                      />
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          selectedStep === s.id
                            ? "text-secondary"
                            : "text-text-muted",
                        )}
                      >
                        {s.label}
                      </p>
                      <p className="text-xs text-text-faint">{s.sub}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Step detail */}
          <div className="min-h-[320px] overflow-y-auto p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-secondary">
                      {step.label}
                    </h3>
                    <p className="mt-1.5 max-w-md text-sm leading-relaxed text-text-muted">
                      {step.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5">
                    <Icon size={14} className="text-secondary" />
                    <p className="text-sm font-bold text-secondary">
                      Step {step.id}
                    </p>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {step.highlights.map((h) => {
                    const HIcon = h.icon;
                    return (
                      <div
                        key={h.label}
                        className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-4"
                      >
                        <div className="flex items-center justify-center size-10 rounded-md bg-primary/20">
                          <HIcon size={18} className="text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-text-faint">
                            {h.label}
                          </p>
                          <p className="text-lg font-bold text-secondary flex items-center gap-1.5">
                            {h.value}
                            {"value2" in h && (
                              <>
                                <ArrowLeftRight
                                  size={14}
                                  className="text-secondary"
                                />
                                {(h as any).value2}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Details checklist */}
                <ul className="mt-6 flex flex-col gap-2">
                  {step.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-center gap-2.5 text-sm text-text-muted"
                    >
                      <CircleCheckBig
                        size={14}
                        className="shrink-0 text-primary"
                      />
                      {detail}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
