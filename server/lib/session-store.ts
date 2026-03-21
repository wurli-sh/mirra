// @ts-nocheck
import { type Address } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export interface SessionData {
  privateKey: `0x${string}`
  ownerAddress: Address
  sessionKeyAddress: Address
  createdAt: number
  lastUsedAt: number
  spentSTT: bigint
  maxSpendSTT: bigint
  approvesDone: boolean
  operationCount: number
  // Prevent accidental key leak via JSON.stringify/console.log
  toJSON?: () => Record<string, unknown>
}

/** Safe serialization — never includes privateKey */
function addSafeSerializer(session: SessionData) {
  session.toJSON = () => ({
    ownerAddress: session.ownerAddress,
    sessionKeyAddress: session.sessionKeyAddress,
    createdAt: session.createdAt,
    spentSTT: session.spentSTT.toString(),
    operationCount: session.operationCount,
    approvesDone: session.approvesDone,
  })
}

const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes
const DEFAULT_MAX_SPEND = 50n * 10n ** 18n // 50 STT in wei
const MAX_OPERATIONS = 50 // max write operations per session

const sessions = new Map<string, SessionData>()

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now()
  sessions.forEach((session, key) => {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(key)
      console.log(`[session] Expired session for ${key.slice(0, 10)}...`)
    }
  })
}, 5 * 60 * 1000).unref?.()

/**
 * Server generates the keypair — private key never leaves the server.
 * Returns the session key address for the client to fund.
 */
export function createSession(
  ownerAddress: Address,
): { sessionKeyAddress: Address; expiresAt: number } {
  // Revoke any existing session for this owner
  sessions.delete(ownerAddress.toLowerCase())

  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)
  const now = Date.now()

  const session: SessionData = {
    privateKey,
    ownerAddress,
    sessionKeyAddress: account.address,
    createdAt: now,
    lastUsedAt: now,
    spentSTT: 0n,
    maxSpendSTT: DEFAULT_MAX_SPEND,
    approvesDone: false,
    operationCount: 0,
  }
  addSafeSerializer(session)
  sessions.set(ownerAddress.toLowerCase(), session)

  console.log(`[session] Created session for ${ownerAddress.slice(0, 10)}... → key ${account.address.slice(0, 10)}...`)
  return { sessionKeyAddress: account.address, expiresAt: now + SESSION_TTL_MS }
}

export function getSession(ownerAddress: Address): SessionData | null {
  const session = sessions.get(ownerAddress.toLowerCase())
  if (!session) return null

  // Fixed expiry — NOT sliding window (M-6 fix)
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(ownerAddress.toLowerCase())
    console.log(`[session] Session expired for ${ownerAddress.slice(0, 10)}...`)
    return null
  }

  return session
}

export function revokeSession(ownerAddress: Address): boolean {
  const deleted = sessions.delete(ownerAddress.toLowerCase())
  if (deleted) console.log(`[session] Revoked session for ${ownerAddress.slice(0, 10)}...`)
  return deleted
}

/** Check spending cap BEFORE execution. Call commitSpend AFTER success. */
export function checkSpend(ownerAddress: Address, amountWei: bigint): boolean {
  const session = getSession(ownerAddress)
  if (!session) return false
  return session.spentSTT + amountWei <= session.maxSpendSTT
}

/** Commit spend AFTER successful transaction (C-2 fix). */
export function commitSpend(ownerAddress: Address, amountWei: bigint): void {
  const session = sessions.get(ownerAddress.toLowerCase())
  if (session) session.spentSTT += amountWei
}

/** Check operation count BEFORE execution. */
export function checkOperationLimit(ownerAddress: Address): boolean {
  const session = getSession(ownerAddress)
  if (!session) return false
  return session.operationCount < MAX_OPERATIONS
}

/** Increment operation count AFTER successful execution. */
export function commitOperation(ownerAddress: Address): void {
  const session = sessions.get(ownerAddress.toLowerCase())
  if (session) session.operationCount++
}

export function markApprovesDone(ownerAddress: Address): void {
  const session = sessions.get(ownerAddress.toLowerCase())
  if (session) session.approvesDone = true
}

export function getSessionStatus(ownerAddress: Address): {
  active: boolean
  sessionKeyAddress?: Address
  expiresAt?: number
  spentSTT?: string
  maxSpendSTT?: string
} {
  const session = getSession(ownerAddress)
  if (!session) return { active: false }

  return {
    active: true,
    sessionKeyAddress: session.sessionKeyAddress,
    expiresAt: session.createdAt + SESSION_TTL_MS,
    spentSTT: session.spentSTT.toString(),
    maxSpendSTT: session.maxSpendSTT.toString(),
  }
}
