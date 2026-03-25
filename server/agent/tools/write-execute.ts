// @ts-nocheck
import { tool } from 'ai'
import { z } from 'zod'
import { formatEther, parseEther } from 'viem'
import { publicClient, contracts, resolveToken } from '../../lib/viem-client'
import { type SessionData } from '../../lib/session-store'
import { executeAction } from '../../lib/session-executor'
import { SimpleDEXAbi } from '../../../src/config/abi/SimpleDEX'
import { LeaderRegistryAbi } from '../../../src/config/abi/LeaderRegistry'

const VALID_PAIRS: Record<string, string[]> = {
  STT: ['USDC', 'WETH'],
  USDC: ['STT'],
  WETH: ['STT'],
}
function isPairValid(a: string, b: string): boolean {
  return VALID_PAIRS[a]?.includes(b) ?? false
}

export function buildExecutableWriteTools(session: SessionData) {
  const exec_swap = tool({
    description: 'Execute a token swap immediately. The transaction will be signed and sent automatically.',
    parameters: z.object({
      tokenIn: z.string().optional().describe('Input token symbol (STT, USDC, WETH)'),
      tokenOut: z.string().optional().describe('Output token symbol (STT, USDC, WETH)'),
      amountIn: z.string().optional().describe('Amount to swap (e.g. "10")'),
      fromToken: z.string().optional(),
      toToken: z.string().optional(),
      amount: z.string().optional(),
    }),
    execute: async (params) => {
      const tokenIn = params.tokenIn ?? params.fromToken
      const tokenOut = params.tokenOut ?? params.toToken
      const amountIn = params.amountIn ?? params.amount
      if (!tokenIn || !tokenOut || !amountIn) {
        return { error: 'Missing parameters. Need: tokenIn, tokenOut, amountIn' }
      }
      const parsedAmt = Number(amountIn)
      if (!isFinite(parsedAmt) || parsedAmt <= 0) {
        return { error: 'amountIn must be a positive number string, e.g. "10"' }
      }
      const tIn = resolveToken(tokenIn)
      const tOut = resolveToken(tokenOut)
      if (!tIn || !tOut) return { error: `Unknown token "${!tIn ? tokenIn : tokenOut}". Available: STT, USDC, WETH` }
      if (!isPairValid(tIn.symbol, tOut.symbol)) return { error: `No pool for ${tIn.symbol}↔${tOut.symbol}. Valid: STT↔USDC, STT↔WETH.` }

      return executeAction(session, 'swap', {
        tokenInAddress: tIn.address,
        tokenOutAddress: tOut.address,
        tokenIn: tIn.symbol,
        tokenOut: tOut.symbol,
        amountIn,
      })
    },
  })

  const exec_follow = tool({
    description: 'Follow a leader immediately. Transaction executes automatically.',
    parameters: z.object({
      leader: z.string().describe('Leader wallet address'),
      amount: z.string().default('10').describe('STT deposit amount'),
      maxPerTrade: z.string().default('5').describe('Max STT per trade'),
      slippageBps: z.number().int().min(1).max(1000).default(300).describe('Slippage in bps (1-1000)'),
      stopLoss: z.string().default('5').describe('Stop loss in STT'),
    }),
    execute: async (params) => {
      let leader = params.leader
      // Resolve truncated addresses
      if (!leader || leader === 'undefined' || leader.includes('...') || leader.length < 42) {
        try {
          const count = await publicClient.readContract({
            address: contracts.leaderRegistry,
            abi: LeaderRegistryAbi,
            functionName: 'getLeaderCount',
          })
          const prefix = leader?.slice(0, 6).toLowerCase() ?? ''
          const suffix = leader?.slice(-4).toLowerCase() ?? ''
          const candidates = await Promise.all(
            Array.from({ length: Number(count) }, (_, i) =>
              publicClient.readContract({
                address: contracts.leaderRegistry,
                abi: LeaderRegistryAbi,
                functionName: 'getLeaderAt',
                args: [BigInt(i)],
              })
            )
          )
          const matches = candidates.filter(c =>
            !prefix || (c.toLowerCase().startsWith(prefix) && c.toLowerCase().endsWith(suffix))
          )
          if (matches.length === 1) leader = matches[0]
          else if (matches.length > 1) return { error: `Multiple leaders match. Provide full address.` }
        } catch { /* fallthrough */ }
        if (!leader || leader.includes('...') || leader.length < 42) {
          return { error: 'Could not resolve leader. Try "who are the top leaders?" first.' }
        }
      }

      return executeAction(session, 'follow', {
        leader,
        amount: params.amount || '10',
        maxPerTrade: params.maxPerTrade || '5',
        slippageBps: params.slippageBps ?? 300,
        stopLoss: params.stopLoss || '5',
      })
    },
  })

  const exec_unfollow = tool({
    description: 'Unfollow a leader immediately.',
    parameters: z.object({ leader: z.string().describe('Leader wallet address') }),
    execute: async ({ leader }) => executeAction(session, 'unfollow', { leader }),
  })

  const exec_deposit = tool({
    description: 'Deposit more STT into a follow position immediately.',
    parameters: z.object({
      leader: z.string().describe('Leader wallet address'),
      amount: z.string().describe('Additional STT to deposit'),
    }),
    execute: async ({ leader, amount }) => executeAction(session, 'deposit', { leader, amount }),
  })

  const exec_withdraw = tool({
    description: 'Withdraw STT from a follow position immediately.',
    parameters: z.object({
      leader: z.string().describe('Leader wallet address'),
      amount: z.string().describe('STT amount to withdraw'),
    }),
    execute: async ({ leader, amount }) => executeAction(session, 'withdraw', { leader, amount }),
  })

  const exec_register = tool({
    description: 'Register as a leader immediately by staking STT.',
    parameters: z.object({
      stakeAmount: z.string().default('10').describe('STT to stake (minimum 10)'),
    }),
    execute: async ({ stakeAmount }) => executeAction(session, 'register', { stakeAmount }),
  })

  const exec_deregister = tool({
    description: 'Deregister as a leader immediately.',
    parameters: z.object({}),
    execute: async () => executeAction(session, 'deregister', {}),
  })

  const exec_claimFees = tool({
    description: 'Claim leader fees immediately. Specify which token to claim (STT, USDC, WETH).',
    parameters: z.object({
      token: z.string().optional().describe('Token to claim fees in (STT, USDC, WETH). Defaults to STT.'),
    }),
    execute: async ({ token }) => executeAction(session, 'claimFees', { token: token || 'STT' }),
  })

  const exec_approve = tool({
    description: 'Approve a token for spending immediately.',
    parameters: z.object({
      token: z.string().describe('Token symbol (STT, USDC, WETH)'),
      spender: z.enum(['followerVault', 'simpleDex']).describe('Contract to approve'),
    }),
    execute: async ({ token, spender }) => executeAction(session, 'approve', { token, spender }),
  })

  return {
    request_swap: exec_swap,
    request_follow: exec_follow,
    request_unfollow: exec_unfollow,
    request_deposit_more: exec_deposit,
    request_withdraw: exec_withdraw,
    request_register_leader: exec_register,
    request_deregister: exec_deregister,
    request_claim_fees: exec_claimFees,
    request_approve: exec_approve,
  }
}
