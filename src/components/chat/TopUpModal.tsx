import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Send, Coins } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { useSessionStore } from '@/stores/session'
import { contracts } from '@/config/contracts'
import { ERC20Abi } from '@/config/abi/ERC20'
import { modalOverlay, modalContent } from '@/lib/animations'

interface Props {
  open: boolean
  onClose: () => void
}

export function TopUpModal({ open, onClose }: Props) {
  const sessionKeyAddress = useSessionStore((s) => s.sessionKeyAddress)
  const [amount, setAmount] = useState('10')

  const { writeContract, data: hash, isPending, error: txError, reset } = useWriteContract()
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleTransfer = () => {
    if (!sessionKeyAddress) return
    const val = parseFloat(amount)
    if (!isFinite(val) || val <= 0 || val > 100) return
    writeContract({
      address: contracts.sttToken,
      abi: ERC20Abi,
      functionName: 'transfer',
      args: [sessionKeyAddress, parseEther(val.toString())],
    })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!open || !sessionKeyAddress) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="absolute inset-0 bg-secondary/30 backdrop-blur-sm"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        />
        <motion.div
          className="relative w-full max-w-[380px] bg-white rounded-xl shadow-2xl border border-border overflow-hidden"
          variants={modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-3 right-3 size-7 rounded-md bg-surface hover:bg-surface-alt flex items-center justify-center text-text-faint hover:text-secondary transition-colors cursor-pointer z-10"
          >
            <X size={14} />
          </button>

          <div className="px-6 pt-5 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-10 rounded-lg bg-primary/25 flex items-center justify-center">
                <Coins size={16} className="text-[#c4389a]" />
              </div>
              <div>
                <h3 className="font-bold text-secondary leading-tight">Top Up Session</h3>
                <p className="text-xs text-text-muted">Send more STT tokens to trade</p>
              </div>
            </div>

            <div className="bg-surface rounded-lg px-3.5 py-2.5 mb-4">
              <span className="text-xs text-text-faint uppercase tracking-wider block mb-0.5">Session wallet</span>
              <span className="text-xs font-mono text-text break-all">{sessionKeyAddress}</span>
            </div>

            {isSuccess ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium text-success mb-3">Tokens transferred!</p>
                <button
                  onClick={handleClose}
                  className="text-xs text-text-muted hover:text-secondary cursor-pointer underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs text-text-muted font-medium mb-1.5">STT amount</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-border-strong rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-secondary transition-colors"
                  />
                </div>

                {txError && (
                  <p className="text-xs text-danger mb-3">Transfer failed. Check your STT balance.</p>
                )}

                <motion.button
                  onClick={handleTransfer}
                  disabled={isPending || confirming}
                  className="w-full bg-secondary text-white rounded-lg py-3 font-semibold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.97 }}
                >
                  {(isPending || confirming) && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? 'Confirm in wallet...' :
                   confirming ? 'Transferring...' :
                   `Transfer ${amount} STT`}
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
