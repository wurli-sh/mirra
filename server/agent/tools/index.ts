import { get_leaders, get_leader_stats, is_leader } from './read-leaders'
import { get_protocol_stats } from './read-protocol'
import { makeGetUserPositions } from './read-positions'
import { get_amount_out, get_reserves, makeGetTokenBalances } from './read-dex'
import { get_recent_trades } from './read-recent'
import {
  request_swap,
  request_follow,
  request_unfollow,
  request_deposit_more,
  request_withdraw,
  request_register_leader,
  request_deregister,
  request_claim_fees,
  request_approve,
} from './write-actions'
import { buildExecutableWriteTools } from './write-execute'
import type { SessionData } from '../../lib/session-store'

export function buildTools(userAddress?: string, session?: SessionData | null) {
  // Read tools are always the same
  const readTools = {
    get_leaders,
    get_leader_stats,
    is_leader,
    get_protocol_stats,
    get_user_positions: makeGetUserPositions(userAddress),
    get_amount_out,
    get_reserves,
    get_token_balances: makeGetTokenBalances(userAddress),
    get_recent_trades,
  }

  // If user has an active session, use executable write tools (server-side execution)
  if (session) {
    console.log(`[buildTools] Using EXECUTABLE write tools for ${userAddress?.slice(0, 10)}...`)
    return { ...readTools, ...buildExecutableWriteTools(session) }
  }

  // Default: return ActionCard-based write tools (manual user confirmation)
  return {
    ...readTools,
    request_swap,
    request_follow,
    request_unfollow,
    request_deposit_more,
    request_withdraw,
    request_register_leader,
    request_deregister,
    request_claim_fees,
    request_approve,
  }
}
