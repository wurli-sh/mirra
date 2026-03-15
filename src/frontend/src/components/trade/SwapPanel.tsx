import { Wallet, ArrowDownUp } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { TokenSelector } from './TokenSelector'

export function SwapPanel() {
  return (
    <div className="bg-surface rounded-2xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-secondary" />
          <span className="font-bold text-base text-secondary">Swap</span>
        </div>
        <Badge>Leader</Badge>
      </div>

      {/* Sell section */}
      <div>
        <div className="text-[10px] text-text-faint uppercase tracking-widest mb-2">You sell</div>
        <div className="bg-white rounded-xl p-3.5 flex items-center justify-between">
          <span className="font-semibold text-xl text-secondary">250</span>
          <TokenSelector token="STT" />
        </div>
      </div>

      {/* Swap icon */}
      <div className="flex justify-center">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <ArrowDownUp size={16} className="text-secondary" />
        </div>
      </div>

      {/* Receive section */}
      <div>
        <div className="text-[10px] text-text-faint uppercase tracking-widest mb-2">You receive</div>
        <div className="bg-white rounded-xl p-3.5 flex items-center justify-between">
          <span className="font-semibold text-xl text-text-muted">~124.8</span>
          <TokenSelector token="USDC" />
        </div>
      </div>

      {/* Details */}
      <div className="bg-white/60 rounded-xl p-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-faint">Price impact</span>
          <span className="text-xs font-medium text-secondary">0.12%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-faint">Min. output</span>
          <span className="text-xs font-medium text-secondary">124.2 USDC</span>
        </div>
      </div>

      {/* Button */}
      <button className="bg-secondary text-white rounded-xl py-3.5 w-full font-semibold text-[15px] text-center">
        Swap
      </button>

      {/* Disclaimer */}
      <p className="text-[11px] text-text-faint text-center">
        Followers will automatically mirror this trade
      </p>
    </div>
  )
}
