export interface Leader {
  rank: number
  address: string
  score: number
  winRate: number
  pnl: number
  volume: number
  followers: number
  form: boolean[]
  trend: number[]
}

export interface Position {
  leader: string
  score: number
  rank: number
  deposited: number
  token: string
  maxPerTrade: number
  slippage: number
  stopLoss: number
  pnl: number
  pnlPercent: number
  stopLossUsed: number
}

export interface FeedItem {
  time: string
  type: 'success' | 'fail' | 'stop'
  leader: string
  from?: string
  to?: string
  result?: string
  reason?: string
  loss?: string
}

export interface MirrorEntry {
  follower: string
  leader: string
  pair: string
  amount: string
  time: string
}

export const protocolStats = { leaders: 142, followers: 1847, volume: '$2.4M' }

export const leaders: Leader[] = [
  { rank: 1, address: '0x7b2e...4f91', score: 94.2, winRate: 78.3, pnl: 12450, volume: 84200, followers: 23, form: [true,true,false,true,true], trend: [16,14,10,8,6,4,2] },
  { rank: 2, address: '0x9f12...6b7c', score: 87.6, winRate: 72.1, pnl: 8920, volume: 62100, followers: 17, form: [true,true,true,false,true], trend: [14,12,16,10,6,4,3] },
  { rank: 3, address: '0xa3d7...2e18', score: 81.4, winRate: 69.5, pnl: 5340, volume: 41800, followers: 11, form: [false,true,true,true,false], trend: [12,10,8,6,8,5,4] },
  { rank: 4, address: '0x5c91...d4a6', score: 76.8, winRate: 64.2, pnl: -1280, volume: 28600, followers: 8, form: [false,false,true,false,true], trend: [6,8,10,12,14,16,17] },
  { rank: 5, address: '0xf4e2...8b31', score: 71.2, winRate: 61.8, pnl: 2180, volume: 19400, followers: 5, form: [true,false,true,true,false], trend: [10,8,12,10,8,10,8] },
]

export const positions: Position[] = [
  { leader: '0x7b2e...4f91', score: 94.2, rank: 1, deposited: 420, token: 'USDC', maxPerTrade: 80, slippage: 0.5, stopLoss: 20, pnl: 84.20, pnlPercent: 16.8, stopLossUsed: 0 },
  { leader: '0x9f12...6b7c', score: 87.6, rank: 2, deposited: 180, token: 'USDC', maxPerTrade: 50, slippage: 1, stopLoss: 15, pnl: -142.80, pnlPercent: -79.3, stopLossUsed: 85 },
]

export const feedItems: FeedItem[] = [
  { time: '12:04', type: 'success', leader: '0x7b2e', from: '80 USDC', to: '0.032 WETH', result: '+0.032' },
  { time: '11:47', type: 'success', leader: '0x9f12', from: '50 USDC', to: '124 STT', result: '+124' },
  { time: '11:22', type: 'fail', leader: '0x9f12', reason: 'slippage exceeded' },
  { time: '10:58', type: 'stop', leader: '0x9f12', loss: '-$28.40' },
]

export const mirrorFeed: MirrorEntry[] = [
  { follower: '0x3a1f...8c2d', leader: '0x7b2e...4f91', pair: 'STT → USDC', amount: '245.00 STT', time: '2s ago' },
  { follower: '0xd4c8...1a3e', leader: '0x9f12...6b7c', pair: 'WETH → STT', amount: '0.85 WETH', time: '14s ago' },
  { follower: '0x82af...5d90', leader: '0x7b2e...4f91', pair: 'USDC → WETH', amount: '1,200.00 USDC', time: '31s ago' },
  { follower: '0x1e5c...9a4b', leader: '0x9f12...6b7c', pair: 'STT → WETH', amount: '500.00 STT', time: '1m ago' },
]

export const leaderStats = {
  score: 72.4, winRate: 68.2, trades: 47, pnl: 3240, followers: 8, pendingFees: 124
}

export const rankingChartData = {
  weeks: ['W1','W3','W5','W7','W9','W12'],
  lines: [
    { leader: '0x7b2e', color: 'var(--color-chart-1)', positions: [3,2,1,1,1,1] },
    { leader: '0x9f12', color: 'var(--color-chart-2)', positions: [5,7,6,5,3,2] },
    { leader: '0xa3d7', color: 'var(--color-chart-3)', positions: [2,3,2,3,3,3] },
  ]
}
