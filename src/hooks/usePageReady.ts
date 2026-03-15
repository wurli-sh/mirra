import { useState, useEffect } from 'react'

/**
 * Returns false for `delay` ms after mount, then true.
 * Use to show skeleton loaders on page entry for a smooth UX.
 */
export function usePageReady(delay = 800) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(id)
  }, [delay])

  return ready
}
