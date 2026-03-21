// @ts-nocheck — server-only, runs via tsx without type checking
import { tool } from 'ai'
import { z } from 'zod'
import { getRecentEvents, getLastTradeTimestamp } from '../../lib/reactive-stream'

export const get_recent_trades = tool({
  description: 'Get the most recent trades and mirror events from the protocol, streamed in real-time via Somnia Reactivity. Use when user asks "what just happened", "any recent trades", "latest activity", or "what are leaders doing".',
  parameters: z.object({
    limit: z.number().default(10).describe('Number of recent events to return (max 50)'),
  }),
  execute: async ({ limit }) => {
    const events = getRecentEvents(Math.min(limit, 50))
    const lastTs = getLastTradeTimestamp()
    const secondsAgo = lastTs ? Math.round((Date.now() - lastTs) / 1000) : null

    return {
      events,
      count: events.length,
      lastTradeSecondsAgo: secondsAgo,
      source: 'somnia-reactivity-websocket',
    }
  },
})
