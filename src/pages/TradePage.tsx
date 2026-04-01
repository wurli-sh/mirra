import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ArrowRight,
  Shield,
  TrendingUp,
  Users,
  BarChart3,
  Copy,
  Star,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Tabs } from "@/components/ui/Tabs";
import { PositionCard } from "@/components/trade/PositionCard";
import { SwapPanel } from "@/components/trade/SwapPanel";
import { TradeFeed } from "@/components/trade/TradeFeed";
import { LeaderTable } from "@/components/leaderboard/LeaderTable";
import { FollowModal } from "@/components/leaderboard/FollowModal";
import { LeaderModal } from "@/components/leaderboard/LeaderModal";
import { usePositions } from "@/hooks/usePositions";
import { useWallet } from "@/hooks/useWallet";
import { useIsLeader } from "@/hooks/useRegisterLeader";
import { useLeaderStats } from "@/hooks/useLeaderStats";
import { useProtocolStats } from "@/hooks/useProtocolStats";
import { usePageReady } from "@/hooks/usePageReady";
import { useUIStore } from "@/stores/ui";
import { formatPnl } from "@/lib/format";

const TABS = [
  { label: "Leaders", key: "leaders" },
  { label: "Positions", key: "positions" },
  { label: "Activity", key: "activity" },
];

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-surface-alt", className)} />
  );
}

function PageSkeleton() {
  return (
    <div className="pt-16 pb-12">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface rounded-lg px-3 py-3 flex items-center gap-2"
          >
            <Skeleton className="w-7 h-7 rounded-md" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-2 w-14" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="w-full lg:w-[360px] shrink-0">
          <Skeleton className="h-[460px] w-full rounded-xl" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex gap-1 mb-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-[360px] w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function TradePage() {
  const ready = usePageReady();
  const { positions, isLoading } = usePositions();
  const { isConnected, isConnecting } = useWallet();
  const {
    isLeader,
    isLoading: leaderLoading,
    refetch: refetchLeader,
  } = useIsLeader();
  const leaderStats = useLeaderStats();
  const { stats, isLoading: statsLoading } = useProtocolStats();
  const activeTab = useUIStore((s) => s.activeTradeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTradeTab);
  const followModalOpen = useUIStore((s) => s.followModalOpen);

  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [leaderModalMode, setLeaderModalMode] = useState<
    "register" | "deregister"
  >("register");

  if (!ready) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <PageSkeleton />
      </motion.div>
    );
  }

  // Protocol-level stats (top bar)
  const protocolCounters = [
    {
      icon: Users,
      value: statsLoading ? null : stats.leaders,
      label: "Leaders",
    },
    {
      icon: TrendingUp,
      value: statsLoading ? null : stats.followers,
      label: "Followers",
    },
    {
      icon: BarChart3,
      value: statsLoading ? null : stats.volume,
      label: "Volume",
    },
  ];

  // User-specific stat (4th slot)
  const userStat =
    isConnected && !leaderLoading
      ? isLeader
        ? {
            icon: Trophy,
            value: leaderStats.isLoading ? null : leaderStats.score || "—",
            label: "Your Score",
          }
        : { icon: Copy, value: positions.length, label: "Positions" }
      : null;

  return (
    <div className="pt-16 pb-12">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight leading-none">
              Trade
            </h1>
            {isConnected && !leaderLoading && (
              <span
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg",
                  isLeader
                    ? "bg-primary text-secondary"
                    : "bg-success/10 text-success",
                )}
              >
                {isLeader ? "Leader" : "Follower"}
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted mt-1.5">
            Swap on SimpleDEX, follow leaders, and mirror trades automatically.
          </p>
        </div>

        {/* Leader register/deregister */}
        {isConnecting || (isConnected && leaderLoading) ? (
          <Skeleton className="w-40 h-10 rounded-lg" />
        ) : isConnected && isLeader ? (
          <motion.button
            className="rounded-lg px-4 py-2 flex items-center gap-2 font-semibold text-xs cursor-pointer shrink-0 border border-danger/20 text-danger hover:bg-danger/5 transition-colors"
            onClick={() => {
              setLeaderModalMode("deregister");
              setLeaderModalOpen(true);
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Star size={12} />
            Deregister
          </motion.button>
        ) : isConnected ? (
          <motion.button
            className="relative rounded-lg px-5 py-2.5 flex items-center gap-2 font-semibold text-xs cursor-pointer shrink-0 bg-secondary text-white overflow-hidden"
            onClick={() => {
              setLeaderModalMode("register");
              setLeaderModalOpen(true);
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/25 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1,
              }}
            />
            <span className="relative flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              >
                <Star size={12} />
              </motion.span>
              Become Leader
            </span>
          </motion.button>
        ) : null}
      </motion.div>

      {/* Stats bar */}
      <motion.div
        className={cn(
          "grid gap-2 sm:gap-3 mb-6",
          userStat ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3",
        )}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        {[...protocolCounters, ...(userStat ? [userStat] : [])].map(
          ({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="bg-surface rounded-lg px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                <Icon size={14} className="text-secondary" />
              </div>
              <div className="min-w-0">
                {value === null ? (
                  <Skeleton className="h-4 w-10 mb-1" />
                ) : (
                  <span className="text-base font-bold tracking-tight block truncate">
                    {value}
                  </span>
                )}
                <span className="text-xs text-text-faint uppercase tracking-wider">
                  {label}
                </span>
              </div>
            </div>
          ),
        )}
      </motion.div>

      {/* Main layout: Swap left, tabbed content right */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left — Swap */}
        <motion.div
          className="w-full lg:w-[360px] shrink-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <SwapPanel />
        </motion.div>

        {/* Right — Tabbed content */}
        <motion.div
          className="flex flex-col flex-1 min-w-0"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Tabs items={TABS} active={activeTab} onChange={setActiveTab} />

          {/* Leaders tab */}
          {activeTab === "leaders" && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LeaderTable />
            </motion.div>
          )}

          {/* Positions tab */}
          {activeTab === "positions" && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="border border-border rounded-xl overflow-hidden">
                {isConnecting ? (
                  <div className="divide-y divide-border/40">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="p-4 flex items-center gap-4">
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <div className="flex-1 flex flex-col gap-2">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-2.5 w-40" />
                        </div>
                        <Skeleton className="w-16 h-6" />
                      </div>
                    ))}
                  </div>
                ) : !isConnected ? (
                  <div className="py-16 text-center">
                    <Wallet
                      size={24}
                      className="text-text-faint mx-auto mb-3"
                    />
                    <p className="text-sm font-medium text-text-muted">
                      Connect your wallet to view positions
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="divide-y divide-border/40">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="p-4 flex items-center gap-4">
                        <Skeleton className="w-8 h-8 rounded-md" />
                        <div className="flex-1 flex flex-col gap-2">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-2.5 w-40" />
                        </div>
                        <Skeleton className="w-16 h-6" />
                      </div>
                    ))}
                  </div>
                ) : positions.length === 0 ? (
                  <div className="py-16 text-center">
                    <Shield
                      size={24}
                      className="text-text-faint mx-auto mb-3"
                    />
                    <p className="text-sm font-medium text-text-muted">
                      No active positions
                    </p>
                    <p className="text-xs text-text-faint mt-1 mb-3">
                      Follow a leader to start mirroring.
                    </p>
                    <button
                      onClick={() => setActiveTab("leaders")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-primary px-4 py-2 rounded-md hover:bg-primary/80 transition-colors cursor-pointer"
                    >
                      Browse Leaders <ArrowRight size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {positions.map((pos) => (
                      <PositionCard
                        key={pos.fullLeaderAddress}
                        position={pos}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Position summary — if connected and has positions */}
              {isConnected && positions.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { v: positions.length, l: "Active", icon: Copy },
                    {
                      v: `${positions.reduce((s, p) => s + p.deposited, 0).toFixed(0)} STT`,
                      l: "Deposited",
                      icon: Wallet,
                    },
                    {
                      v: formatPnl(positions.reduce((s, p) => s + p.pnl, 0)),
                      l: "Total P&L",
                      icon: TrendingUp,
                      c:
                        positions.reduce((s, p) => s + p.pnl, 0) >= 0
                          ? "text-success"
                          : "text-danger",
                    },
                  ].map(({ v, l, icon: Icon, c }) => (
                    <div
                      key={l}
                      className="bg-surface rounded-lg px-3 py-2.5 flex items-center gap-2"
                    >
                      <Icon size={12} className="text-text-faint shrink-0" />
                      <div className="min-w-0">
                        <span
                          className={cn("text-sm font-bold block truncate", c)}
                        >
                          {v}
                        </span>
                        <span className="text-xs text-text-faint uppercase tracking-wider">
                          {l}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Activity tab */}
          {activeTab === "activity" && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TradeFeed />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Follow modal */}
      <AnimatePresence>{followModalOpen && <FollowModal />}</AnimatePresence>

      {/* Leader register/deregister modal */}
      <LeaderModal
        mode={leaderModalMode}
        open={leaderModalOpen}
        onClose={() => setLeaderModalOpen(false)}
        onSuccess={refetchLeader}
      />
    </div>
  );
}
