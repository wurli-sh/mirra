import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai'
import { isAddress } from 'viem'
import { getModels } from './lib/provider'
import { rateLimit, getClientIp } from './lib/rate-limit'
import { buildTools } from './agent/tools/index'
import { buildSystemPrompt } from './agent/system-prompt'
import { streamSSE } from 'hono/streaming'
import { initReactiveSubscription, eventEmitter, getRecentEvents } from './lib/reactive-stream'

const app = new Hono()

app.use('/api/*', cors({ origin: '*' }))

const MAX_MESSAGES = 16

app.post('/api/chat', async (c) => {
  const ip = getClientIp(c.req.raw)
  const { success } = rateLimit(`chat:${ip}`, 20, 60_000)
  if (!success) {
    return c.json({ error: 'Rate limit reached. Please try again in a minute.' }, 429)
  }

  const { messages, userAddress }: { messages: UIMessage[]; userAddress?: string } = await c.req.json()

  const safeAddress = userAddress && isAddress(userAddress) ? userAddress : undefined
  const trimmedMessages = messages.slice(-MAX_MESSAGES)
  const system = buildSystemPrompt(safeAddress)
  const converted = await convertToModelMessages(trimmedMessages)
  const tools = buildTools(safeAddress)
  const models = getModels()

  const model = models[0]
  const result = streamText({
    model,
    system,
    messages: converted,
    tools,
    stopWhen: stepCountIs(3),
    onStepFinish: ({ toolResults }) => {
      if (toolResults.length) {
        console.log('[chat] tool results:', JSON.stringify(toolResults.map(t => ({ tool: t.toolName, result: typeof t.result === 'object' ? t.result : t.result })), null, 2))
      }
    },
    onError: ({ error }) => {
      console.error('[chat] stream error:', error instanceof Error ? error.message : error)
    },
  })

  return result.toUIMessageStreamResponse()
})

app.get('/api/events', (c) => {
  return streamSSE(c, async (stream) => {
    // Signal connection established
    await stream.writeSSE({ data: 'ok', event: 'connected' })

    const cached = getRecentEvents()
    for (const event of cached) {
      await stream.writeSSE({ data: JSON.stringify(event), event: 'trade' })
    }

    const handler = async (event: unknown) => {
      try {
        await stream.writeSSE({ data: JSON.stringify(event), event: 'trade' })
      } catch {
        eventEmitter.off('event', handler)
      }
    }

    eventEmitter.on('event', handler)

    const heartbeat = setInterval(async () => {
      try {
        await stream.writeSSE({ data: '', event: 'ping' })
      } catch {
        clearInterval(heartbeat)
        eventEmitter.off('event', handler)
      }
    }, 30_000)

    stream.onAbort(() => {
      clearInterval(heartbeat)
      eventEmitter.off('event', handler)
    })

    await new Promise(() => {})
  })
})

const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[mirra] Server running on http://localhost:${PORT}`)
  initReactiveSubscription()
})
