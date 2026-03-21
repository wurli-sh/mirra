import { useState } from 'react'
import { useAccount } from 'wagmi'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ActivateAgentModal } from '@/components/chat/ActivateAgentModal'
import { useSessionStore } from '@/stores/session'

export function ChatPage() {
  const { isConnected } = useAccount()
  const sessionStatus = useSessionStore((s) => s.status)

  // Skip only lasts for this page visit — modal always shows on next visit if no session
  const [skipped, setSkipped] = useState(false)
  const [activating, setActivating] = useState(false)

  const shouldShow = isConnected && !skipped && sessionStatus !== 'active'
  const showModal = shouldShow || (activating && !skipped)

  const handleSkip = () => {
    setSkipped(true)
    setActivating(false)
  }

  const handleComplete = () => {
    setSkipped(true)
    setActivating(false)
  }

  return (
    <div className="h-full overflow-hidden -mx-4 sm:-mx-6 max-w-none">
      <ChatPanel />
      <ActivateAgentModal
        open={showModal}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onActivating={() => setActivating(true)}
      />
    </div>
  )
}
