import { Dithering } from '@paper-design/shaders-react'
import { Link } from 'react-router-dom'
import { protocolStats } from '../../data/mock'

export function HeroSection() {
  return (
    <section className="relative bg-secondary overflow-hidden">
      {/* Dithering shader background */}
      <div className="absolute inset-0">
        <Dithering
          colorBack="#370305"
          colorFront="#FFD5F0"
          shape="sphere"
          type="4x4"
          size={2}
          speed={0.5}
          scale={0.6}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-20 py-28 gap-12">
        {/* Headline */}
        <div className="flex flex-col items-center gap-5 max-w-[900px]">
          <h1 className="text-[72px] font-bold text-white tracking-[-0.04em] leading-[76px] text-center">
            Your trades follow the best. Near-instant. Zero trust.
          </h1>
          <p className="text-xl text-white/55 leading-[30px] text-center max-w-[600px]">
            Reactive copy-trading on Somnia. Leaders trade, followers mirror — fully on-chain, no bots, no infrastructure.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            to="/trade"
            className="flex items-center px-9 py-4 bg-white text-secondary font-semibold text-base rounded-full hover:opacity-90 transition-opacity"
          >
            Become a Leader
          </Link>
          <Link
            to="/leaderboard"
            className="flex items-center px-9 py-4 bg-primary text-secondary font-semibold text-base rounded-full hover:opacity-90 transition-opacity"
          >
            Start Following
          </Link>
        </div>

        {/* Protocol Stats */}
        <div className="flex items-center gap-16 px-12 py-8 bg-white/[0.08] rounded-2xl">
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-white tracking-tight">{protocolStats.leaders}</span>
            <span className="text-[13px] text-white/40 uppercase tracking-widest">Active Leaders</span>
          </div>
          <div className="w-px h-12 bg-white/15" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-white tracking-tight">{protocolStats.followers.toLocaleString()}</span>
            <span className="text-[13px] text-white/40 uppercase tracking-widest">Active Followers</span>
          </div>
          <div className="w-px h-12 bg-white/15" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-4xl font-bold text-white tracking-tight">{protocolStats.volume}</span>
            <span className="text-[13px] text-white/40 uppercase tracking-widest">Mirrored Volume</span>
          </div>
        </div>
      </div>
    </section>
  )
}
