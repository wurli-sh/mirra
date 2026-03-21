import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Key, Send, CheckCircle, X, Loader2, AlertTriangle, Shield, Sparkles, Fuel } from 'lucide-react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useSignMessage, useWriteContract } from 'wagmi'
import { parseEther, type Address } from 'viem'
import { TextShimmer } from '@/components/ui/TextShimmer'
import { OniAvatar } from '@/components/ui/OniAvatar'
import { useSessionStore } from '@/stores/session'
import { registerSession } from '@/lib/session-key'
import { contracts } from '@/config/contracts'
import { ERC20Abi } from '@/config/abi/ERC20'
import { modalOverlay, modalContent } from '@/lib/animations'

interface Props {
  open: boolean
  onComplete: () => void
  onSkip: () => void
  onActivating?: () => void
}

type Step = 'welcome' | 'signing' | 'funding' | 'gas' | 'done'

const STEPS = [
  { key: 'welcome', label: 'Setup' },
  { key: 'signing', label: 'Verify' },
  { key: 'funding', label: 'Fund' },
  { key: 'gas', label: 'Gas' },
]

export function ActivateAgentModal({ open, onComplete, onSkip, onActivating }: Props) {
  const { address } = useAccount()
  const setSession = useSessionStore((s) => s.setSession)
  const { signMessageAsync } = useSignMessage()

  const [step, setStep] = useState<Step>('welcome')
  const [sessionKeyAddr, setSessionKeyAddr] = useState<Address | null>(null)
  const [fundAmount, setFundAmount] = useState('10')
  const [error, setError] = useState('')

  // ERC-20 STT transfer for trading capital
  const { writeContract: transferTokens, data: transferHash, isPending: transferPending, error: transferError } = useWriteContract()
  const { isLoading: transferConfirming, isSuccess: transferSuccess } = useWaitForTransactionReceipt({ hash: transferHash })

  // Native STT send for gas
  const { sendTransaction: sendGas, data: gasHash, isPending: gasPending } = useSendTransaction()
  const { isLoading: gasConfirming, isSuccess: gasSuccess } = useWaitForTransactionReceipt({ hash: gasHash })

  // Auto-advance: funding done → gas step
  useEffect(() => {
    if (transferSuccess && step === 'funding') {
      setTimeout(() => setStep('gas'), 400)
    }
  }, [transferSuccess, step])

  // Auto-advance: gas done → done step
  useEffect(() => {
    if (gasSuccess && step === 'gas') {
      setTimeout(() => setStep('done'), 400)
    }
  }, [gasSuccess, step])

  const handleActivate = async () => {
    if (!address) return
    setStep('signing')
    setError('')
    onActivating?.()
    try {
      const { sessionKeyAddress, expiresAt } = await registerSession(address, signMessageAsync)
      setSessionKeyAddr(sessionKeyAddress)
      setSession(sessionKeyAddress, expiresAt)
      setTimeout(() => setStep('funding'), 500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to activate'
      setError(msg.includes('User rejected') || msg.includes('denied') ? 'Signature rejected. Try again.' : msg)
      setStep('welcome')
    }
  }

  const handleTransferTokens = () => {
    if (!sessionKeyAddr) return
    const val = parseFloat(fundAmount)
    if (!isFinite(val) || val <= 0 || val > 100) return
    setError('')
    transferTokens({
      address: contracts.sttToken,
      abi: ERC20Abi,
      functionName: 'transfer',
      args: [sessionKeyAddr, parseEther(val.toString())],
    })
  }

  const handleSendGas = () => {
    if (!sessionKeyAddr) return
    setError('')
    sendGas({ to: sessionKeyAddr, value: parseEther('0.5') })
  }

  const stepIdx = STEPS.findIndex(s => s.key === step)

  if (!open) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="absolute inset-0 bg-secondary/30 backdrop-blur-sm"
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onSkip}
        />

        <motion.div
          className="relative w-full max-w-[420px] bg-white rounded-xl shadow-2xl border border-border overflow-hidden"
          variants={modalContent}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label="Activate Oni Agent"
        >
          <button
            onClick={onSkip}
            className="absolute top-3.5 right-3.5 size-7 rounded-md bg-surface hover:bg-surface-alt flex items-center justify-center text-text-faint hover:text-secondary transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          {/* Step indicator */}
          {step !== 'done' && (
            <div className="flex items-center gap-2 px-6 pt-5 pb-1">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex-1 h-[3px] rounded-full overflow-hidden bg-surface-alt">
                  <motion.div
                    className="h-full rounded-full bg-secondary"
                    initial={{ width: '0%' }}
                    animate={{ width: i < stepIdx ? '100%' : i === stepIdx ? '50%' : '0%' }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="px-6 pt-4 pb-6">
            <AnimatePresence mode="wait">

              {/* ── Welcome ── */}
              {step === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <OniAvatar size="md" bare />
                    <div>
                      <h2 className="text-lg font-bold text-secondary leading-tight">Activate Oni Agent</h2>
                      <p className="text-xs text-text-muted mt-0.5">Autonomous on-chain execution</p>
                    </div>
                  </div>

                  <p className="text-sm text-text-muted mb-5 leading-relaxed">
                    Oni will execute swaps, follows, and more <strong className="text-text">instantly</strong> — no wallet popups, no confirm buttons.
                  </p>

                  <div className="bg-surface rounded-lg p-4 space-y-3 mb-5">
                    {[
                      { icon: Key, label: 'Temporary session wallet', detail: 'Expires in 30 min' },
                      { icon: Zap, label: 'Instant execution', detail: 'Swaps, follows, deposits' },
                      { icon: Shield, label: 'Spending cap: 50 STT', detail: 'Auto-approvals included' },
                    ].map(({ icon: Icon, label, detail }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="size-8 rounded-md bg-primary/30 flex items-center justify-center shrink-0">
                          <Icon size={14} className="text-[#c4389a]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-text block leading-tight">{label}</span>
                          <span className="text-xs text-text-faint">{detail}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-md px-3 py-2 mb-3">
                      <AlertTriangle size={13} />
                      <span className="text-xs">{error}</span>
                    </div>
                  )}

                  <motion.button
                    onClick={handleActivate}
                    className="w-full bg-secondary text-white rounded-lg py-3 font-semibold text-sm cursor-pointer flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                  >
                    <Sparkles size={14} />
                    Activate
                  </motion.button>
                  <button
                    onClick={onSkip}
                    className="w-full text-sm text-text-faint mt-2.5 py-1.5 cursor-pointer hover:text-text-muted transition-colors"
                  >
                    Skip — use manual confirmation
                  </button>
                </motion.div>
              )}

              {/* ── Signing ── */}
              {step === 'signing' && (
                <motion.div
                  key="signing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center py-14"
                >
                  <div className="relative mb-5">
                    <OniAvatar size="md" bare />
                    <motion.div
                      className="absolute -bottom-1 -right-1 size-5 rounded-full bg-primary flex items-center justify-center"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Key size={10} className="text-[#c4389a]" />
                    </motion.div>
                  </div>
                  <TextShimmer className="text-base font-semibold text-text-muted" active>
                    Sign in your wallet...
                  </TextShimmer>
                  <p className="text-sm text-text-faint mt-2">No gas fee — just a signature to verify ownership</p>
                </motion.div>
              )}

              {/* ── Fund: ERC-20 STT transfer ── */}
              {step === 'funding' && sessionKeyAddr && (
                <motion.div
                  key="funding"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="size-10 rounded-lg bg-primary/25 flex items-center justify-center">
                      <Send size={16} className="text-[#c4389a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary leading-tight">Transfer Trading Capital</h3>
                      <p className="text-xs text-text-muted">Send STT tokens to your session wallet</p>
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg px-3.5 py-3 mb-4">
                    <span className="text-xs text-text-faint uppercase tracking-wider block mb-1">Session address</span>
                    <span className="text-xs font-mono text-text break-all leading-relaxed">{sessionKeyAddr}</span>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs text-text-muted font-medium mb-1.5">STT amount to trade with</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="any"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      className="w-full border border-border-strong rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-secondary transition-colors"
                    />
                    <p className="text-xs text-text-faint mt-1">ERC-20 STT tokens for swaps and follows. Next step sends gas.</p>
                  </div>

                  {(error || transferError) && (
                    <div className="flex items-center gap-2 bg-danger/10 text-danger rounded-md px-3 py-2 mb-3">
                      <AlertTriangle size={13} />
                      <span className="text-xs">{error || 'Transfer failed. Check your STT balance.'}</span>
                    </div>
                  )}

                  <motion.button
                    onClick={handleTransferTokens}
                    disabled={transferPending || transferConfirming || transferSuccess}
                    className="w-full bg-secondary text-white rounded-lg py-3 font-semibold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                  >
                    {(transferPending || transferConfirming) && <Loader2 size={14} className="animate-spin" />}
                    {transferPending ? 'Confirm in wallet...' :
                     transferConfirming ? 'Transferring...' :
                     transferSuccess ? 'Transferred!' :
                     `Transfer ${fundAmount} STT`}
                  </motion.button>
                </motion.div>
              )}

              {/* ── Gas: native STT for tx fees ── */}
              {step === 'gas' && sessionKeyAddr && (
                <motion.div
                  key="gas"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="size-10 rounded-lg bg-primary/25 flex items-center justify-center">
                      <Fuel size={16} className="text-[#c4389a]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary leading-tight">Send Gas</h3>
                      <p className="text-xs text-text-muted">Small native STT for transaction fees</p>
                    </div>
                  </div>

                  <div className="bg-surface rounded-lg px-3.5 py-3 mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">Amount</span>
                      <span className="text-sm font-bold text-text">0.5 STT</span>
                    </div>
                    <p className="text-xs text-text-faint mt-1.5">Covers ~50 transactions on Somnia testnet</p>
                  </div>

                  <motion.button
                    onClick={handleSendGas}
                    disabled={gasPending || gasConfirming || gasSuccess}
                    className="w-full bg-secondary text-white rounded-lg py-3 font-semibold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.97 }}
                  >
                    {(gasPending || gasConfirming) && <Loader2 size={14} className="animate-spin" />}
                    {gasPending ? 'Confirm in wallet...' :
                     gasConfirming ? 'Sending...' :
                     gasSuccess ? 'Sent!' :
                     'Send 0.5 STT for gas'}
                  </motion.button>
                </motion.div>
              )}

              {/* ── Done ── */}
              {step === 'done' && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="size-14 rounded-xl bg-success/10 flex items-center justify-center mb-4"
                  >
                    <CheckCircle size={28} className="text-success" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-secondary mb-1">Oni is ready!</h3>
                  <p className="text-sm text-text-muted text-center mb-6 max-w-[260px]">
                    Just tell Oni what you need — trades execute instantly.
                  </p>
                  <motion.button
                    onClick={onComplete}
                    className="bg-secondary text-white rounded-lg px-8 py-3 font-semibold text-sm cursor-pointer"
                    whileTap={{ scale: 0.97 }}
                  >
                    Start trading
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
