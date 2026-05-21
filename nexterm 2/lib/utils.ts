import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPrice(price: number, pip: number): string {
  return pip < 0.001 ? price.toFixed(3) : price.toFixed(5)
}

export function formatChange(change: number, pip: number): string {
  const decimals = pip < 0.001 ? 3 : 5
  return (change >= 0 ? '+' : '') + change.toFixed(decimals)
}

export function tickPrice(price: number, pip: number): number {
  const chg = (Math.random() - 0.495) * pip * 2.5
  return Math.max(price + chg, pip * 10)
}

export function padTime(n: number): string {
  return String(n).padStart(2, '0')
}

export function getUTCTimeString(): string {
  const now = new Date()
  return `${padTime(now.getUTCHours())}:${padTime(now.getUTCMinutes())}:${padTime(now.getUTCSeconds())} UTC`
}

export function isSessionActive(startUTC: number, endUTC: number): boolean {
  const h = new Date().getUTCHours()
  return h >= startUTC && h < endUTC
}

export function formatNet(net: number): string {
  return (net >= 0 ? '+' : '') + (net / 1000).toFixed(1) + 'K'
}

export function seasonClass(value: number): string {
  if (value > 0.25) return 'bg-[#0d3320]'
  if (value > 0.05) return 'bg-[#0a2318]'
  if (value < -0.25) return 'bg-[#3d1515]'
  if (value < -0.05) return 'bg-[#2a1218]'
  return 'bg-[#1a1f28]'
}
