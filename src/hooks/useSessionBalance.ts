import { useEffect } from 'react'
import { useReadContract, useBalance, useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { useSessionStore } from '@/stores/session'
import { contracts } from '@/config/contracts'
import { ERC20Abi } from '@/config/abi/ERC20'
import { checkSessionStatus } from '@/lib/session-key'

export function useSessionBalance() {
  const { address } = useAccount()
  const sessionKeyAddress = useSessionStore((s) => s.sessionKeyAddress)
  const isActive = useSessionStore((s) => s.status === 'active')
  const clearSession = useSessionStore((s) => s.clearSession)

  // Periodically verify the server still has this session (survives tsx watch restarts)
  useEffect(() => {
    if (!isActive || !address) return
    const check = () => {
      checkSessionStatus(address).then((res) => {
        if (!res.active) {
          console.log('[session] Server lost session — clearing frontend state')
          clearSession()
        }
      }).catch(() => {})
    }
    check() // check immediately
    const interval = setInterval(check, 15_000) // then every 15s
    return () => clearInterval(interval)
  }, [isActive, address, clearSession])

  // ERC-20 STT balance (trading capital)
  const { data: sttBalance } = useReadContract({
    address: contracts.sttToken,
    abi: ERC20Abi,
    functionName: 'balanceOf',
    args: sessionKeyAddress ? [sessionKeyAddress] : undefined,
    query: { enabled: !!sessionKeyAddress && isActive, refetchInterval: 5_000 },
  })

  // Native STT balance (gas)
  const { data: gasBalance } = useBalance({
    address: sessionKeyAddress ?? undefined,
    query: { enabled: !!sessionKeyAddress && isActive, refetchInterval: 10_000 },
  })

  const stt = sttBalance ? Number(formatEther(sttBalance)) : 0
  const gas = gasBalance ? Number(formatEther(gasBalance.value)) : 0

  return {
    stt: Math.round(stt * 100) / 100,
    gas: Math.round(gas * 1000) / 1000,
    isActive,
    sessionKeyAddress,
  }
}
