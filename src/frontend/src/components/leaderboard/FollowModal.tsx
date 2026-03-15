import { useUIStore } from '../../stores/ui'

export function FollowModal() {
  const setFollowModalOpen = useUIStore((s) => s.setFollowModalOpen)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setFollowModalOpen(false)}
      />

      {/* Modal card */}
      <div className="relative w-[480px] bg-white rounded-2xl shadow-xl border border-border p-10">
        {/* Title */}
        <h2 className="font-bold text-2xl">Follow 0x7b2e...4f91</h2>
        <p className="text-sm text-text-muted mt-1 mb-8">
          Configure your mirror position
        </p>

        {/* Deposit Amount */}
        <div className="mb-5">
          <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
            Deposit Amount
          </label>
          <input
            type="text"
            defaultValue="500"
            className="w-full border border-border-strong rounded-xl px-4 py-3.5 text-sm outline-none"
          />
          <span className="text-xs text-text-muted mt-1.5 block">
            Balance: 2,340 USDC
          </span>
        </div>

        {/* Max Per Trade + Slippage */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Max Per Trade
            </label>
            <input
              type="text"
              defaultValue="100"
              className="w-full border border-border-strong rounded-xl px-4 py-3.5 text-sm outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Slippage %
            </label>
            <input
              type="text"
              defaultValue="0.5"
              className="w-full border border-border-strong rounded-xl px-4 py-3.5 text-sm outline-none"
            />
          </div>
        </div>

        {/* Stop-Loss Threshold */}
        <div className="mb-8">
          <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
            Stop-Loss Threshold
          </label>
          <div className="relative">
            <input
              type="text"
              defaultValue="20"
              className="w-full border border-border-strong rounded-xl px-4 py-3.5 text-sm outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
              %
            </span>
          </div>
        </div>

        {/* Confirm button */}
        <button className="bg-secondary text-white rounded-xl w-full py-4 font-semibold cursor-pointer">
          Confirm &amp; Follow
        </button>
      </div>
    </div>
  )
}
