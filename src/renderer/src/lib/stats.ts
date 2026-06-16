import type { Shipment, Listing, Period } from './types'

/** Start of the current period boundary (local time). */
export function periodStart(period: Period, now = new Date()): Date {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period === 'daily') return d
  if (period === 'weekly') {
    // Week starts Monday.
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day)
    return d
  }
  // monthly
  d.setDate(1)
  return d
}

function inPeriod(dateStr: string, start: Date): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  return d >= start
}

export interface PeriodTotals {
  received: number
  listed: number
  receivedItems: number
  listedItems: number
}

export function totalsForPeriod(
  shipments: Shipment[],
  listings: Listing[],
  period: Period
): PeriodTotals {
  const start = periodStart(period)
  let received = 0
  let listed = 0
  const recItems = new Set<string>()
  const lstItems = new Set<string>()

  for (const s of shipments) {
    if (inPeriod(s.date, start)) {
      received += Number(s.quantity) || 0
      recItems.add(s.item_name.trim().toLowerCase())
    }
  }
  for (const l of listings) {
    if (inPeriod(l.listed_at, start)) {
      listed += Number(l.quantity) || 0
      lstItems.add(l.item_name.trim().toLowerCase())
    }
  }
  return { received, listed, receivedItems: recItems.size, listedItems: lstItems.size }
}

/** Listings grouped by platform within a period (for a pie chart). */
export function listingsByPlatform(
  listings: Listing[],
  period: Period
): { name: string; value: number }[] {
  const start = periodStart(period)
  const map = new Map<string, number>()
  for (const l of listings) {
    if (!inPeriod(l.listed_at, start)) continue
    const name = l.platform?.trim() || 'Other'
    map.set(name, (map.get(name) ?? 0) + (Number(l.quantity) || 0))
  }
  return [...map.entries()].map(([name, value]) => ({ name, value }))
}
