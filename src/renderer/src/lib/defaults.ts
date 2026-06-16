import type { SupabaseConfig } from './config'

/**
 * Built-in Supabase connection. When set, the app connects automatically and
 * skips the setup screen. Leave both fields empty to use the setup screen.
 *
 * SECURITY: this repo is public. Do NOT hardcode a real project URL or anon key
 * here — the anon role has full table access, so committing a key would expose
 * the database to anyone. Enter credentials at runtime via the setup screen.
 */
export const DEFAULT_CONFIG: SupabaseConfig | null = {
  url: '',
  anonKey: ''
}

export function getDefaultConfig(): SupabaseConfig | null {
  if (DEFAULT_CONFIG && DEFAULT_CONFIG.url && DEFAULT_CONFIG.anonKey) return DEFAULT_CONFIG
  return null
}
