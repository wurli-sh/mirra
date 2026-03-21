import { create } from 'zustand'

interface UIState {
  activeLeaderboardTab: string
  activeTradeTab: string
  followModalOpen: boolean
  selectedLeader: `0x${string}` | null
  selectedLeaderDisplay: string
  setActiveLeaderboardTab: (tab: string) => void
  setActiveTradeTab: (tab: string) => void
  openFollowModal: (leader: `0x${string}`, display: string) => void
  closeFollowModal: () => void
  setFollowModalOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeLeaderboardTab: 'standings',
  activeTradeTab: 'leaders',
  followModalOpen: false,
  selectedLeader: null,
  selectedLeaderDisplay: '',
  setActiveLeaderboardTab: (tab) => set({ activeLeaderboardTab: tab }),
  setActiveTradeTab: (tab) => set({ activeTradeTab: tab }),
  openFollowModal: (leader, display) => set({ followModalOpen: true, selectedLeader: leader, selectedLeaderDisplay: display }),
  closeFollowModal: () => set({ followModalOpen: false, selectedLeader: null, selectedLeaderDisplay: '' }),
  setFollowModalOpen: (open) => set({ followModalOpen: open }),
}))
