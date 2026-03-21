import { createPublicClient, http, type Address } from 'viem'
import { defineChain } from 'viem'

export const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Shannon Testnet',
  nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://dream-rpc.somnia.network/'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://shannon.somnia.network' },
  },
  testnet: true,
})

export const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(undefined, {
    retryCount: 3,
    retryDelay: 500,
    timeout: 10_000,
  }),
})

export const contracts = {
  sttToken: process.env.VITE_STT_TOKEN as Address,
  usdcToken: process.env.VITE_USDC_TOKEN as Address,
  wethToken: process.env.VITE_WETH_TOKEN as Address,
  simpleDex: process.env.VITE_SIMPLE_DEX as Address,
  leaderRegistry: process.env.VITE_LEADER_REGISTRY as Address,
  followerVault: process.env.VITE_FOLLOWER_VAULT as Address,
  positionTracker: process.env.VITE_POSITION_TRACKER as Address,
  reputationEngine: process.env.VITE_REPUTATION_ENGINE as Address,
} as const

export const TOKEN_MAP: Record<string, { address: Address; symbol: string; decimals: number }> = {
  STT: { address: contracts.sttToken, symbol: 'STT', decimals: 18 },
  USDC: { address: contracts.usdcToken, symbol: 'USDC', decimals: 18 },
  WETH: { address: contracts.wethToken, symbol: 'WETH', decimals: 18 },
}

export function resolveToken(symbolOrAddress: string): { address: Address; symbol: string } | null {
  const upper = symbolOrAddress.toUpperCase()
  if (TOKEN_MAP[upper]) return TOKEN_MAP[upper]

  // Try matching by address
  for (const t of Object.values(TOKEN_MAP)) {
    if (t.address.toLowerCase() === symbolOrAddress.toLowerCase()) return t
  }
  return null
}
