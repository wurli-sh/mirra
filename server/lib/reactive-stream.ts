/**
 * Reactive Event Stream — powered by Somnia Reactivity SDK
 *
 * The on-chain reactivity is the core primitive:
 *   SimpleDEX Swap → reactively triggers MirrorExecutor → RiskGuardian, PositionTracker, ReputationEngine
 *
 * This module uses the @somnia-chain/reactivity SDK's off-chain subscriptions (somnia_watch)
 * to receive push-based event notifications. Falls back to viem watchContractEvent if SDK fails.
 */
import { EventEmitter } from 'events'
import { createPublicClient, webSocket, defineChain, formatEther, decodeEventLog, keccak256, toBytes, type Address, type Hex } from 'viem'
import { SDK } from '@somnia-chain/reactivity'
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
eventEmitter.setMaxListeners(100)

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

// Event signatures
const SWAP_SIG = keccak256(toBytes('Swap(address,address,address,uint256,uint256)'))
const MIRROR_SIG = keccak256(toBytes('MirrorExecuted(address,address,address,address,uint256,uint256)'))

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

/**
 * Primary: Somnia Reactivity SDK (somnia_watch)
 * Uses native push-based subscriptions — no polling, Somnia-native.
 */
async function initWithSDK(wsClient: ReturnType<typeof createPublicClient>) {
  // @ts-ignore — SDK types may not perfectly match
  const sdk = new SDK({ public: wsClient })

  // Subscribe to Swap events on SimpleDEX
  const swapResult = await sdk.subscribe({
    eventContractSources: [contracts.simpleDex],
    topicOverrides: [SWAP_SIG as Hex],
    ethCalls: [],
    onData: (data: any) => {
      try {
        const { topics, data: eventData } = data.result ?? data
        const decoded = decodeEventLog({
          abi: SimpleDEXAbi,
          topics: topics as [Hex, ...Hex[]],
          data: eventData as Hex,
        })
        const args = decoded.args as { trader: Address; tokenIn: Address; tokenOut: Address; amountIn: bigint; amountOut: bigint }
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
        console.log(`[reactive:sdk] Swap: ${truncateAddr(args.trader)} ${event.amountIn} ${event.tokenIn} → ${event.amountOut} ${event.tokenOut}`)
      } catch (err) {
        console.error('[reactive:sdk] Swap decode error:', err instanceof Error ? err.message.slice(0, 100) : err)
      }
    },
    onError: (err: Error) => console.error('[reactive:sdk] Swap subscription error:', err.message),
  })

  if (swapResult instanceof Error) throw swapResult

  // Subscribe to MirrorExecuted events
  const mirrorExecutor = process.env.VITE_MIRROR_EXECUTOR as Address | undefined
  if (mirrorExecutor) {
    const mirrorResult = await sdk.subscribe({
      eventContractSources: [mirrorExecutor],
      topicOverrides: [MIRROR_SIG as Hex],
      ethCalls: [],
      onData: (data: any) => {
        try {
          const { topics, data: eventData } = data.result ?? data
          const decoded = decodeEventLog({
            abi: MirrorExecutedAbi,
            topics: topics as [Hex, ...Hex[]],
            data: eventData as Hex,
          })
          const args = decoded.args as { follower: Address; leader: Address; tokenIn: Address; tokenOut: Address; amountIn: bigint; amountOut: bigint }
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
          console.log(`[reactive:sdk] Mirror: ${truncateAddr(args.leader)} mirrored for ${truncateAddr(args.follower)}`)
        } catch (err) {
          console.error('[reactive:sdk] Mirror decode error:', err instanceof Error ? err.message.slice(0, 100) : err)
        }
      },
      onError: (err: Error) => console.error('[reactive:sdk] Mirror subscription error:', err.message),
    })

    if (mirrorResult instanceof Error) {
      console.warn('[reactive:sdk] Mirror subscription failed:', mirrorResult.message)
    }
  }

  console.log('[reactive] Using Somnia Reactivity SDK (somnia_watch) — native push subscriptions')
}

/**
 * Fallback: Standard viem watchContractEvent (eth_subscribe)
 * Used when SDK's somnia_watch is not supported by the RPC node.
 */
async function initWithViem(wsClient: ReturnType<typeof createPublicClient>) {
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
        console.log(`[reactive:viem] Swap: ${truncateAddr(args.trader)} ${event.amountIn} ${event.tokenIn} → ${event.amountOut} ${event.tokenOut}`)
      }
    },
    onError: (err) => console.error('[reactive:viem] Swap watch error:', err),
  })

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
          console.log(`[reactive:viem] Mirror: ${truncateAddr(args.leader)} mirrored for ${truncateAddr(args.follower)}`)
        }
      },
      onError: (err) => console.error('[reactive:viem] Mirror watch error:', err),
    })
  }

  console.log('[reactive] Fallback: Using viem watchContractEvent (eth_subscribe)')
}

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

  const wsClient = createPublicClient({
    chain: somniaWs,
    transport: webSocket(wsUrl),
  })

  try {
    // Try Somnia Reactivity SDK first (native somnia_watch)
    await initWithSDK(wsClient)
  } catch (err) {
    console.warn('[reactive] SDK init failed:', err instanceof Error ? err.message.slice(0, 200) : err)
    // Fallback to standard viem (eth_subscribe)
    await initWithViem(wsClient)
  }
}

/** Start WebSocket subscription with automatic reconnect on failure */
export function startWithReconnect(delay = 5000) {
  initReactiveSubscription().catch((err) => {
    console.error('[reactive] Init failed, retrying in', delay / 1000, 's:', err instanceof Error ? err.message : err)
    setTimeout(() => startWithReconnect(Math.min(delay * 2, 60_000)), delay)
  })
}
