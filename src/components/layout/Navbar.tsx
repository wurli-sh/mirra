import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ClipboardCopy, ExternalLink, LogOut } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/oni", label: "Oni Agent" },
  { to: "/trade", label: "Trade" },
] as const;

export function Navbar() {
  const { pathname } = useLocation();
  const {
    address,
    isConnected,
    isConnecting,
    connectors,
    connectWith,
    disconnect,
  } = useWallet();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const display = address
    ? `${address.slice(0, 4)}...${address.slice(-3)}`
    : "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setWalletMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setWalletMenuOpen(false);
  }, [isConnected, pathname]);

  return (
    <header className="sticky top-0 z-40 flex justify-center px-4">
      <div className="mt-3 grid h-14 w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center rounded-2xl bg-secondary px-4 sm:px-6 shadow-lg">
        {/* Brand — left */}
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-primary" />
          <span className="text-base font-bold tracking-tight text-primary">
            Mirra
          </span>
        </Link>

        {/* Nav links — center */}
        <nav className="flex items-center justify-center gap-0.5">
          {navLinks.map(({ to, label }) => {
            const isActive =
              pathname === to || (to !== "/" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`relative rounded-lg px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-lg bg-white/15"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Wallet — right */}
        <div className="flex justify-end" ref={menuRef}>
          {isConnecting ? (
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2">
              <div className="h-4 w-20 animate-pulse rounded bg-white/15" />
            </div>
          ) : !isConnected ? (
            <div className="relative">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-secondary transition-colors hover:bg-primary/90"
              >
                Connect
              </motion.button>

              <AnimatePresence>
                {walletMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-bg border border-border shadow-xl overflow-hidden z-50"
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
                          <img
                            src={connector.icon}
                            alt=""
                            className="size-5 rounded"
                          />
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
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/15 hover:bg-white/20 transition-colors px-4 sm:px-5 py-2"
              >
                <span className="text-sm font-semibold text-white">
                  {display}
                </span>
                <ChevronDown
                  size={13}
                  className={`text-white/40 transition-transform duration-200 ${walletMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {walletMenuOpen && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-bg border border-border shadow-xl overflow-hidden z-50"
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 py-3 border-b border-border/60">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                        Wallet
                      </p>
                      <p className="text-xs text-text-faint mt-0.5 font-mono">
                        {address
                          ? `${address.slice(0, 6)}...${address.slice(-4)}`
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (address) {
                          navigator.clipboard.writeText(address);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:bg-surface/60 transition-colors cursor-pointer"
                    >
                      <ClipboardCopy size={14} className="text-text-muted" />
                      {copied ? "Copied!" : "Copy Address"}
                    </button>
                    <a
                      href={`https://shannon-explorer.somnia.network/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:bg-surface/60 transition-colors cursor-pointer"
                    >
                      <ExternalLink size={14} className="text-text-muted" />
                      Explorer
                    </a>
                    <button
                      onClick={() => {
                        disconnect();
                        setWalletMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/5 transition-colors cursor-pointer border-t border-border/60"
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
  );
}
