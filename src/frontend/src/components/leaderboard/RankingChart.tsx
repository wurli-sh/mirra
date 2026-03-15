import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'
import { rankingChartData } from '../../data/mock'

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
  const { weeks, lines } = rankingChartData
  const svgWidth = 800
  const svgHeight = 180
  const gridYs = [36, 72, 108, 144]
  const yLabels = [1, 3, 5, 7, 10]

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
          <span className="text-xs text-text-muted font-medium">Week 12</span>
          <ChevronRight size={16} className="text-text-faint cursor-pointer" />
        </div>
      </div>

      {/* Chart area */}
      <div className="relative">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-[180px] flex flex-col justify-between text-3xs text-text-faint -translate-x-6 py-1">
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

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-0">
          {weeks.map((w) => (
            <span key={w} className="text-3xs text-text-faint">
              {w}
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
            <span className="text-2xs text-text-muted">
              {line.leader} · #{i + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
