import { useEffect, useState, useCallback, useRef } from 'react'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { contracts } from '@/config/contracts'
import { SimpleDEXAbi } from '@/config/abi/SimpleDEX'
import type { FeedItem, MirrorEntry } from '@/data/types'

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Persist events in localStorage so they survive page refresh
function loadFromStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveToStorage<T>(key: string, items: T[]) {
  try { localStorage.setItem(key, JSON.stringify(items)) } catch {}
}

const TRADE_FEED_KEY = 'mirrorx_trade_feed'
const MIRROR_FEED_KEY = 'mirrorx_mirror_feed'

export function useLiveTradeFeed(limit = 20) {
  const client = usePublicClient()
  const [items, setItems] = useState<FeedItem[]>(() => loadFromStorage<FeedItem>(TRADE_FEED_KEY))
  const itemsRef = useRef(items)

  // Keep ref in sync for the callback
  useEffect(() => { itemsRef.current = items }, [items])

  const addItem = useCallback((item: FeedItem) => {
    setItems((prev) => {
      const next = [item, ...prev].slice(0, limit)
      saveToStorage(TRADE_FEED_KEY, next)
      return next
    })
  }, [limit])

  useEffect(() => {
    if (!client || !contracts.simpleDex) return

    const unwatch = client.watchContractEvent({
      address: contracts.simpleDex,
      abi: SimpleDEXAbi,
      eventName: 'Swap',
      onLogs: (logs) => {
        for (const log of logs) {
          const args = log.args as any
          if (!args) continue
          const now = new Date()
          addItem({
            time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
            type: 'success',
            leader: truncate(args.trader ?? ''),
            from: `${Number(formatEther(args.amountIn ?? 0n)).toFixed(1)}`,
            to: `${Number(formatEther(args.amountOut ?? 0n)).toFixed(1)}`,
            result: `+${Number(formatEther(args.amountOut ?? 0n)).toFixed(2)}`,
          })
        }
      },
    })

    return unwatch
  }, [client, addItem])

  return { items, loaded: true }
}

// MirrorExecutor ABI fragment for the event we watch
const MirrorExecutedEvent = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'leader', type: 'address' },
      { indexed: true, internalType: 'address', name: 'follower', type: 'address' },
      { indexed: true, internalType: 'address', name: 'tokenIn', type: 'address' },
      { indexed: false, internalType: 'address', name: 'tokenOut', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amountOut', type: 'uint256' },
    ],
    name: 'MirrorExecuted',
    type: 'event',
  },
] as const

export function useLiveMirrorFeed(limit = 20) {
  const client = usePublicClient()
  const [entries, setEntries] = useState<MirrorEntry[]>(() => loadFromStorage<MirrorEntry>(MIRROR_FEED_KEY))

  useEffect(() => {
    if (!client || !contracts.mirrorExecutor) return

    const unwatch = client.watchContractEvent({
      address: contracts.mirrorExecutor,
      abi: MirrorExecutedEvent,
      eventName: 'MirrorExecuted',
      onLogs: (logs) => {
        for (const log of logs) {
          const args = log.args as any
          if (!args) continue
          setEntries((prev) => {
            const next = [{
              follower: truncate(args.follower ?? ''),
              leader: truncate(args.leader ?? ''),
              pair: `${truncate(args.tokenIn ?? '')} → ${truncate(args.tokenOut ?? '')}`,
              amount: `${Number(formatEther(args.amountIn ?? 0n)).toFixed(2)}`,
              time: 'just now',
            }, ...prev].slice(0, limit)
            saveToStorage(MIRROR_FEED_KEY, next)
            return next
          })
        }
      },
    })

    return unwatch
  }, [client, limit])

  return entries
}
