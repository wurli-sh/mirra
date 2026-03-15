export interface Leader {
  rank: number
  address: string
  fullAddress: `0x${string}`
  score: number
  winRate: number
  pnl: number
  volume: number
  followers: number
  trend: number[]
}

export interface Position {
  leader: string
  fullLeaderAddress: `0x${string}`
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
