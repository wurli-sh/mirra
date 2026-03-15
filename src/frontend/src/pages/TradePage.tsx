import { Tabs } from '../components/ui/Tabs'
import { PositionCard } from '../components/trade/PositionCard'
import { SwapPanel } from '../components/trade/SwapPanel'
import { StatsPanel } from '../components/trade/StatsPanel'
import { TradeFeed } from '../components/trade/TradeFeed'
import { positions } from '../data/mock'
import { useUIStore } from '../stores/ui'

const tradeTabs = [
  { label: 'Positions', key: 'positions' },
  { label: 'Feed', key: 'feed' },
  { label: 'Alerts', key: 'alerts' },
]

export function TradePage() {
  const { activeTradeTab, setActiveTradeTab } = useUIStore()

  return (
    <div className="flex px-20 pb-10 gap-6">
      {/* Left Column */}
      <div className="flex flex-col flex-1">
        <Tabs
          items={tradeTabs}
          active={activeTradeTab}
          onChange={setActiveTradeTab}
          trailing={
            <span className="text-xs text-text-faint pr-1">Following 2 leaders</span>
          }
        />
        {positions.map((pos, i) => (
          <PositionCard key={i} position={pos} />
        ))}
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
