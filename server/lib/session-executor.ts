// @ts-nocheck
import { createWalletClient, http, parseEther, formatEther, isAddress, maxUint256, type Address, type Hash } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { publicClient, contracts, somniaTestnet, resolveToken } from './viem-client'
import { type SessionData, checkSpend, commitSpend, checkOperationLimit, commitOperation, markApprovesDone } from './session-store'
import { SimpleDEXAbi } from '../../src/config/abi/SimpleDEX'
import { FollowerVaultAbi } from '../../src/config/abi/FollowerVault'
import { LeaderRegistryAbi } from '../../src/config/abi/LeaderRegistry'
import { ERC20Abi } from '../../src/config/abi/ERC20'

const WHITELISTED_CONTRACTS = new Set(
  Object.values(contracts).map(a => a?.toLowerCase()).filter(Boolean)
)

/** Validate and parse a string amount to wei. Returns error string on failure. */
function safeParseAmount(value: unknown, fieldName: string): bigint | string {
  const str = String(value ?? '')
  const num = parseFloat(str)
  if (!isFinite(num) || num <= 0 || num > 1_000_000) {
    return `${fieldName} must be a positive finite number (got "${str}")`
  }
  return parseEther(str)
}

/** Validate an address parameter from LLM tool output. */
function validateAddress(value: unknown, fieldName: string): Address | string {
  const addr = String(value ?? '')
  if (!isAddress(addr)) {
    return `Invalid ${fieldName} address: "${addr.slice(0, 20)}"`
  }
  return addr as Address
}

function createSessionWallet(session: SessionData) {
  const account = privateKeyToAccount(session.privateKey)
  return createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(),
  })
}

async function waitForTx(hash: Hash): Promise<void> {
  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1, timeout: 60_000 })
}

function sanitizeError(msg: string): string {
  if (msg.includes('insufficient funds')) return 'Insufficient funds in session wallet. Send more STT to continue.'
  if (msg.includes('User rejected') || msg.includes('denied')) return 'Transaction rejected.'
  if (msg.includes('execution reverted')) return 'Transaction reverted by contract.'
  if (msg.includes('nonce')) return 'Nonce error — please retry.'
  return 'Transaction failed. Please try again.'
}

/** Auto-approve all tokens for SimpleDEX and FollowerVault. Called once after session creation. */
export async function autoApproveContracts(session: SessionData): Promise<void> {
  const wallet = createSessionWallet(session)
  const tokens = [contracts.sttToken, contracts.usdcToken, contracts.wethToken]
  const spenders = [contracts.simpleDex, contracts.followerVault]

  for (const token of tokens) {
    for (const spender of spenders) {
      try {
        const hash = await wallet.writeContract({
          address: token,
          abi: ERC20Abi,
          functionName: 'approve',
          args: [spender, maxUint256],
        })
        await waitForTx(hash)
      } catch (err) {
        // Log only the contract pair, not the full error which may contain RPC details
        console.error(`[session-exec] Approve failed for token→spender pair`)
      }
    }
  }
  markApprovesDone(session.ownerAddress)
  console.log(`[session-exec] Auto-approved contracts for session ${session.sessionKeyAddress.slice(0, 10)}...`)
}

export type ExecuteResult = {
  executed: true
  txHash: string
  type: string
  [key: string]: unknown
}

export async function executeAction(
  session: SessionData,
  actionType: string,
  params: Record<string, unknown>
): Promise<ExecuteResult | { error: string }> {
  // H-4: Global operation count limit — applies to ALL action types
  if (!checkOperationLimit(session.ownerAddress)) {
    return { error: 'Session operation limit reached (50 max). Start a new session to continue.' }
  }

  // Lazy auto-approve: run on first executeAction when wallet has gas
  if (!session.approvesDone) {
    try {
      // Check if session wallet has any native STT for gas before attempting approvals
      const balance = await publicClient.getBalance({ address: session.sessionKeyAddress })
      if (balance > 0n) {
        await autoApproveContracts(session)
      } else {
        console.log('[session-exec] Skipping auto-approve — session wallet has no gas yet')
      }
    } catch (err) {
      console.error('[session-exec] Auto-approve error:', err instanceof Error ? err.message.slice(0, 100) : 'unknown')
    }
  }

  const wallet = createSessionWallet(session)

  try {
    switch (actionType) {
      case 'swap': {
        const tokenInAddr = params.tokenInAddress as Address
        const tokenOutAddr = params.tokenOutAddress as Address
        const amountIn = params.amountIn as string

        const parsedAmt = parseFloat(amountIn)
        if (!isFinite(parsedAmt) || parsedAmt <= 0) {
          return { error: 'Invalid amountIn' }
        }

        const amountWei = parseEther(amountIn)

        // Pre-check: does the session wallet have enough tokens?
        // If not, fall back to ActionCard so user can execute from main wallet
        try {
          const tokenBal = await publicClient.readContract({
            address: tokenInAddr,
            abi: ERC20Abi,
            functionName: 'balanceOf',
            args: [session.sessionKeyAddress],
          }) as bigint
          if (tokenBal < amountWei) {
            // Get quote for the ActionCard fallback
            let estOut = '0'
            try {
              const q = await publicClient.readContract({
                address: contracts.simpleDex, abi: SimpleDEXAbi, functionName: 'getAmountOut',
                args: [tokenInAddr, tokenOutAddr, amountWei],
              }) as bigint
              estOut = formatEther(q)
            } catch { /* use 0 */ }
            // Return ActionCard data — user confirms from main wallet as fallback
            return {
              type: 'swap' as const,
              fallback: true,
              tokenIn: params.tokenIn as string,
              tokenInAddress: tokenInAddr,
              tokenOut: params.tokenOut as string,
              tokenOutAddress: tokenOutAddr,
              amountIn,
              estimatedOut: estOut,
              contractAddress: contracts.simpleDex,
              sessionWalletLow: true,
            }
          }
        } catch { /* skip check if read fails */ }

        // C-2: Check cap BEFORE, but only commit AFTER success
        if (!checkSpend(session.ownerAddress, amountWei)) {
          return { error: 'Session spending cap reached. Start a new session to reset.' }
        }

        // Get quote
        let estimatedOut = 0n
        try {
          estimatedOut = await publicClient.readContract({
            address: contracts.simpleDex,
            abi: SimpleDEXAbi,
            functionName: 'getAmountOut',
            args: [tokenInAddr, tokenOutAddr, amountWei],
          }) as bigint
        } catch { /* use 0 as min */ }

        const minOut = estimatedOut * 95n / 100n

        const hash = await wallet.writeContract({
          address: contracts.simpleDex,
          abi: SimpleDEXAbi,
          functionName: 'swap',
          args: [tokenInAddr, tokenOutAddr, amountWei, minOut],
        })
        await waitForTx(hash)

        // Commit spend + operation count AFTER confirmed success
        commitSpend(session.ownerAddress, amountWei)
        commitOperation(session.ownerAddress)

        return {
          executed: true,
          txHash: hash,
          type: 'swap',
          tokenIn: params.tokenIn as string,
          tokenOut: params.tokenOut as string,
          amountIn,
          estimatedOut: formatEther(estimatedOut),
        }
      }

      case 'follow': {
        const leaderResult = validateAddress(params.leader, 'leader')
        if (typeof leaderResult === 'string') return { error: leaderResult }
        const leader = leaderResult

        const amountResult = safeParseAmount(params.amount, 'amount')
        if (typeof amountResult === 'string') return { error: amountResult }
        const amount = amountResult

        const maxPerTradeResult = safeParseAmount(params.maxPerTrade, 'maxPerTrade')
        if (typeof maxPerTradeResult === 'string') return { error: maxPerTradeResult }
        const maxPerTrade = maxPerTradeResult

        const slippageBps = Number(params.slippageBps)
        if (!Number.isInteger(slippageBps) || slippageBps < 1 || slippageBps > 1000) {
          return { error: 'slippageBps must be an integer between 1 and 1000' }
        }

        const stopLossResult = safeParseAmount(params.stopLoss, 'stopLoss')
        if (typeof stopLossResult === 'string') return { error: stopLossResult }
        const stopLoss = stopLossResult

        // Pre-check STT balance — fall back to ActionCard if insufficient
        try {
          const sttBal = await publicClient.readContract({
            address: contracts.sttToken, abi: ERC20Abi, functionName: 'balanceOf', args: [session.sessionKeyAddress],
          }) as bigint
          if (sttBal < amount) {
            return {
              type: 'follow' as const,
              fallback: true,
              leader,
              amount: params.amount as string,
              maxPerTrade: params.maxPerTrade as string,
              slippageBps,
              stopLoss: params.stopLoss as string,
              contractAddress: contracts.followerVault,
              tokenAddress: contracts.sttToken,
              sessionWalletLow: true,
            }
          }
        } catch { /* skip */ }

        if (!checkSpend(session.ownerAddress, amount)) {
          return { error: 'Session spending cap reached.' }
        }

        const hash = await wallet.writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: 'follow',
          args: [leader, amount, maxPerTrade, slippageBps, stopLoss],
        })
        await waitForTx(hash)
        commitSpend(session.ownerAddress, amount)
        commitOperation(session.ownerAddress)

        return {
          executed: true,
          txHash: hash,
          type: 'follow',
          leader: `${(leader as string).slice(0, 6)}...${(leader as string).slice(-4)}`,
          amount: params.amount as string,
        }
      }

      case 'unfollow': {
        const unfollowLeader = validateAddress(params.leader, 'leader')
        if (typeof unfollowLeader === 'string') return { error: unfollowLeader }
        const hash = await wallet.writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: 'unfollow',
          args: [unfollowLeader],
        })
        await waitForTx(hash)
        commitOperation(session.ownerAddress)
        return { executed: true, txHash: hash, type: 'unfollow', leader: params.leader as string }
      }

      case 'deposit': {
        const depositLeader = validateAddress(params.leader, 'leader')
        if (typeof depositLeader === 'string') return { error: depositLeader }
        const amtResult = safeParseAmount(params.amount, 'amount')
        if (typeof amtResult === 'string') return { error: amtResult }
        const amt = amtResult
        if (!checkSpend(session.ownerAddress, amt)) {
          return { error: 'Session spending cap reached.' }
        }
        const hash = await wallet.writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: 'deposit',
          args: [depositLeader, amt],
        })
        await waitForTx(hash)
        commitSpend(session.ownerAddress, amt)
        commitOperation(session.ownerAddress)
        return { executed: true, txHash: hash, type: 'deposit', amount: params.amount as string }
      }

      case 'withdraw': {
        const withdrawLeader = validateAddress(params.leader, 'leader')
        if (typeof withdrawLeader === 'string') return { error: withdrawLeader }
        const withdrawAmt = safeParseAmount(params.amount, 'amount')
        if (typeof withdrawAmt === 'string') return { error: withdrawAmt }
        const hash = await wallet.writeContract({
          address: contracts.followerVault,
          abi: FollowerVaultAbi,
          functionName: 'withdraw',
          args: [withdrawLeader, withdrawAmt],
        })
        await waitForTx(hash)
        commitOperation(session.ownerAddress)
        return { executed: true, txHash: hash, type: 'withdraw', amount: params.amount as string }
      }

      case 'register': {
        const stakeResult = safeParseAmount(params.stakeAmount || '10', 'stakeAmount')
        if (typeof stakeResult === 'string') return { error: stakeResult }
        const stakeAmt = stakeResult
        if (!checkSpend(session.ownerAddress, stakeAmt)) {
          return { error: 'Session spending cap reached.' }
        }
        const hash = await wallet.writeContract({
          address: contracts.leaderRegistry,
          abi: LeaderRegistryAbi,
          functionName: 'registerLeader',
          value: stakeAmt,
        })
        await waitForTx(hash)
        commitSpend(session.ownerAddress, stakeAmt)
        commitOperation(session.ownerAddress)
        return { executed: true, txHash: hash, type: 'register', stakeAmount: params.stakeAmount as string }
      }

      case 'deregister': {
        // deregisterLeader checks msg.sender — session wallet won't be the leader,
        // so fall back to ActionCard for the user's real wallet
        return {
          type: 'deregister' as const,
          fallback: true,
          contractAddress: contracts.leaderRegistry,
          sessionWalletCantExecute: true,
        }
      }

      case 'claimFees': {
        const token = resolveToken(params.token as string || 'STT')
        if (!token) return { error: 'Unknown token' }
        // claimFees checks msg.sender is a leader — session wallet won't be registered,
        // so always fall back to ActionCard for the user's real wallet
        return {
          type: 'claimFees' as const,
          fallback: true,
          contractAddress: contracts.followerVault,
          token: token.symbol,
          tokenAddress: token.address,
          sessionWalletCantExecute: true,
        }
      }

      case 'approve': {
        const t = resolveToken(params.token as string)
        if (!t) return { error: 'Unknown token' }
        const spenderAddress = params.spender === 'followerVault' ? contracts.followerVault : contracts.simpleDex
        if (!WHITELISTED_CONTRACTS.has(spenderAddress.toLowerCase())) {
          return { error: 'Spender not whitelisted' }
        }
        const hash = await wallet.writeContract({
          address: t.address,
          abi: ERC20Abi,
          functionName: 'approve',
          args: [spenderAddress, maxUint256],
        })
        await waitForTx(hash)
        commitOperation(session.ownerAddress)
        return { executed: true, txHash: hash, type: 'approve', token: t.symbol }
      }

      default:
        return { error: `Unknown action type: ${actionType}` }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Transaction failed'
    // Log the actual error server-side for debugging, sanitize for the user
    console.error(`[session-exec] ${actionType} failed:`, sanitizeError(msg))
    return { error: sanitizeError(msg) }
  }
}
