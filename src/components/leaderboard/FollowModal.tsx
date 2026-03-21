import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X, AlertTriangle } from 'lucide-react'
import { useReadContract } from 'wagmi'
import { useUIStore } from '@/stores/ui'
import { useFollow } from '@/hooks/useFollow'
import { useApproveToken } from '@/hooks/useApproveToken'
import { useWallet } from '@/hooks/useWallet'
import { contracts } from '@/config/contracts'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'
import { parseEther } from 'viem'
import { modalOverlay, modalContent } from '@/lib/animations'

export function FollowModal() {
  const closeFollowModal = useUIStore((s) => s.closeFollowModal)
  const selectedLeader = useUIStore((s) => s.selectedLeader)
  const selectedLeaderDisplay = useUIStore((s) => s.selectedLeaderDisplay)
  const { isConnected, address } = useWallet()

  // Check if already following this leader
  const { data: positionData } = useReadContract({
    address: contracts.followerVault,
    abi: FollowerVaultAbi,
    functionName: 'getPosition',
    args: address && selectedLeader ? [address, selectedLeader] : undefined,
    query: { enabled: !!address && !!selectedLeader },
  })
  const alreadyFollowing = !!(positionData as { active?: boolean } | undefined)?.active

  const [depositAmount, setDepositAmount] = useState('20')
  const [maxPerTrade, setMaxPerTrade] = useState('10')
  const [slippage, setSlippage] = useState('1')
  const [stopLoss, setStopLoss] = useState('15')

  const { follow, isPending: followPending, isConfirming: followConfirming, isSuccess: followSuccess, error: followError } = useFollow()

  // Approve STT (base token) for FollowerVault
  const {
    approve,
    isPending: approvePending,
    isConfirming: approveConfirming,
    isSuccess: approveSuccess,
    needsApproval,
  } = useApproveToken(contracts.sttToken, contracts.followerVault)

  const amount = (() => {
    try { return depositAmount && Number(depositAmount) > 0 ? parseEther(depositAmount) : 0n }
    catch { return 0n }
  })()
  const requiresApproval = needsApproval(amount) && !approveSuccess

  // Auto-close modal after successful follow
  useEffect(() => {
    if (followSuccess) {
      const timer = setTimeout(closeFollowModal, 2000)
      return () => clearTimeout(timer)
    }
  }, [followSuccess, closeFollowModal])

  const handleSubmit = () => {
    if (!selectedLeader || !isConnected || alreadyFollowing) return
    if (!depositAmount || Number(depositAmount) <= 0) return

    if (requiresApproval) {
      approve()
      return
    }

    follow({
      leader: selectedLeader,
      amount: depositAmount,
      maxPerTrade,
      slippageBps: Math.round(Number(slippage) * 100),
      stopLoss,
    })
  }

  const isLoading = followPending || followConfirming || approvePending || approveConfirming

  const buttonText = () => {
    if (approvePending) return 'Confirm approval in wallet...'
    if (approveConfirming) return 'Approving...'
    if (requiresApproval && !approveSuccess) return 'Approve STT'
    if (followPending) return 'Confirm in wallet...'
    if (followConfirming) return 'Following...'
    if (followSuccess) return 'Followed!'
    return 'Confirm & Follow'
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeFollowModal}
        />

        {/* Modal card */}
        <motion.div
          className="relative w-[calc(100vw-2rem)] sm:w-[480px] bg-white rounded-xl shadow-xl border border-border p-6 sm:p-10"
          variants={modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-text-faint hover:text-secondary transition-colors cursor-pointer"
            onClick={closeFollowModal}
          >
            <X size={18} />
          </button>

          {/* Title */}
          <h2 className="font-bold text-2xl">Follow {selectedLeaderDisplay || '...'}</h2>
          <p className="text-sm text-text-muted mt-1 mb-8">
            Configure your mirror position
          </p>

          {/* Deposit Amount */}
          <div className="mb-5">
            <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Deposit Amount (STT)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full border border-border-strong rounded-lg px-4 py-3.5 text-sm outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Max Per Trade + Slippage */}
          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
                Max Per Trade (STT)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={maxPerTrade}
                onChange={(e) => setMaxPerTrade(e.target.value)}
                className="w-full border border-border-strong rounded-lg px-4 py-3.5 text-sm outline-none focus:border-secondary transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
                Slippage %
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-full border border-border-strong rounded-lg px-4 py-3.5 text-sm outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>

          {/* Stop-Loss Threshold */}
          <div className="mb-8">
            <label className="block text-xs text-text-muted uppercase tracking-wider font-medium mb-2">
              Stop-Loss (STT)
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full border border-border-strong rounded-lg px-4 py-3.5 text-sm outline-none focus:border-secondary transition-colors"
            />
          </div>

          {/* Already following warning */}
          {alreadyFollowing && (
            <div className="flex items-center gap-2 bg-warning/10 text-warning rounded-lg px-4 py-3 mb-4">
              <AlertTriangle size={14} />
              <span className="text-xs font-medium">You are already following this leader. Unfollow first from the Trade page.</span>
            </div>
          )}

          {/* Error */}
          {followError && !alreadyFollowing && (
            <p className="text-xs text-danger mb-4">
              {(followError as any)?.shortMessage || followError.message}
            </p>
          )}

          {/* Success */}
          {followSuccess && (
            <p className="text-xs text-success mb-4 font-medium">
              Position opened! Your trades will now mirror this leader.
            </p>
          )}

          {/* Confirm button */}
          <button
            className="bg-secondary text-white rounded-lg w-full py-4 font-semibold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={handleSubmit}
            disabled={isLoading || followSuccess || alreadyFollowing || !isConnected || !depositAmount || Number(depositAmount) <= 0}
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {alreadyFollowing ? 'Already Following' : buttonText()}
          </button>

          {!isConnected && (
            <p className="text-xs text-text-muted text-center mt-3">
              Connect your wallet to follow
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
