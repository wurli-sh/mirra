export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k STT`
  }
  return `${value.toLocaleString()} STT`
}

export function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : '-'
  if (Math.abs(value) >= 1000) {
    return `${prefix}${Math.abs(value).toLocaleString()} STT`
  }
  return `${prefix}${Math.abs(value).toFixed(2)} STT`
}
