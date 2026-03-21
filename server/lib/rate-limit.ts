interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter(t => now - t < 120_000)
    if (entry.timestamps.length === 0) store.delete(key)
  })
}, 60_000).unref?.()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.timestamps.push(now)
  return { success: true, remaining: limit - entry.timestamps.length }
}

// Only trust proxy headers from known proxies. Set TRUSTED_PROXY_IP env var when behind a reverse proxy.
const TRUSTED_PROXY = process.env.TRUSTED_PROXY_IP

if (!TRUSTED_PROXY) {
  console.warn('[rate-limit] TRUSTED_PROXY_IP not set — IP-based rate limiting uses x-real-ip header (may not work behind a proxy)')
}

export function getClientIp(request: Request): string {
  if (TRUSTED_PROXY) {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    const realIp = request.headers.get('x-real-ip')
    if (realIp) return realIp
  }
  // Without a trusted proxy, only trust x-real-ip if set (some Node servers populate this)
  // Fall back to a hash of user-agent + accept-language as a weak client identifier
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  const ua = request.headers.get('user-agent') ?? ''
  const lang = request.headers.get('accept-language') ?? ''
  return ua && lang ? `ua:${ua.slice(0, 32)}_${lang.slice(0, 8)}` : 'unknown'
}
