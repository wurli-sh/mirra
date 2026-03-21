import { create } from 'zustand'
import type { Address } from 'viem'

const STORAGE_KEY = 'mirra_session'

type SessionStatus = 'inactive' | 'activating' | 'active' | 'expired'

interface SessionState {
  sessionKeyAddress: Address | null
  status: SessionStatus
  expiresAt: number | null
  activationStep: number

  setSession: (address: Address, expiresAt: number) => void
  clearSession: () => void
  setStatus: (status: SessionStatus) => void
  setActivationStep: (step: number) => void
}

function loadFromStorage(): { sessionKeyAddress: Address | null; expiresAt: number | null; status: SessionStatus } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { sessionKeyAddress: null, expiresAt: null, status: 'inactive' }
    const data = JSON.parse(raw)
    // Check if expired
    if (data.expiresAt && Date.now() > data.expiresAt) {
      sessionStorage.removeItem(STORAGE_KEY)
      return { sessionKeyAddress: null, expiresAt: null, status: 'expired' }
    }
    return {
      sessionKeyAddress: data.sessionKeyAddress ?? null,
      expiresAt: data.expiresAt ?? null,
      status: data.sessionKeyAddress ? 'active' : 'inactive',
    }
  } catch {
    return { sessionKeyAddress: null, expiresAt: null, status: 'inactive' }
  }
}

function saveToStorage(address: Address | null, expiresAt: number | null) {
  try {
    if (!address) {
      sessionStorage.removeItem(STORAGE_KEY)
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionKeyAddress: address, expiresAt }))
    }
  } catch { /* private browsing */ }
}

const initial = loadFromStorage()

export const useSessionStore = create<SessionState>((set) => ({
  sessionKeyAddress: initial.sessionKeyAddress,
  status: initial.status,
  expiresAt: initial.expiresAt,
  activationStep: 0,

  setSession: (address, expiresAt) => {
    saveToStorage(address, expiresAt)
    set({ sessionKeyAddress: address, expiresAt, status: 'active', activationStep: 0 })
  },

  clearSession: () => {
    saveToStorage(null, null)
    set({ sessionKeyAddress: null, expiresAt: null, status: 'inactive', activationStep: 0 })
  },

  setStatus: (status) => set({ status }),
  setActivationStep: (step) => set({ activationStep: step }),
}))
