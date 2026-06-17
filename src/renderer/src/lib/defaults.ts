import type { SupabaseConfig } from './config'

/**
 * Built-in Supabase connection, injected at build time from environment
 * variables so the values never live in this (public) repo:
 *
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJhbGci...
 *
 * Put them in a local `.env` (already gitignored) or your host's env settings.
 * When set, the app connects automatically and skips the setup screen — but it
 * still requires you to sign in (see getLoginEmail / Login screen). When unset,
 * the setup screen collects the connection at runtime instead.
 *
 * The anon key is SAFE to ship: Row-Level Security blocks every table behind a
 * logged-in user, so the key alone grants no data access. See supabase/schema.sql.
 */
const ENV_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? ''
const ENV_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? ''

export const DEFAULT_CONFIG: SupabaseConfig | null = {
  url: ENV_URL,
  anonKey: ENV_ANON_KEY
}

export function getDefaultConfig(): SupabaseConfig | null {
  if (DEFAULT_CONFIG && DEFAULT_CONFIG.url && DEFAULT_CONFIG.anonKey) return DEFAULT_CONFIG
  return null
}

/**
 * Email of the single account the password screen signs in as. Baked in at
 * build time so the login page only ever asks for a password (iPhone-style).
 *
 *   VITE_LOGIN_EMAIL=you@example.com
 *
 * Falls back to empty, in which case the login screen also asks for the email.
 */
export function getLoginEmail(): string {
  return (import.meta.env.VITE_LOGIN_EMAIL as string | undefined)?.trim() ?? ''
}
