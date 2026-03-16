import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ClipboardCopy, ExternalLink, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useWallet } from '@/hooks/useWallet'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/trade', label: 'Trade' },
] as const

export function Navbar() {
  const { pathname } = useLocation()
  const { address, isConnected, isConnecting, balance, symbol, connectors, connectWith, disconnect } = useWallet()
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setWalletMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close dropdown on connect or route change
  useEffect(() => {
    setWalletMenuOpen(false)
  }, [isConnected, pathname])

  return (
    <header className="sticky top-0 z-40 flex justify-center px-4">
      <div className="mt-4 grid h-14 w-full max-w-5xl grid-cols-2 sm:grid-cols-3 items-center rounded-full bg-secondary px-4 sm:px-6 shadow-lg backdrop-blur-md">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 font-bold text-white">
            <motion.div
              className="size-7 rounded-lg bg-primary"
              whileHover={{ rotate: 6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <span className="text-base font-bold tracking-tight text-primary">Mirra</span>
            <span className="ml-1 hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary sm:inline">
              Somnia
            </span>
          </Link>
        </div>

        {/* Nav links — centered */}
        <nav className="hidden items-center justify-center gap-1 sm:flex">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200',
                pathname === to
                  ? 'text-white'
                  : 'text-white/60 hover:text-white'
              )}
            >
              {pathname === to && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-white/15"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Wallet — right aligned */}
        <div className="flex justify-end" ref={menuRef}>
          {isConnecting ? (
            <div className="flex items-center gap-2 rounded-2xl bg-primary/20 px-5 py-2">
              <div className="h-4 w-28 animate-pulse rounded bg-primary/30" />
            </div>
          ) : !isConnected ? (
            <div className="relative">
              <motion.button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-primary w-[160px] py-2 text-sm font-semibold text-secondary transition-colors duration-200 hover:bg-primary/80"
              >
                Connect Wallet
              </motion.button>

              {/* Connector picker dropdown */}
              <AnimatePresence>
                {walletMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-border shadow-xl overflow-hidden z-50"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Choose Wallet
                      </span>
                    </div>
                    {connectors.map((connector) => (
                      <button
                        key={connector.uid}
                        onClick={() => connectWith(connector)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:bg-surface transition-colors cursor-pointer"
                      >
                        {connector.icon ? (
                          <img src={connector.icon} alt="" className="size-5 rounded" />
                        ) : (
                          <div className="size-5 rounded bg-primary" />
                        )}
                        {connector.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/95 transition-colors w-[160px] py-2"
              >
                <span className="text-sm font-semibold text-secondary">
                  {address ? `${address.slice(0, 4)}...${address.slice(-3)}` : ''}
                </span>
                <ChevronDown size={14} className={cn('text-secondary/60 transition-transform', walletMenuOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {walletMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white border border-border shadow-xl overflow-hidden z-50"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Wallet</p>
                      <p className="text-xs text-text-faint mt-0.5 font-mono">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (address) {
                          navigator.clipboard.writeText(address)
                          setCopied(true)
                          setTimeout(() => setCopied(false), 1500)
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <ClipboardCopy size={15} className="text-text-muted" />
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                    <a
                      href={`https://shannon.somnia.network/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <ExternalLink size={15} className="text-text-muted" />
                      View Explorer
                    </a>
                    <button
                      onClick={() => { disconnect(); setWalletMenuOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/5 transition-colors cursor-pointer border-t border-border"
                    >
                      <LogOut size={15} />
                      Disconnect
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
