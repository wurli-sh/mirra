import { type Address } from 'viem'

export const contracts = {
  sttToken: import.meta.env.VITE_STT_TOKEN as Address,
  usdcToken: import.meta.env.VITE_USDC_TOKEN as Address,
  wethToken: import.meta.env.VITE_WETH_TOKEN as Address,
  simpleDex: import.meta.env.VITE_SIMPLE_DEX as Address,
  leaderRegistry: import.meta.env.VITE_LEADER_REGISTRY as Address,
  followerVault: import.meta.env.VITE_FOLLOWER_VAULT as Address,
  positionTracker: import.meta.env.VITE_POSITION_TRACKER as Address,
  reputationEngine: import.meta.env.VITE_REPUTATION_ENGINE as Address,
  mirrorExecutor: import.meta.env.VITE_MIRROR_EXECUTOR as Address,
  riskGuardian: import.meta.env.VITE_RISK_GUARDIAN as Address,
} as const
