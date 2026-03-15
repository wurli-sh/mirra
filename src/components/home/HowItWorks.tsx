const steps = [
  { num: 1, title: 'Leader trades on DEX', desc: 'A registered leader executes a swap on SimpleDEX. This emits an on-chain Swap event.' },
  { num: 2, title: 'Trades mirror instantly', desc: 'MirrorExecutor reacts to the event and automatically mirrors the trade to all followers. No bots needed.' },
  { num: 3, title: 'Stop-loss protects you', desc: 'RiskGuardian monitors every position. If losses exceed your threshold, it auto-closes to protect your funds.' },
]

export function HowItWorks() {
  return (
    <section className="flex flex-col items-center px-20 py-24 gap-14">
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-text-faint uppercase tracking-[0.1em]">How It Works</span>
        <h2 className="text-5xl font-bold text-secondary tracking-tight">Three steps. Fully on-chain.</h2>
      </div>

      <div className="flex items-start gap-8 w-full max-w-[1100px]">
        {steps.map((step) => (
          <div key={step.num} className="flex flex-col gap-5 flex-1 p-9 bg-surface rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl">
              <span className="text-xl font-bold text-secondary">{step.num}</span>
            </div>
            <span className="text-xl font-semibold text-secondary tracking-tight">{step.title}</span>
            <span className="text-sm text-text-muted leading-6">{step.desc}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-5 py-3 bg-primary rounded-full">
        <span className="text-xs font-medium text-secondary">
          Powered by Somnia Reactivity — zero off-chain infrastructure
        </span>
      </div>
    </section>
  )
}
