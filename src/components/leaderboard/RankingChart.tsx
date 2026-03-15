import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLeaders } from '@/hooks/useLeaders'

const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4, #6366f1)',
  'var(--color-chart-5, #f59e0b)',
]

function positionsToPath(positions: number[], width: number, height: number): string {
  const xStep = width / (positions.length - 1)
  const points = positions.map((pos, i) => ({
    x: i * xStep,
    y: (pos / 10) * height,
  }))

  if (points.length < 2) return ''

  let d = `M ${points[0].x} ${points[0].y}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + xStep * 0.4
    const cpx2 = curr.x - xStep * 0.4
    d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`
  }

  return d
}

export function RankingChart() {
  const { leaders, isLoading } = useLeaders()

  // Use the trend data from top leaders (max 5)
  const topLeaders = leaders.slice(0, 5)
  const lines = topLeaders.map((leader, i) => ({
    leader: leader.address,
    color: CHART_COLORS[i % CHART_COLORS.length],
    positions: leader.trend,
  }))

  const svgWidth = 800
  const svgHeight = 180
  const gridYs = [36, 72, 108, 144]
  const yLabels = [1, 3, 5, 7, 10]

  if (isLoading) {
    return (
      <div className="border border-border rounded-2xl p-6 flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-text-muted ml-3">Loading chart...</span>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="border border-border rounded-2xl p-6 text-center py-16">
        <TrendingUp size={24} className="text-text-faint mx-auto mb-3" />
        <p className="text-sm text-text-muted">No leaders registered yet. Chart will populate when leaders are active.</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-text-muted" />
          <span className="font-bold text-sm">Ranking Over Time</span>
        </div>
        <div className="flex items-center gap-2">
          <ChevronLeft size={16} className="text-text-faint cursor-pointer" />
          <span className="text-xs text-text-muted font-medium">Recent</span>
          <ChevronRight size={16} className="text-text-faint cursor-pointer" />
        </div>
      </div>

      {/* Chart area */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-[180px] flex flex-col justify-between text-xs text-text-faint -translate-x-6 py-1">
          {yLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-[180px]"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {gridYs.map((y) => (
            <line
              key={y}
              x1={0}
              y1={y}
              x2={svgWidth}
              y2={y}
              stroke="currentColor"
              strokeOpacity={0.07}
              strokeWidth={1}
            />
          ))}

          {/* Data lines */}
          {lines.map((line) => {
            const d = positionsToPath(line.positions, svgWidth, svgHeight)
            const lastPos = line.positions[line.positions.length - 1]
            const lastX = svgWidth
            const lastY = (lastPos / 10) * svgHeight

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
                <circle
                  cx={lastX}
                  cy={lastY}
                  r={4}
                  fill={line.color}
                />
              </g>
            )
          })}
        </svg>

        {/* X-axis labels from trend indices */}
        <div className="flex justify-between mt-2 px-0">
          {lines[0]?.positions.map((_, i) => (
            <span key={i} className="text-xs text-text-faint">
              {i + 1}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-4">
        {lines.map((line, i) => (
          <div key={line.leader} className="flex items-center gap-2">
            <div
              className="w-3 h-[3px] rounded"
              style={{ backgroundColor: line.color }}
            />
            <span className="text-xs text-text-muted">
              {line.leader} · #{i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
