import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ShieldOff, Loader2, X } from 'lucide-react'
import { modalOverlay, modalContent } from '@/lib/animations'
import { useRegisterLeader, useDeregisterLeader } from '@/hooks/useRegisterLeader'

interface Props {
  mode: 'register' | 'deregister'
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function LeaderModal({ mode, open, onClose, onSuccess }: Props) {
  const [stakeAmount, setStakeAmount] = useState('10')
  const { register, isPending: regPending, isConfirming: regConfirming, isSuccess: regSuccess, error: regError } = useRegisterLeader()
  const { deregister, isPending: deregPending, isConfirming: deregConfirming, isSuccess: deregSuccess, error: deregError } = useDeregisterLeader()

  const isRegister = mode === 'register'
  const loading = isRegister ? (regPending || regConfirming) : (deregPending || deregConfirming)
  const success = isRegister ? regSuccess : deregSuccess
  const error = isRegister ? regError : deregError

  useEffect(() => {
    if (success) {
      onSuccess?.()
      const t = setTimeout(onClose, 1500)
      return () => clearTimeout(t)
    }
  }, [success, onClose, onSuccess])

  const handleSubmit = () => {
    if (isRegister) {
      register(stakeAmount)
    } else {
      deregister()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            variants={modalOverlay}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          <motion.div
            className="relative w-[calc(100vw-2rem)] sm:w-[420px] bg-white rounded-xl shadow-xl border border-border overflow-hidden"
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center ${isRegister ? 'bg-primary/20' : 'bg-danger/10'}`}>
                  {isRegister
                    ? <Shield size={18} className="text-[#c4389a]" />
                    : <ShieldOff size={18} className="text-danger" />
                  }
                </div>
                <div>
                  <h2 className="font-bold text-lg">{isRegister ? 'Become a Leader' : 'Deregister Leader'}</h2>
                  <p className="text-xs text-text-muted">
                    {isRegister ? 'Stake STT to let others mirror you' : 'Unstake your STT and stop leading'}
                  </p>
                </div>
              </div>
              <button
                className="text-text-faint hover:text-secondary transition-colors cursor-pointer p-1"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-6 pb-6">
              {isRegister ? (
                <>
                  {/* Stake input */}
                  <label className="block text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">
                    Stake Amount (STT)
                  </label>
                  <div className="flex items-center border border-border-strong rounded-lg px-4 py-3 mb-1 focus-within:border-primary/50 transition-colors">
                    <input
                      type="text"
                      value={stakeAmount}
                      onChange={(e) => {
                        let v = e.target.value.replace(/[^0-9.]/g, '')
                        const dot = v.indexOf('.')
                        if (dot >= 0) v = v.slice(0, dot + 5)
                        setStakeAmount(v)
                      }}
                      className="flex-1 text-lg font-semibold bg-transparent outline-none text-text"
                    />
                    <span className="text-sm text-text-muted font-medium">STT</span>
                  </div>
                  <p className="text-[10px] text-text-faint mb-5">Minimum stake: 10 STT</p>

                  {/* Benefits */}
                  <div className="bg-surface rounded-lg p-3.5 mb-5 space-y-2">
                    {[
                      { l: 'Your trades will be', v: 'Auto-mirrored' },
                      { l: 'Earn fees from', v: 'Follower positions' },
                      { l: 'Stake returned on', v: 'Deregister' },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">{l}</span>
                        <span className="font-semibold text-text">{v}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Deregister info */}
                  <div className="bg-surface rounded-lg p-4 mb-5 space-y-2.5">
                    {[
                      { l: 'Followers will be', v: 'Disconnected' },
                      { l: 'Staked STT', v: 'Returned to you' },
                      { l: 'Leader score', v: 'Reset' },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">{l}</span>
                        <span className="font-semibold text-text">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-warning/10 text-warning rounded-lg px-3.5 py-2.5 mb-5">
                    <ShieldOff size={14} className="shrink-0" />
                    <span className="text-xs font-medium">This will stop all mirroring for your followers.</span>
                  </div>
                </>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-danger mb-3">
                  {(error as any)?.shortMessage || error.message}
                </p>
              )}

              {/* Success */}
              {success && (
                <p className="text-xs text-success mb-3 font-medium">
                  {isRegister ? 'Registered as leader!' : 'Deregistered successfully!'}
                </p>
              )}

              {/* Submit */}
              <motion.button
                className={`w-full rounded-lg py-3.5 font-semibold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isRegister
                    ? 'bg-secondary text-primary'
                    : 'bg-red-800/90 text-white'
                }`}
                onClick={handleSubmit}
                disabled={loading || success || (isRegister && (!stakeAmount || Number(stakeAmount) < 10))}
                whileTap={{ scale: 0.97 }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {isRegister
                  ? (loading ? 'Staking...' : success ? 'Registered!' : `Stake ${stakeAmount || '10'} STT & Register`)
                  : (loading ? 'Deregistering...' : success ? 'Done!' : 'Confirm Deregister')
                }
              </motion.button>

              {isRegister && Number(stakeAmount) > 0 && Number(stakeAmount) < 10 && (
                <p className="text-[10px] text-danger text-center mt-2">Minimum stake is 10 STT</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
