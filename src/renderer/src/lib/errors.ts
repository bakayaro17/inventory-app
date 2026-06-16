/**
 * Turn any thrown value into a readable string. Supabase/PostgREST reject with
 * plain objects (not Error instances), so `String(e)` yields "[object Object]".
 * This digs out a real message and appends a hint when present.
 */
export function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>
    const msg = typeof o.message === 'string' ? o.message : ''
    const hint = typeof o.hint === 'string' && o.hint ? ` (${o.hint})` : ''
    if (msg) return msg + hint
    try {
      return JSON.stringify(o)
    } catch {
      return String(e)
    }
  }
  return String(e)
}
