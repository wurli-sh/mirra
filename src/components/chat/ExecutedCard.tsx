import { motion } from 'framer-motion'
import {
  ArrowRightLeft, UserPlus, UserMinus, ArrowDownToLine, ArrowUpFromLine,
  Shield, ShieldOff, Coins, CheckCircle, ExternalLink, BadgeCheck,
  Wallet, RotateCcw, TrendingUp,
} from 'lucide-react'
import { OniAvatar } from '@/components/ui/OniAvatar'

type ActionType = 'swap' | 'follow' | 'unfollow' | 'deposit' | 'withdraw' | 'register' | 'deregister' | 'claimFees' | 'approve'

const ACTION_CONFIG: Record<ActionType, { icon: typeof ArrowRightLeft; label: string }> = {
  swap: { icon: ArrowRightLeft, label: 'Swap Executed' },
  follow: { icon: UserPlus, label: 'Followed Leader' },
  unfollow: { icon: UserMinus, label: 'Unfollowed' },
  deposit: { icon: ArrowDownToLine, label: 'Deposited' },
  withdraw: { icon: ArrowUpFromLine, label: 'Withdrawn' },
  register: { icon: Shield, label: 'Registered as Leader' },
  deregister: { icon: ShieldOff, label: 'Deregistered' },
  claimFees: { icon: Coins, label: 'Fees Claimed' },
  approve: { icon: BadgeCheck, label: 'Token Approved' },
}

type FollowUp = { icon: typeof ArrowRightLeft; label: string; text: string }
const FOLLOW_UPS: Partial<Record<ActionType, FollowUp[]>> = {
  swap: [
    { icon: RotateCcw, label: 'Swap again', text: 'I want to do another swap' },
    { icon: Wallet, label: 'My balances', text: 'Show my token balances' },
    { icon: TrendingUp, label: 'Top leaders', text: 'Who are the top leaders right now?' },
  ],
  follow: [
    { icon: TrendingUp, label: 'My positions', text: 'Show my follow positions' },
    { icon: UserPlus, label: 'Follow another', text: 'Who else should I follow?' },
  ],
}

interface Props {
  data: { executed: true; txHash: string; type: string; [key: string]: unknown }
  onQuickAction?: (text: string) => void
}

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/

function truncateHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

export function ExecutedCard({ data, onQuickAction }: Props) {
  const actionType = data.type as ActionType
  const config = ACTION_CONFIG[actionType] ?? { icon: ArrowRightLeft, label: data.type }
  const Icon = config.icon
  const followUps = FOLLOW_UPS[actionType]
  const isValidHash = TX_HASH_RE.test(data.txHash)

  // Build summary text
  let summary = ''
  if (actionType === 'swap') {
    summary = `${data.amountIn} ${data.tokenIn} → ${Number(data.estimatedOut).toFixed(4)} ${data.tokenOut}`
  } else if (actionType === 'follow') {
    summary = `Following ${data.leader} with ${data.amount} STT`
  } else if (actionType === 'deposit') {
    summary = `Deposited ${data.amount} STT`
  } else if (actionType === 'withdraw') {
    summary = `Withdrawn ${data.amount} STT`
  } else if (actionType === 'register') {
    summary = `Staked ${data.stakeAmount ?? '10'} STT`
  } else if (actionType === 'approve') {
    summary = `Approved ${data.token}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="border border-success/30 rounded-xl rounded-tl-sm overflow-hidden max-w-sm my-1"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-success/10 border-b border-success/20">
        <div className="size-8 rounded-md bg-success/20 flex items-center justify-center">
          <Icon size={15} className="text-success" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-text leading-tight">{config.label}</span>
            <CheckCircle size={13} className="text-success" />
          </div>
          {summary && <span className="text-xs text-text-muted">{summary}</span>}
        </div>
      </div>

      {/* Tx link + follow-ups */}
      <div className="px-4 py-3 bg-surface space-y-2.5">
        {isValidHash ? (
          <a
            href={`https://shannon-explorer.somnia.network/tx/${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-xs text-text-muted hover:text-text transition-colors"
          >
            <span className="font-mono">{truncateHash(data.txHash)}</span>
            <ExternalLink size={11} />
          </a>
        ) : (
          <span className="text-xs text-text-muted font-mono">Invalid tx hash</span>
        )}

        {onQuickAction && followUps && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {followUps.map((f, i) => (
              <motion.button
                key={f.label}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onQuickAction(f.text)}
                className="flex items-center gap-1 text-xs font-medium text-text-muted border border-border-strong hover:border-primary hover:text-[#c4389a] hover:bg-primary/10 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer"
              >
                <f.icon size={11} />
                {f.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
