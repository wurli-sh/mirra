import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther, maxUint256, type Address, type Hash } from 'viem'
import { toast } from 'sonner'
import {
  ArrowRightLeft, UserPlus, UserMinus, ArrowDownToLine, ArrowUpFromLine,
  Shield, ShieldOff, Coins, Check as CheckIcon, ExternalLink, Loader2, BadgeCheck,
  Wallet, RotateCcw, TrendingUp,
} from 'lucide-react'
import { TextShimmer } from '@/components/ui/TextShimmer'
import { contracts } from '@/config/contracts'
import { SimpleDEXAbi } from '@/config/abi/SimpleDEX'
import { FollowerVaultAbi } from '@/config/abi/FollowerVault'
import { LeaderRegistryAbi } from '@/config/abi/LeaderRegistry'
import { ERC20Abi } from '@/config/abi/ERC20'

export type ActionType = 'swap' | 'follow' | 'unfollow' | 'deposit' | 'withdraw' | 'register' | 'deregister' | 'claimFees' | 'approve'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionCardData = { type: ActionType } & Record<string, any>

interface Props {
  data: ActionCardData
  onQuickAction?: (text: string) => void
}

const ACTION_CONFIG: Record<ActionType, { icon: typeof ArrowRightLeft; label: string; desc: string }> = {
  swap: { icon: ArrowRightLeft, label: 'Swap', desc: 'Trade tokens on SimpleDEX' },
  follow: { icon: UserPlus, label: 'Follow Leader', desc: 'Mirror trades automatically' },
  unfollow: { icon: UserMinus, label: 'Unfollow', desc: 'Stop mirroring this leader' },
  deposit: { icon: ArrowDownToLine, label: 'Deposit More', desc: 'Add to your follow position' },
  withdraw: { icon: ArrowUpFromLine, label: 'Withdraw', desc: 'Pull STT from your position' },
  register: { icon: Shield, label: 'Register as Leader', desc: 'Stake STT and let others mirror you' },
  deregister: { icon: ShieldOff, label: 'Deregister Leader', desc: 'Unstake and stop leading' },
  claimFees: { icon: Coins, label: 'Claim Fees', desc: 'Collect your earned leader fees' },
  approve: { icon: BadgeCheck, label: 'Approve Token', desc: 'Allow contract to spend your tokens' },
}

type FollowUp = { icon: typeof ArrowRightLeft; label: string; text: string }

const FOLLOW_UPS: Record<ActionType, FollowUp[]> = {
  swap: [
    { icon: RotateCcw, label: 'Swap again', text: 'I want to do another swap' },
    { icon: Wallet, label: 'My balances', text: 'Show my token balances' },
    { icon: TrendingUp, label: 'Top leaders', text: 'Who are the top leaders right now?' },
  ],
  follow: [
    { icon: TrendingUp, label: 'My positions', text: 'Show my follow positions' },
    { icon: UserPlus, label: 'Follow another', text: 'Who else should I follow?' },
  ],
  unfollow: [
    { icon: TrendingUp, label: 'My positions', text: 'Show my follow positions' },
    { icon: UserPlus, label: 'Follow someone', text: 'Who are the top leaders to follow?' },
  ],
  deposit: [
    { icon: TrendingUp, label: 'My positions', text: 'Show my follow positions' },
    { icon: Wallet, label: 'My balances', text: 'Show my token balances' },
  ],
  withdraw: [
    { icon: Wallet, label: 'My balances', text: 'Show my token balances' },
    { icon: ArrowRightLeft, label: 'Swap', text: 'I want to swap some tokens' },
  ],
  register: [
    { icon: TrendingUp, label: 'Leaderboard', text: 'Show the leaderboard' },
    { icon: ArrowRightLeft, label: 'Make a trade', text: 'I want to swap some tokens' },
  ],
  deregister: [
    { icon: Wallet, label: 'My balances', text: 'Show my token balances' },
  ],
  claimFees: [
    { icon: Wallet, label: 'My balances', text: 'Show my token balances' },
    { icon: ArrowRightLeft, label: 'Swap', text: 'I want to swap some tokens' },
  ],
  approve: [
    { icon: UserPlus, label: 'Follow a leader', text: 'Who are the top leaders to follow?' },
    { icon: ArrowDownToLine, label: 'Deposit', text: 'I want to deposit more to my position' },
  ],
}

function truncateAddr(addr: string) {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

// Persist confirmed tx hashes so cards survive tab switches
const TX_STORE_KEY = 'mirra_action_txs'
function getStoredTx(cardKey: string): Hash | undefined {
  try {
    const store = JSON.parse(sessionStorage.getItem(TX_STORE_KEY) ?? '{}')
    return store[cardKey] as Hash | undefined
  } catch { return undefined }
}
function storeTx(cardKey: string, txHash: Hash) {
  try {
    const store = JSON.parse(sessionStorage.getItem(TX_STORE_KEY) ?? '{}')
    store[cardKey] = txHash
    sessionStorage.setItem(TX_STORE_KEY, JSON.stringify(store))
  } catch { /* ignore */ }
}
function makeCardKey(data: ActionCardData): string {
  // Unique enough per action instance
  if (data.type === 'swap') return `swap-${data.tokenIn}-${data.tokenOut}-${data.amountIn}`
  if (data.type === 'follow') return `follow-${data.leader}-${data.amount}`
  if (data.type === 'approve') return `approve-${data.token}-${data.spender}`
  if (data.leader) return `${data.type}-${data.leader}`
  return `${data.type}-${data.stakeAmount ?? ''}`
}

export function ActionCard({ data, onQuickAction }: Props) {
  const { isConnected } = useAccount()
  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })
  const cardKey = useMemo(() => makeCardKey(data), [data])
  const savedTx = useMemo(() => getStoredTx(cardKey), [cardKey])
  const [status, setStatus] = useState<'idle' | 'confirming' | 'success' | 'error'>(savedTx ? 'success' : 'idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [txHash, setTxHash] = useState<Hash | undefined>(savedTx)

  const label = ACTION_CONFIG[data.type]?.label ?? data.type

  useEffect(() => {
    if (isPending) {
      toast.loading(`${label} — waiting for wallet...`, { id: `tx-${data.type}` })
      setStatus('confirming')
    } else if (isConfirming) {
      toast.loading(`${label} — confirming on-chain...`, { id: `tx-${data.type}` })
      setStatus('confirming')
    }
  }, [isPending, isConfirming, label, data.type])

  useEffect(() => {
    if (isSuccess && hash) {
      setTxHash(hash)
      setStatus('success')
      storeTx(cardKey, hash)
      toast.success(`${label} confirmed!`, {
        id: `tx-${data.type}`,
        action: {
          label: 'Explorer',
          onClick: () => window.open(`https://shannon-explorer.somnia.network/tx/${hash}`, '_blank'),
        },
      })
    }
  }, [isSuccess, hash, label, data.type, cardKey])

  useEffect(() => {
    if (writeError) {
      const msg = writeError.message || 'Transaction failed'
      let shortMsg: string
      if (msg.includes('User rejected') || msg.includes('denied')) {
        shortMsg = 'Transaction rejected.'
      } else if (msg.includes('insufficient funds')) {
        shortMsg = 'Insufficient STT for gas.'
      } else {
        shortMsg = msg.slice(0, 120)
      }
      setErrorMsg(shortMsg)
      setStatus('error')
      toast.error(shortMsg, { id: `tx-${data.type}` })
    }
  }, [writeError, data.type])

  const handleConfirm = useCallback(() => {
    if (!isConnected) {
      setErrorMsg('Connect your wallet first.')
      setStatus('error')
      return
    }

    // Validate that any contract/spender addresses in the action data match known contracts
    const knownAddresses = new Set(Object.values(contracts).map(a => a?.toLowerCase()).filter(Boolean))
    for (const key of ['contractAddress', 'spenderAddress', 'tokenInAddress', 'tokenOutAddress', 'tokenAddress'] as const) {
      const addr = data[key] as string | undefined
      if (addr && !knownAddresses.has(addr.toLowerCase())) {
        setErrorMsg(`Unrecognized contract address in action data.`)
        setStatus('error')
        return
      }
    }

    setStatus('confirming')

    try {
    switch (data.type) {
      case 'swap': {
        const amtIn = parseFloat(data.amountIn)
        const estOut = parseFloat(data.estimatedOut)
        if (!isFinite(amtIn) || amtIn <= 0 || !isFinite(estOut) || estOut <= 0) {
          setErrorMsg('Invalid swap amounts.'); setStatus('error'); return
        }
        writeContract({
          address: contracts.simpleDex,
          abi: SimpleDEXAbi,
          functionName: 'swap',
          args: [
            data.tokenInAddress as Address,
            data.tokenOutAddress as Address,
            parseEther(amtIn.toString()),
            parseEther((estOut * 0.95).toString()), // 5% slippage
          ],
        })
        break
      }

      case 'follow': {
        const amt = parseFloat(data.amount)
        const maxPT = parseFloat(data.maxPerTrade)
        const sl = parseFloat(data.stopLoss)
        if (!isFinite(amt) || amt <= 0 || !isFinite(maxPT) || maxPT <= 0 || !isFinite(sl) || sl <= 0) {
          setErrorMsg('Invalid follow parameters.'); setStatus('error'); return
        }
        writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: 'follow',
          args: [
            data.leader as Address,
            parseEther(amt.toString()),
            parseEther(maxPT.toString()),
            data.slippageBps,
            parseEther(sl.toString()),
          ],
        })
        break
      }

      case 'unfollow':
        writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: 'unfollow',
          args: [data.leader as Address],
        })
        break

      case 'deposit':
      case 'withdraw': {
        const dAmt = parseFloat(data.amount)
        if (!isFinite(dAmt) || dAmt <= 0) {
          setErrorMsg('Invalid amount.'); setStatus('error'); return
        }
        writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: data.type === 'deposit' ? 'deposit' : 'withdraw',
          args: [data.leader as Address, parseEther(dAmt.toString())],
        })
        break
      }

      case 'register': {
        const stake = parseFloat(data.stakeAmount)
        if (!isFinite(stake) || stake <= 0) {
          setErrorMsg('Invalid stake amount.'); setStatus('error'); return
        }
        writeContract({
          address: contracts.leaderRegistry,
          abi: LeaderRegistryAbi,
          functionName: 'registerLeader',
          value: parseEther(stake.toString()),
        })
        break
      }

      case 'deregister':
        writeContract({
          address: contracts.leaderRegistry,
          abi: LeaderRegistryAbi,
          functionName: 'deregisterLeader',
        })
        break

      case 'claimFees':
        writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: 'claimFees',
        })
        break

      case 'approve':
        writeContract({
          address: data.tokenAddress as Address,
          abi: ERC20Abi,
          functionName: 'approve',
          args: [data.spenderAddress as Address, maxUint256],
        })
        break
    }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message.slice(0, 120) : 'Failed to build transaction.')
      setStatus('error')
    }
  }, [data, isConnected, writeContract])

  const config = ACTION_CONFIG[data.type] ?? { icon: ArrowRightLeft, label: data.type }
  const Icon = config.icon

  const rate = data.type === 'swap' && Number(data.amountIn) > 0
    ? (Number(data.estimatedOut) / Number(data.amountIn)).toFixed(4)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="border border-primary/30 rounded-xl rounded-tl-sm overflow-hidden max-w-sm my-1"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-primary/20 border-b border-primary/30">
        <div className="size-8 rounded-md bg-primary flex items-center justify-center">
          <Icon size={15} className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-text block leading-tight">
            {config.label}
            {status === 'success' && ' — Done!'}
            {status === 'confirming' && ' — Pending...'}
          </span>
          <span className="text-[11px] text-text-muted">{config.desc}</span>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 bg-surface">
        {data.type === 'swap' && (
          <div className="space-y-3">
            {/* Token flow */}
            <div className="flex items-center gap-3">
              <TokenPill symbol={data.tokenIn} amount={data.amountIn} sublabel="You pay" />
              <div className="flex flex-col items-center gap-0.5 pt-3">
                <ArrowRightLeft size={14} className="text-[#c4389a]" />
              </div>
              <TokenPill symbol={data.tokenOut} amount={Number(data.estimatedOut).toFixed(4)} sublabel="You get" highlight />
            </div>
            {/* Rate + slippage */}
            <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-primary/10">
              <span>Rate: 1 {data.tokenIn} = {rate} {data.tokenOut}</span>
              <span>Slippage: 5%</span>
            </div>
          </div>
        )}
        {data.type === 'follow' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-primary/10 rounded-md px-3 py-2">
              <UserPlus size={13} className="text-[#c4389a] shrink-0" />
              <span className="text-xs font-mono text-text">{truncateAddr(data.leader)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Deposit" value={`${data.amount} STT`} />
              <MiniStat label="Max/Trade" value={`${data.maxPerTrade} STT`} />
              <MiniStat label="Slippage" value={`${(data.slippageBps / 100).toFixed(1)}%`} />
              <MiniStat label="Stop Loss" value={`${data.stopLoss} STT`} />
            </div>
          </div>
        )}
        {data.type === 'unfollow' && (
          <div className="flex items-center gap-2 bg-primary/10 rounded-md px-3 py-2.5">
            <UserMinus size={13} className="text-[#c4389a] shrink-0" />
            <div>
              <span className="text-xs text-text-muted block">Leader</span>
              <span className="text-xs font-mono text-text">{truncateAddr(data.leader)}</span>
            </div>
          </div>
        )}
        {(data.type === 'deposit' || data.type === 'withdraw') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-primary/10 rounded-md px-3 py-2">
              {data.type === 'deposit' ? <ArrowDownToLine size={13} className="text-[#c4389a]" /> : <ArrowUpFromLine size={13} className="text-[#c4389a]" />}
              <span className="text-xs font-mono text-text">{truncateAddr(data.leader)}</span>
            </div>
            <div className="flex items-center justify-between bg-surface-alt rounded-md px-3 py-2.5">
              <span className="text-xs text-text-muted">Amount</span>
              <span className="text-sm font-bold text-text">{data.amount} STT</span>
            </div>
          </div>
        )}
        {data.type === 'register' && (
          <div className="flex items-center justify-between bg-surface-alt rounded-md px-3 py-3">
            <div>
              <span className="text-[11px] text-text-muted block">Stake Amount</span>
              <span className="text-lg font-bold text-text">{data.stakeAmount ?? '10'} STT</span>
            </div>
            <div className="size-10 rounded-lg bg-primary/30 flex items-center justify-center">
              <Shield size={18} className="text-[#c4389a]" />
            </div>
          </div>
        )}
        {data.type === 'deregister' && (
          <div className="flex items-center gap-3 bg-surface-alt rounded-md px-3 py-3">
            <div className="size-10 rounded-lg bg-danger/10 flex items-center justify-center">
              <ShieldOff size={18} className="text-danger" />
            </div>
            <div>
              <span className="text-xs font-medium text-text">Exit leader mode</span>
              <span className="text-[11px] text-text-muted block">Your staked STT will be returned</span>
            </div>
          </div>
        )}
        {data.type === 'claimFees' && (
          <div className="flex items-center gap-3 bg-surface-alt rounded-md px-3 py-3">
            <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center">
              <Coins size={18} className="text-success" />
            </div>
            <div>
              <span className="text-xs font-medium text-text">Collect earned fees</span>
              <span className="text-[11px] text-text-muted block">From followers mirroring your trades</span>
            </div>
          </div>
        )}
        {data.type === 'approve' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-surface-alt rounded-md px-3 py-2.5">
              <span className="text-xs text-text-muted">Token</span>
              <span className="text-xs font-bold text-text bg-primary/20 px-2 py-0.5 rounded-md">{data.token}</span>
            </div>
            <div className="flex items-center justify-between bg-surface-alt rounded-md px-3 py-2.5">
              <span className="text-xs text-text-muted">Spender</span>
              <span className="text-xs font-medium text-text">{data.spender === 'followerVault' ? 'Follower Vault' : 'SimpleDEX'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 bg-surface">
        {status === 'idle' && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className={`w-full text-sm font-medium py-2.5 rounded-lg transition-colors cursor-pointer ${
              isConnected
                ? 'bg-secondary hover:bg-secondary/85 text-primary'
                : 'bg-surface-alt text-text-muted'
            }`}
          >
            {isConnected ? `Confirm ${config.label}` : 'Connect wallet to execute'}
          </motion.button>
        )}

        {status === 'confirming' && (
          <div className="flex items-center justify-center gap-2 py-2.5">
            <Loader2 size={14} className="animate-spin text-[#c4389a]" />
            <TextShimmer className="text-sm" active={true}>
              sending it to the chain...
            </TextShimmer>
          </div>
        )}

        {status === 'success' && txHash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2.5"
          >
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-1.5">
                <div className="size-5 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckIcon size={12} className="text-success" />
                </div>
                <span className="text-xs font-medium text-success">Confirmed</span>
              </div>
              <a
                href={`https://shannon-explorer.somnia.network/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-text-muted hover:text-text transition-colors"
              >
                Explorer <ExternalLink size={10} />
              </a>
            </div>
            {onQuickAction && FOLLOW_UPS[data.type] && (
              <div className="flex flex-wrap gap-1.5">
                {FOLLOW_UPS[data.type].map((f, i) => (
                  <motion.button
                    key={f.label}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.06 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onQuickAction(f.text)}
                    className="flex items-center gap-1 text-[11px] font-medium text-text-muted border border-border-strong hover:border-primary hover:text-[#c4389a] hover:bg-primary/10 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer"
                  >
                    <f.icon size={11} />
                    {f.label}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {status === 'error' && (
          <div className="space-y-1.5">
            <p className="text-xs text-danger">{errorMsg}</p>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setErrorMsg(''); reset() }}
              className="text-xs text-text-muted hover:text-text underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function TokenPill({ symbol, amount, sublabel, highlight }: { symbol: string; amount: string; sublabel: string; highlight?: boolean }) {
  return (
    <div className="flex-1 text-center">
      <span className="text-[10px] text-text-muted block mb-1">{sublabel}</span>
      <div className={`rounded-lg px-3 py-2.5 ${highlight ? 'bg-primary/25 border border-primary/40' : 'bg-surface-alt'}`}>
        <span className={`text-base font-bold block ${highlight ? 'text-[#c4389a]' : 'text-text'}`}>{amount}</span>
        <span className="text-[11px] font-medium text-text-muted">{symbol}</span>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-alt rounded-md px-2.5 py-2">
      <span className="text-[10px] text-text-muted block">{label}</span>
      <span className="text-xs font-semibold text-text">{value}</span>
    </div>
  )
}
