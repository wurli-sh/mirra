import type { Address } from 'viem'

interface SessionRegistration {
  sessionKeyAddress: Address
  expiresAt: number
}

/**
 * C-1 + C-3 fix: Client sends a wallet signature to prove ownership.
 * Server generates the keypair — private key never leaves the server.
 */
export async function registerSession(
  ownerAddress: Address,
  signMessage: (args: { message: string }) => Promise<`0x${string}`>,
): Promise<SessionRegistration> {
  const timestamp = Date.now()
  const message = `Mirra: Activate Oni Agent\nWallet: ${ownerAddress}\nTimestamp: ${timestamp}`

  // User signs with their wallet to prove ownership
  const signature = await signMessage({ message })

  const res = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerAddress, signature, timestamp }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Registration failed' }))
    throw new Error(data.error || 'Session registration failed')
  }

  const { sessionKeyAddress, expiresAt } = await res.json()
  return { sessionKeyAddress, expiresAt }
}

export async function revokeSessionKey(
  ownerAddress: Address,
  signMessage: (args: { message: string }) => Promise<`0x${string}`>,
): Promise<void> {
  const timestamp = Date.now()
  const message = `Mirra: Revoke Oni Session\nWallet: ${ownerAddress}\nTimestamp: ${timestamp}`
  const signature = await signMessage({ message })

  await fetch('/api/session', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerAddress, signature, timestamp }),
  })
}

export async function checkSessionStatus(ownerAddress: Address): Promise<{
  active: boolean
  sessionKeyAddress?: Address
  expiresAt?: number
}> {
  const res = await fetch(`/api/session/status?address=${ownerAddress}`)
  return res.json()
}
