import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ClipboardCopy, ExternalLink, LogOut } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useWallet } from '@/hooks/useWallet'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/oni', label: 'Oni' },
  { to: '/trade', label: 'Trade' },
] as const

export function Navbar() {
  const { pathname } = useLocation()
  const { address, isConnected, isConnecting, connectors, connectWith, disconnect } = useWallet()
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

  useEffect(() => {
    setWalletMenuOpen(false)
  }, [isConnected, pathname])

  return (
    <header className="sticky top-0 z-40 w-full bg-bg/60 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        {/* Brand — left */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="size-8 rounded-md bg-primary" />
          <span className="text-lg font-bold tracking-tight text-secondary">Mirra</span>
        </Link>

        {/* Nav links — center pill */}
        <nav className="hidden sm:flex items-center gap-0.5 rounded-lg border border-border bg-surface px-1.5 py-1.5">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'relative rounded-lg px-5 py-2 text-sm font-medium transition-colors duration-200',
                pathname === to
                  ? 'text-primary'
                  : 'text-text-muted hover:text-secondary'
              )}
            >
              {pathname === to && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-lg bg-secondary"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Wallet — right */}
        <div className="flex items-center justify-end gap-3 shrink-0" ref={menuRef}>
          {isConnecting ? (
            <div className="flex items-center gap-2 rounded-lg bg-secondary/10 px-6 py-2.5">
              <div className="size-2 rounded-full bg-secondary/30 animate-pulse" />
              <div className="h-4 w-24 rounded bg-secondary/15 animate-pulse" />
            </div>
          ) : !isConnected ? (
            <div className="relative">
              <motion.button
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary/50 px-6 py-2.5 text-sm font-semibold text-secondary hover:bg-primary/70 transition-colors"
                whileTap={{ scale: 0.97 }}
              >
                Connect Wallet
              </motion.button>

              <AnimatePresence>
                {walletMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-bg border border-border shadow-xl overflow-hidden z-50"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
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
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2.5 hover:bg-primary/80 transition-colors"
              >
                <span className="text-sm font-semibold text-secondary">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                </span>
                <ChevronDown size={13} className={cn('text-secondary/50 transition-transform', walletMenuOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {walletMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-bg border border-border shadow-xl overflow-hidden z-50"
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Wallet</p>
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
                      <ClipboardCopy size={14} className="text-text-muted" />
                      {copied ? 'Copied!' : 'Copy Address'}
                    </button>
                    <a
                      href={`https://explorer.somnia.network/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:bg-surface transition-colors cursor-pointer"
                    >
                      <ExternalLink size={14} className="text-text-muted" />
                      View Explorer
                    </a>
                    <button
                      onClick={() => { disconnect(); setWalletMenuOpen(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/5 transition-colors cursor-pointer border-t border-border"
                    >
                      <LogOut size={14} />
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
