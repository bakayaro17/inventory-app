import raw from './us-cities.json'

// ~30k unique "City, ST" strings. Precompute a lowercase index so per-keystroke
// filtering stays fast (no re-lowercasing the whole list each time).
const cities = raw as string[]
const lower = cities.map((c) => c.toLowerCase())

/** Prefix search over US cities, e.g. "san d" → ["San Diego, CA", ...]. */
export function searchCities(query: string, limit = 30): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const out: string[] = []
  for (let i = 0; i < cities.length && out.length < limit; i++) {
    if (lower[i].startsWith(q)) out.push(cities[i])
  }
  return out
}
