import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import { loadConfig, type SupabaseConfig } from './config'

let client: SupabaseClient | null = null
let signature = ''

/** Returns a cached Supabase client built from saved config, or null if unconfigured. */
export function getSupabase(): SupabaseClient | null {
  const cfg = loadConfig()
  if (!cfg) {
    client = null
    signature = ''
    return null
  }
  const sig = `${cfg.url}::${cfg.anonKey}`
  if (!client || sig !== signature) {
    client = createClient(cfg.url, cfg.anonKey, {
      auth: {
        // Persist the login across launches and refresh tokens silently, so you
        // sign in once per device instead of every time the app opens.
        persistSession: true,
        autoRefreshToken: true
      }
    })
    signature = sig
  }
  return client
}

/**
 * Quick connectivity check used by the setup screen. With RLS now requiring a
 * logged-in user, the anon key can't read any table — so we probe the auth
 * health endpoint instead, which only validates that the URL is reachable.
 */
export async function testConnection(cfg: SupabaseConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${cfg.url.replace(/\/+$/, '')}/auth/v1/health`, {
      headers: { apikey: cfg.anonKey }
    })
    if (!res.ok) return { ok: false, error: `Server responded ${res.status}` }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

// ---------- Auth ----------

/** Current session, or null if signed out. */
export async function getSession(): Promise<Session | null> {
  const c = getSupabase()
  if (!c) return null
  const { data } = await c.auth.getSession()
  return data.session
}

/** Sign in with the single account's email + password. */
export async function signIn(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const c = getSupabase()
  if (!c) return { ok: false, error: 'Supabase is not configured.' }
  const { error } = await c.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/** Sign out and clear the persisted session. */
export async function signOut(): Promise<void> {
  const c = getSupabase()
  if (!c) return
  await c.auth.signOut()
}

/** Subscribe to login/logout changes. Returns an unsubscribe function. */
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const c = getSupabase()
  if (!c) return () => {}
  const { data } = c.auth.onAuthStateChange((_event, session) => cb(session))
  return () => data.subscription.unsubscribe()
}
