interface SparklineProps {
  points: number[]
  color?: string
  width?: number
  height?: number
}

export function Sparkline({ points, color = 'var(--color-success)', width = 44, height = 20 }: SparklineProps) {
  if (points.length < 2) return null

  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((p - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <polyline
        points={coords.join(' ')}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  )
}
