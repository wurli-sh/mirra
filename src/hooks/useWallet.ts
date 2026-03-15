import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { somniaTestnet } from '../config/chains'

export function useWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })

  const connectWallet = () => connect({ connector: injected(), chainId: somniaTestnet.id })

  return {
    address,
    isConnected,
    balance: balance ? Number(balance.formatted).toFixed(2) : '0',
    symbol: balance?.symbol ?? 'STT',
    connectWallet,
    disconnect,
  }
}
