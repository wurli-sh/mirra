import { useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useSessionStore } from '@/stores/session'

/**
 * Watches for wallet disconnect and auto-revokes the session.
 * Uses unauthenticated /api/session/revoke endpoint (no signature needed).
 * Also clears session when the connected address changes.
 */
export function useSessionCleanup() {
  const { address, isConnected } = useAccount()
  const clearSession = useSessionStore((s) => s.clearSession)
  const sessionActive = useSessionStore((s) => s.status === 'active')
  const prevAddress = useRef(address)

  useEffect(() => {
    // Wallet disconnected — revoke session server-side
    if (!isConnected && sessionActive && prevAddress.current) {
      fetch('/api/session/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: prevAddress.current }),
      }).catch(() => {})
      clearSession()
    }

    // Address changed (switched wallets) — revoke old session
    if (address && prevAddress.current && address !== prevAddress.current && sessionActive) {
      fetch('/api/session/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerAddress: prevAddress.current }),
      }).catch(() => {})
      clearSession()
    }

    prevAddress.current = address
  }, [isConnected, address, sessionActive, clearSession])
}
