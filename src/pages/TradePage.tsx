import { Tabs } from '@/components/ui/Tabs'
import { PositionCard } from '@/components/trade/PositionCard'
import { SwapPanel } from '@/components/trade/SwapPanel'
import { StatsPanel } from '@/components/trade/StatsPanel'
import { TradeFeed } from '@/components/trade/TradeFeed'
import { usePositions } from '@/hooks/usePositions'
import { useWallet } from '@/hooks/useWallet'
import { useUIStore } from '@/stores/ui'

const tradeTabs = [
  { label: 'Positions', key: 'positions' },
  { label: 'Feed', key: 'feed' },
  { label: 'Alerts', key: 'alerts' },
]

export function TradePage() {
  const { activeTradeTab, setActiveTradeTab } = useUIStore()
  const { positions, isLoading } = usePositions()
  const { isConnected } = useWallet()

  return (
    <div className="flex pt-24 pb-10 gap-6">
      {/* Left Column */}
      <div className="flex flex-col flex-1">
        <Tabs
          items={tradeTabs}
          active={activeTradeTab}
          onChange={setActiveTradeTab}
          trailing={
            <span className="text-xs text-text-faint pr-1">
              {isConnected ? `Following ${positions.length} leaders` : 'Connect wallet to view'}
            </span>
          }
        />

        {!isConnected ? (
          <div className="py-16 text-center">
            <p className="text-sm text-text-muted">Connect your wallet to view positions.</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted ml-3">Loading positions...</span>
          </div>
        ) : positions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-text-muted">No active positions.</p>
            <p className="text-xs text-text-faint mt-1">Follow a leader from the leaderboard to start mirroring trades.</p>
          </div>
        ) : (
          positions.map((pos, i) => (
            <PositionCard key={pos.fullLeaderAddress} position={pos} />
          ))
        )}

        <div className="pt-4">
          <TradeFeed />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col w-[400px] shrink-0 gap-5">
        <SwapPanel />
        <StatsPanel />
      </div>
    </div>
  )
}
