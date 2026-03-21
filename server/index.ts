import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai'
import { isAddress, verifyMessage } from 'viem'
import { getModels } from './lib/provider'
import { rateLimit, getClientIp } from './lib/rate-limit'
import { buildTools } from './agent/tools/index'
import { buildSystemPrompt } from './agent/system-prompt'
import { createSession, revokeSession, getSessionStatus, getSession } from './lib/session-store'
import { streamSSE } from 'hono/streaming'
import { initReactiveSubscription, eventEmitter, getRecentEvents, startWithReconnect } from './lib/reactive-stream'

const app = new Hono()

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:3001').split(',')
app.use('/api/*', cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : null,
}))

const MAX_MESSAGES = 16

app.post('/api/chat', async (c) => {
  const ip = getClientIp(c.req.raw)
  const { success } = rateLimit(`chat:${ip}`, 20, 60_000)
  if (!success) {
    return c.json({ error: 'Rate limit reached. Please try again in a minute.' }, 429)
  }

  let body: { messages?: UIMessage[]; userAddress?: string }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
  const { messages, userAddress } = body
  if (!Array.isArray(messages)) {
    return c.json({ error: 'messages must be an array' }, 400)
  }

  const safeAddress = userAddress && isAddress(userAddress) ? userAddress : undefined
  const MAX_MSG_CHARS = 4000
  const trimmedMessages = messages.slice(-MAX_MESSAGES).map((m: UIMessage) => ({
    ...m,
    content: typeof m.content === 'string' ? m.content.slice(0, MAX_MSG_CHARS) : m.content,
  }))
  // Pass session object directly to buildTools — avoids dual-module Map issue with tsx
  const session = safeAddress ? getSession(safeAddress) : null
  const system = buildSystemPrompt(safeAddress, !!session)
  const converted = await convertToModelMessages(trimmedMessages)
  const tools = buildTools(safeAddress, session)
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
        // H-2 fix: log only tool name + action type, not full results
        console.log('[chat] tools called:', toolResults.map(t => t.toolName).join(', '))
      }
    },
    onError: ({ error }) => {
      console.error('[chat] stream error:', error instanceof Error ? error.message : error)
    },
  })

  return result.toUIMessageStreamResponse()
})

// ── Session key endpoints ──
// C-1 fix: All state-changing endpoints require EIP-191 wallet signature
// C-3 fix: Server generates keypair — private key never leaves the server

app.post('/api/session', async (c) => {
  const ip = getClientIp(c.req.raw)
  const { success } = rateLimit(`session:${ip}`, 5, 60_000)
  if (!success) return c.json({ error: 'Rate limit reached.' }, 429)

  let body: { ownerAddress?: string; signature?: string; timestamp?: number }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }

  const { ownerAddress, signature, timestamp } = body
  if (!ownerAddress || !isAddress(ownerAddress)) return c.json({ error: 'Invalid ownerAddress' }, 400)
  if (!signature || typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return c.json({ error: 'Signature and valid timestamp required' }, 400)
  }

  // Reject stale challenges (1 minute window)
  if (Date.now() - timestamp > 60_000) return c.json({ error: 'Challenge expired. Try again.' }, 400)

  // Verify wallet ownership via EIP-191 signature
  const message = `Mirra: Activate Oni Agent\nWallet: ${ownerAddress}\nTimestamp: ${timestamp}`
  try {
    const valid = await verifyMessage({
      address: ownerAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
    if (!valid) return c.json({ error: 'Invalid signature' }, 401)
  } catch {
    return c.json({ error: 'Signature verification failed' }, 401)
  }

  // Server generates the keypair — private key never sent over the network
  // Auto-approvals are deferred until the session wallet is funded (first executeAction)
  const { sessionKeyAddress, expiresAt } = createSession(ownerAddress as `0x${string}`)

  return c.json({ ok: true, sessionKeyAddress, expiresAt })
})

// Unauthenticated cleanup — only revokes session, cannot execute anything.
// Used by disconnect/tab-close when signing isn't possible.
app.post('/api/session/revoke', async (c) => {
  const ip = getClientIp(c.req.raw)
  const { success } = rateLimit(`session-revoke:${ip}`, 10, 60_000)
  if (!success) return c.json({ error: 'Rate limit reached.' }, 429)

  let body: { ownerAddress?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }
  if (!body.ownerAddress || !isAddress(body.ownerAddress)) return c.json({ error: 'Invalid address' }, 400)

  revokeSession(body.ownerAddress as `0x${string}`)
  return c.json({ ok: true })
})

// Authenticated revoke — requires wallet signature
app.delete('/api/session', async (c) => {
  const ip = getClientIp(c.req.raw)
  const { success } = rateLimit(`session:${ip}`, 5, 60_000)
  if (!success) return c.json({ error: 'Rate limit reached.' }, 429)

  let body: { ownerAddress?: string; signature?: string; timestamp?: number }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }

  const { ownerAddress, signature, timestamp } = body
  if (!ownerAddress || !isAddress(ownerAddress)) return c.json({ error: 'Invalid address' }, 400)
  if (!signature || typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return c.json({ error: 'Signature and valid timestamp required' }, 400)
  }

  if (Date.now() - timestamp > 60_000) return c.json({ error: 'Challenge expired' }, 400)

  const message = `Mirra: Revoke Oni Session\nWallet: ${ownerAddress}\nTimestamp: ${timestamp}`
  try {
    const valid = await verifyMessage({
      address: ownerAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    })
    if (!valid) return c.json({ error: 'Invalid signature' }, 401)
  } catch {
    return c.json({ error: 'Signature verification failed' }, 401)
  }

  revokeSession(ownerAddress as `0x${string}`)
  return c.json({ ok: true })
})

app.get('/api/session/status', (c) => {
  const address = c.req.query('address')
  if (!address || !isAddress(address)) return c.json({ active: false })

  return c.json(getSessionStatus(address as `0x${string}`))
})

// ── SSE events ──

app.get('/api/events', (c) => {
  const ip = getClientIp(c.req.raw)
  const { success } = rateLimit(`sse:${ip}`, 5, 60_000)
  if (!success) {
    return c.json({ error: 'Too many SSE connections. Try again later.' }, 429)
  }

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
  startWithReconnect()
})
