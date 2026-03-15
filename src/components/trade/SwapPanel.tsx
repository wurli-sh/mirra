import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Wallet, ArrowDownUp, Loader2, AlertTriangle } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { TokenSelector } from './TokenSelector'
import { useSwap, useAmountOut } from '@/hooks/useSwap'
import { useApproveToken } from '@/hooks/useApproveToken'
import { useWallet } from '@/hooks/useWallet'
import { contracts } from '@/config/contracts'
import { parseEther } from 'viem'

const TOKENS = [
  { symbol: 'STT', address: contracts.sttToken },
  { symbol: 'USDC', address: contracts.usdcToken },
  { symbol: 'WETH', address: contracts.wethToken },
] as const

// Only STT↔USDC and STT↔WETH have liquidity on SimpleDEX.
// USDC↔WETH has no pool — every valid swap must go through STT.
const VALID_PAIRS: Record<string, string[]> = {
  STT: ['USDC', 'WETH'],
  USDC: ['STT'],
  WETH: ['STT'],
}

function isPairValid(sell: string, buy: string): boolean {
  return VALID_PAIRS[sell]?.includes(buy) ?? false
}

export function SwapPanel() {
  const { isConnected } = useWallet()
  const [sellAmount, setSellAmount] = useState('250')
  const [sellTokenIdx, setSellTokenIdx] = useState(0) // STT
  const [buyTokenIdx, setBuyTokenIdx] = useState(1)   // USDC

  const sellToken = TOKENS[sellTokenIdx]
  const buyToken = TOKENS[buyTokenIdx]
  const pairValid = isPairValid(sellToken.symbol, buyToken.symbol)

  const { amountOut, isLoading: quoteLoading } = useAmountOut(
    pairValid ? sellToken.address : undefined,
    pairValid ? buyToken.address : undefined,
    sellAmount,
  )

  const { swap, isPending, isConfirming, isSuccess, error, reset } = useSwap()

  const {
    approve,
    isPending: approvePending,
    isConfirming: approveConfirming,
    isSuccess: approveSuccess,
    needsApproval,
  } = useApproveToken(sellToken.address, contracts.simpleDex)

  const amount = (() => {
    try { return sellAmount && Number(sellAmount) > 0 ? parseEther(sellAmount) : 0n }
    catch { return 0n }
  })()
  const requiresApproval = needsApproval(amount) && !approveSuccess

  const minAmountOut = useMemo(() => {
    if (!amountOut || Number(amountOut) === 0) return '0'
    return (Number(amountOut) * 0.995).toString()
  }, [amountOut])

  const priceImpact = amountOut && Number(sellAmount) > 0
    ? Math.abs((Number(amountOut) / Number(sellAmount) - 1) * 100).toFixed(2)
    : '0.00'

  // Get valid buy tokens for current sell selection
  const validBuySymbols = VALID_PAIRS[sellToken.symbol] ?? []

  const handleFlip = () => {
    // Only flip if the reversed pair is also valid
    if (!isPairValid(buyToken.symbol, sellToken.symbol)) return
    setSellTokenIdx(buyTokenIdx)
    setBuyTokenIdx(sellTokenIdx)
    setSellAmount(amountOut || '')
    reset()
  }

  const handleSwap = () => {
    if (!pairValid) return

    if (requiresApproval) {
      approve()
      return
    }

    swap({
      tokenIn: sellToken.address,
      tokenOut: buyToken.address,
      amountIn: sellAmount,
      minAmountOut,
    })
  }

  const isLoading = isPending || isConfirming || approvePending || approveConfirming

  const buttonText = () => {
    if (!isConnected) return 'Connect Wallet'
    if (!pairValid) return 'No liquidity for this pair'
    if (approvePending) return 'Confirm approval...'
    if (approveConfirming) return 'Approving...'
    if (requiresApproval && !approveSuccess) return `Approve ${sellToken.symbol}`
    if (isPending) return 'Confirm swap...'
    if (isConfirming) return 'Swapping...'
    if (isSuccess) return 'Swapped!'
    return 'Swap & Mirror'
  }

  const handleSellTokenChange = (symbol: string) => {
    const idx = TOKENS.findIndex((t) => t.symbol === symbol)
    if (idx < 0 || idx === sellTokenIdx) return
    setSellTokenIdx(idx)
    reset()

    // Auto-fix buy side if new pair is invalid
    const newValidBuys = VALID_PAIRS[symbol] ?? []
    if (!newValidBuys.includes(buyToken.symbol)) {
      const fallback = TOKENS.findIndex((t) => t.symbol === newValidBuys[0])
      if (fallback >= 0) setBuyTokenIdx(fallback)
    }
  }

  const handleBuyTokenChange = (symbol: string) => {
    const idx = TOKENS.findIndex((t) => t.symbol === symbol)
    if (idx < 0 || idx === buyTokenIdx) return
    setBuyTokenIdx(idx)
    reset()
  }

  return (
    <div className="bg-surface rounded-2xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-secondary" />
          <span className="font-bold text-base text-secondary">Swap</span>
        </div>
        <Badge>Leader</Badge>
      </div>

      {/* Sell section */}
      <div>
        <div className="text-xs text-text-faint uppercase tracking-widest mb-2">You sell</div>
        <div className="bg-white rounded-xl p-3.5 flex items-center justify-between">
          <input
            type="text"
            value={sellAmount}
            onChange={(e) => { setSellAmount(e.target.value); reset() }}
            className="font-semibold text-xl text-secondary bg-transparent outline-none w-full mr-3"
            placeholder="0"
          />
          <TokenSelector
            token={sellToken.symbol}
            tokens={TOKENS.map((t) => t.symbol)}
            onChange={handleSellTokenChange}
          />
        </div>
      </div>

      {/* Swap icon */}
      <div className="flex justify-center">
        <motion.button
          className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center cursor-pointer disabled:opacity-30"
          onClick={handleFlip}
          disabled={!isPairValid(buyToken.symbol, sellToken.symbol)}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          <ArrowDownUp size={16} className="text-secondary" />
        </motion.button>
      </div>

      {/* Receive section */}
      <div>
        <div className="text-xs text-text-faint uppercase tracking-widest mb-2">You receive</div>
        <div className="bg-white rounded-xl p-3.5 flex items-center justify-between">
          <span className="font-semibold text-xl text-text-muted">
            {!pairValid ? '—' : quoteLoading ? '...' : amountOut ? `~${Number(amountOut).toFixed(2)}` : '0'}
          </span>
          <TokenSelector
            token={buyToken.symbol}
            tokens={validBuySymbols}
            onChange={handleBuyTokenChange}
          />
        </div>
      </div>

      {/* No liquidity warning */}
      {!pairValid && (
        <div className="flex items-center gap-2 bg-warning/10 text-warning rounded-xl px-3.5 py-2.5">
          <AlertTriangle size={14} />
          <span className="text-xs font-medium">
            No liquidity pool for {sellToken.symbol} → {buyToken.symbol}. All swaps must go through STT.
          </span>
        </div>
      )}

      {/* Details */}
      {pairValid && (
        <div className="bg-white/60 rounded-xl p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-faint">Price impact</span>
            <span className="text-xs font-medium text-secondary">{priceImpact}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-faint">Min. output</span>
            <span className="text-xs font-medium text-secondary">
              {Number(minAmountOut).toFixed(2)} {buyToken.symbol}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-danger">
          {(error as any)?.shortMessage || error.message}
        </p>
      )}

      {/* Button */}
      <motion.button
        className="relative z-10 bg-secondary text-white rounded-2xl py-5 w-full font-bold text-lg text-center cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5 tracking-tight"
        onClick={handleSwap}
        disabled={isLoading || !sellAmount || Number(sellAmount) <= 0 || !pairValid}
        whileHover={{ scale: 1.04, zIndex: 20 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {isLoading && <Loader2 size={16} className="animate-spin" />}
        {buttonText()}
      </motion.button>

      {/* Disclaimer */}
      <p className="text-xs text-text-faint text-center">
        Followers will automatically mirror this trade
      </p>
    </div>
  )
}
