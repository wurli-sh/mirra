import { useEffect, useState, useRef, useCallback } from 'react'

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

export function useReactiveEvents(limit = 20) {
  const [events, setEvents] = useState<ReactiveEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const esRef = useRef<EventSource | null>(null)

  const addEvent = useCallback((event: ReactiveEvent) => {
    setEvents((prev) => [event, ...prev].slice(0, limit))
  }, [limit])

  useEffect(() => {
    const es = new EventSource('/api/events')
    esRef.current = es

    es.addEventListener('connected', () => setIsConnected(true))

    es.addEventListener('trade', (e) => {
      try {
        const event: ReactiveEvent = JSON.parse(e.data)
        addEvent(event)
        setIsConnected(true)
      } catch { /* ignore malformed */ }
    })

    es.onopen = () => setIsConnected(true)
    es.onerror = () => setIsConnected(false)

    return () => {
      es.close()
      esRef.current = null
      setIsConnected(false)
    }
  }, [addEvent])

  return { events, isConnected }
}
