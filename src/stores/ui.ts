import { create } from 'zustand'

interface UIState {
  activeLeaderboardTab: string
  activeTradeTab: string
  followModalOpen: boolean
  setActiveLeaderboardTab: (tab: string) => void
  setActiveTradeTab: (tab: string) => void
  setFollowModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeLeaderboardTab: 'standings',
  activeTradeTab: 'positions',
  followModalOpen: false,
  setActiveLeaderboardTab: (tab) => set({ activeLeaderboardTab: tab }),
  setActiveTradeTab: (tab) => set({ activeTradeTab: tab }),
  setFollowModalOpen: (open) => set({ followModalOpen: open }),
}))
