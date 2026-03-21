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

export function buildTools(userAddress?: string) {
  return {
    // Read tools
    get_leaders,
    get_leader_stats,
    is_leader,
    get_protocol_stats,
    get_user_positions: makeGetUserPositions(userAddress),
    get_amount_out,
    get_reserves,
    get_token_balances: makeGetTokenBalances(userAddress),
    get_recent_trades,

    // Write tools (return ActionCard data)
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
