import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app'
import { startWithReconnect } from './lib/reactive-stream'

const PORT = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`[mirra] Server running on http://localhost:${PORT}`)
  startWithReconnect()
})
