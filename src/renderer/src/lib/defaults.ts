import type { SupabaseConfig } from './config'

/**
 * Built-in Supabase connection. When set, the app connects automatically and
 * skips the setup screen. Leave anonKey empty to fall back to the setup screen.
 */
export const DEFAULT_CONFIG: SupabaseConfig | null = {
  url: 'https://beoyhmzzjoseyninecry.supabase.co',
  anonKey: '' // <-- anon public key goes here
}

export function getDefaultConfig(): SupabaseConfig | null {
  if (DEFAULT_CONFIG && DEFAULT_CONFIG.url && DEFAULT_CONFIG.anonKey) return DEFAULT_CONFIG
  return null
}
