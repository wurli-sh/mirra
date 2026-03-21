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

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
