/**
 * Reactive Event Stream — powered by Somnia Reactivity
 *
 * The on-chain reactivity is the core primitive:
 *   SimpleDEX Swap → reactively triggers MirrorExecutor → RiskGuardian, PositionTracker, ReputationEngine
 *
 * This module watches those events via viem's WebSocket eth_subscribe and caches them
 * in a ring buffer for the SSE endpoint and LLM tools.
 */
import { EventEmitter } from 'events'
import { createPublicClient, webSocket, defineChain, formatEther, type Address, type Log } from 'viem'
import { contracts, resolveToken } from './viem-client'
import { SimpleDEXAbi } from '../../src/config/abi/SimpleDEX'

export interface ReactiveEvent {
  type: 'swap' | 'mirror'
  timestamp: number
  leader: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  follower?: string
}

const MAX_EVENTS = 50
const eventBuffer: ReactiveEvent[] = []
export const eventEmitter = new EventEmitter()

export function getRecentEvents(limit = 20): ReactiveEvent[] {
  return eventBuffer.slice(0, limit)
}

export function getLastTradeTimestamp(): number | null {
  return eventBuffer.length > 0 ? eventBuffer[0].timestamp : null
}

function tokenSymbol(addr: string): string {
  const t = resolveToken(addr)
  return t?.symbol ?? `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function pushEvent(event: ReactiveEvent) {
  eventBuffer.unshift(event)
  if (eventBuffer.length > MAX_EVENTS) eventBuffer.pop()
  eventEmitter.emit('event', event)
}

// MirrorExecuted ABI fragment
const MirrorExecutedAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'follower', type: 'address' },
      { indexed: true, internalType: 'address', name: 'leader', type: 'address' },
      { indexed: false, internalType: 'address', name: 'tokenIn', type: 'address' },
      { indexed: false, internalType: 'address', name: 'tokenOut', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amountOut', type: 'uint256' },
    ],
    name: 'MirrorExecuted',
    type: 'event',
  },
] as const

export async function initReactiveSubscription() {
  const wsUrl = process.env.SOMNIA_WS_URL ?? 'wss://dream-rpc.somnia.network/ws'

  const somniaWs = defineChain({
    id: 50312,
    name: 'Somnia Shannon Testnet',
    nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
    rpcUrls: {
      default: {
        http: ['https://dream-rpc.somnia.network/'],
        webSocket: [wsUrl],
      },
    },
    testnet: true,
  })

  try {
    const wsClient = createPublicClient({
      chain: somniaWs,
      transport: webSocket(wsUrl),
    })

    // Watch Swap events on SimpleDEX
    wsClient.watchContractEvent({
      address: contracts.simpleDex,
      abi: SimpleDEXAbi,
      eventName: 'Swap',
      onLogs: (logs) => {
        for (const log of logs) {
          const args = log.args as { trader: Address; tokenIn: Address; tokenOut: Address; amountIn: bigint; amountOut: bigint }
          if (!args) continue
          const event: ReactiveEvent = {
            type: 'swap',
            timestamp: Date.now(),
            leader: truncateAddr(args.trader),
            tokenIn: tokenSymbol(args.tokenIn),
            tokenOut: tokenSymbol(args.tokenOut),
            amountIn: Number(formatEther(args.amountIn)).toFixed(2),
            amountOut: Number(formatEther(args.amountOut)).toFixed(2),
          }
          pushEvent(event)
          console.log(`[reactive] Swap: ${truncateAddr(args.trader)} ${event.amountIn} ${event.tokenIn} → ${event.amountOut} ${event.tokenOut}`)
        }
      },
      onError: (err) => console.error('[reactive] Swap watch error:', err),
    })

    // Watch MirrorExecuted events (on-chain Somnia Reactivity triggers these)
    const mirrorExecutor = process.env.VITE_MIRROR_EXECUTOR as Address | undefined
    if (mirrorExecutor) {
      wsClient.watchContractEvent({
        address: mirrorExecutor,
        abi: MirrorExecutedAbi,
        eventName: 'MirrorExecuted',
        onLogs: (logs) => {
          for (const log of logs) {
            const args = log.args as { follower: Address; leader: Address; tokenIn: Address; tokenOut: Address; amountIn: bigint; amountOut: bigint }
            if (!args) continue
            const event: ReactiveEvent = {
              type: 'mirror',
              timestamp: Date.now(),
              leader: truncateAddr(args.leader),
              follower: truncateAddr(args.follower),
              tokenIn: tokenSymbol(args.tokenIn),
              tokenOut: tokenSymbol(args.tokenOut),
              amountIn: Number(formatEther(args.amountIn)).toFixed(2),
              amountOut: Number(formatEther(args.amountOut)).toFixed(2),
            }
            pushEvent(event)
            console.log(`[reactive] Mirror: ${truncateAddr(args.leader)} mirrored for ${truncateAddr(args.follower)}`)
          }
        },
        onError: (err) => console.error('[reactive] Mirror watch error:', err),
      })
    }

    console.log('[reactive] Watching Swap + MirrorExecuted events via Somnia Reactivity')
  } catch (err) {
    console.error('[reactive] WebSocket init failed:', err)
    console.warn('[reactive] Server continues without live events — LLM tools still work via RPC')
  }
}
