import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/cn'

interface NavbarProps {
  connected?: boolean
}

export function Navbar({ connected = false }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between px-20 py-5">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg" />
        <span className="font-bold text-xl text-secondary tracking-tight">
          MirrorX
        </span>
      </div>

      {/* Nav Links */}
      <div className="flex items-center gap-10">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn('text-[15px]', isActive ? 'font-medium text-secondary' : 'text-text-muted')
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            cn('text-[15px]', isActive ? 'font-medium text-secondary' : 'text-text-muted')
          }
        >
          Leaderboard
        </NavLink>
        <NavLink
          to="/trade"
          className={({ isActive }) =>
            cn('text-[15px]', isActive ? 'font-medium text-secondary' : 'text-text-muted')
          }
        >
          Trade
        </NavLink>
      </div>

      {/* Wallet */}
      {!connected ? (
        <button className="bg-secondary text-white rounded-full px-6 py-2.5 text-sm font-medium">
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-text-muted text-sm">12.4 STT</span>
          <div className="bg-secondary rounded-full px-6 py-2.5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-white text-sm font-medium">0x3a1f...8c2d</span>
          </div>
        </div>
      )}
    </nav>
  )
}
