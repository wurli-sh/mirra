import { TrendingUp } from "lucide-react";
import { useLeaders } from "@/hooks/useLeaders";
import { cn } from "@/lib/cn";

const CHART_COLORS = ["#1A1A1A", "#6366F1", "#16A34A", "#F59E0B", "#DC2626"];

function positionsToPath(
  positions: number[],
  width: number,
  height: number,
  padding: number,
): string {
  const drawWidth = width - padding * 2;
  const xStep = drawWidth / (positions.length - 1);
  const points = positions.map((pos, i) => ({
    x: padding + i * xStep,
    y: (pos / 18) * height,
  }));

  if (points.length < 2) return "";

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + xStep * 0.4;
    const cpx2 = curr.x - xStep * 0.4;
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export function RankingChart() {
  const { leaders, isLoading } = useLeaders();

  const topLeaders = leaders.slice(0, 5);
  const lines = topLeaders.map((leader, i) => ({
    leader: leader.address,
    rank: leader.rank,
    score: leader.score,
    color: CHART_COLORS[i % CHART_COLORS.length],
    positions: leader.trend,
  }));

  const svgWidth = 800;
  const svgHeight = 200;
  const padding = 20;

  if (isLoading) {
    return (
      <div className="border border-border rounded-xl flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-text-muted ml-3">Loading chart...</span>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="border border-border rounded-xl text-center py-20">
        <TrendingUp size={28} className="text-text-faint mx-auto mb-3" />
        <p className="text-sm text-text-muted">No leaders registered yet</p>
        <p className="text-xs text-text-faint mt-1">
          Chart will populate when leaders are active.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface-alt/60">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} className="text-text-muted" />
          <span className="font-bold text-sm">Score Trend</span>
        </div>
        <span className="text-xs text-text-faint">Last 7 data points</span>
      </div>

      {/* Chart */}
      <div className="px-6 pt-4 pb-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-[200px]"
          preserveAspectRatio="none"
        >
          {/* Grid */}
          {[40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1={padding}
              y1={y}
              x2={svgWidth - padding}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
          ))}

          {/* Lines with gradient fill */}
          {lines.map((line) => {
            const d = positionsToPath(
              line.positions,
              svgWidth,
              svgHeight,
              padding,
            );
            const lastPos = line.positions[line.positions.length - 1];
            const lastX = svgWidth - padding;
            const lastY = (lastPos / 18) * svgHeight;

            return (
              <g key={line.leader}>
                <path
                  d={d}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={lastX} cy={lastY} r={4} fill={line.color} />
                <circle
                  cx={lastX}
                  cy={lastY}
                  r={7}
                  fill={line.color}
                  fillOpacity={0.15}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 px-6 py-4 border-t border-border/40">
        {lines.map((line) => (
          <div key={line.leader} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: line.color }}
            />
            <span className="text-xs text-text-muted font-medium">
              {line.leader}
            </span>
            <span className="text-xs text-text-faint">#{line.rank}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
