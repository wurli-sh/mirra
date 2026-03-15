import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ProgressBar } from '../ui/ProgressBar'
import { useDepositMore } from '@/hooks/useDepositMore'
import { useWithdrawPosition } from '@/hooks/useWithdrawPosition'
import { useUnfollow } from '@/hooks/useUnfollow'
import type { Position } from '@/data/types'

interface PositionCardProps {
  position: Position
}

export function PositionCard({ position }: PositionCardProps) {
  const danger = position.stopLossUsed > 70
  const positive = position.pnl >= 0

  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [inputAmount, setInputAmount] = useState('')

  const { deposit, isPending: depositPending, isConfirming: depositConfirming } = useDepositMore()
  const { withdraw, isPending: withdrawPending, isConfirming: withdrawConfirming } = useWithdrawPosition()
  const { unfollow, isPending: unfollowPending, isConfirming: unfollowConfirming } = useUnfollow()

  const leaderAddr = position.fullLeaderAddress

  const handleDeposit = () => {
    if (!inputAmount) return
    deposit(leaderAddr, inputAmount)
    setInputAmount('')
    setShowDeposit(false)
  }

  const handleWithdraw = () => {
    if (!inputAmount) return
    withdraw(leaderAddr, inputAmount)
    setInputAmount('')
    setShowWithdraw(false)
  }

  const handleUnfollow = () => {
    unfollow(leaderAddr)
  }

  const anyLoading = depositPending || depositConfirming || withdrawPending || withdrawConfirming || unfollowPending || unfollowConfirming

  return (
    <div className={cn('p-4 border-b border-border/60', danger && 'bg-danger/[0.02]')}>
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
              danger ? 'bg-danger/10 text-danger' : 'bg-primary text-secondary'
            )}
          >
            {position.rank}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-secondary">{position.leader}</span>
            <span className="text-xs text-text-faint">
              Score {position.score} · Rank #{position.rank}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span
            className={cn(
              'font-bold text-xl tracking-tight',
              positive ? 'text-success' : 'text-danger'
            )}
          >
            {positive
              ? `+$${Math.abs(position.pnl).toFixed(2)}`
              : `-$${Math.abs(position.pnl).toFixed(2)}`}
          </span>
          {danger ? (
            <span className="text-xs text-danger font-medium">
              {position.stopLossUsed}% of stop-loss
            </span>
          ) : (
            <span
              className={cn(
                'text-xs',
                positive ? 'text-success/70' : 'text-danger/70'
              )}
            >
              {positive ? '+' : ''}{position.pnlPercent}% unrealized
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 mt-3">
        <div>
          <div className="text-xs text-text-faint uppercase tracking-wider">Deposited</div>
          <div className="font-semibold text-xs text-secondary mt-0.5">
            {position.deposited} {position.token}
          </div>
        </div>
        <div>
          <div className="text-xs text-text-faint uppercase tracking-wider">Max/Trade</div>
          <div className="font-semibold text-xs text-secondary mt-0.5">{position.maxPerTrade}</div>
        </div>
        <div>
          <div className="text-xs text-text-faint uppercase tracking-wider">Slippage</div>
          <div className="font-semibold text-xs text-secondary mt-0.5">{position.slippage}%</div>
        </div>
        <div>
          <div className="text-xs text-text-faint uppercase tracking-wider">Stop-Loss</div>
          <div className={cn('font-semibold text-xs mt-0.5', danger ? 'text-danger' : 'text-secondary')}>
            {position.stopLoss} STT
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-faint">Stop-loss threshold</span>
          <span className="text-xs text-text-faint">
            {position.stopLossUsed}% of {position.stopLoss} STT
          </span>
        </div>
        <ProgressBar
          value={position.stopLossUsed}
          max={100}
          color={danger ? 'danger' : 'success'}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <motion.button
          className="flex items-center gap-1.5 bg-primary text-secondary px-4 py-2 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
          onClick={() => { setShowDeposit(!showDeposit); setShowWithdraw(false) }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={anyLoading}
        >
          {depositPending || depositConfirming ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Deposit
        </motion.button>
        <motion.button
          className="flex items-center gap-1.5 border border-border-strong text-text-muted px-4 py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50"
          onClick={() => { setShowWithdraw(!showWithdraw); setShowDeposit(false) }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={anyLoading}
        >
          {withdrawPending || withdrawConfirming ? <Loader2 size={12} className="animate-spin" /> : <Minus size={12} />}
          Withdraw
        </motion.button>
        <motion.button
          className="flex items-center gap-1.5 border border-danger/20 text-danger px-4 py-2 rounded-lg text-xs cursor-pointer disabled:opacity-50"
          onClick={handleUnfollow}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={anyLoading}
        >
          {unfollowPending || unfollowConfirming ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
          Unfollow
        </motion.button>
      </div>

      {/* Inline deposit/withdraw input */}
      <AnimatePresence>
        {(showDeposit || showWithdraw) && (
          <motion.div
            className="flex items-center gap-2 mt-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <input
              type="text"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder={`Amount (${position.token})`}
              className="flex-1 border border-border-strong rounded-lg px-3 py-2 text-xs outline-none focus:border-secondary"
            />
            <button
              className="bg-secondary text-white px-4 py-2 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-50"
              onClick={showDeposit ? handleDeposit : handleWithdraw}
              disabled={!inputAmount || anyLoading}
            >
              {showDeposit ? 'Deposit' : 'Withdraw'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
