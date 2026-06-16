import { getDefaultConfig } from './defaults'

const KEY = 'inventory.supabase.config'

export interface SupabaseConfig {
  url: string
  anonKey: string
}

export function loadConfig(): SupabaseConfig | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const cfg = JSON.parse(raw) as SupabaseConfig
      if (cfg.url && cfg.anonKey) return cfg
    }
  } catch {
    // fall through to baked-in default
  }
  // Fall back to the connection baked into the build, if any.
  return getDefaultConfig()
}

export function saveConfig(cfg: SupabaseConfig): void {
  localStorage.setItem(KEY, JSON.stringify(cfg))
}

export function clearConfig(): void {
  localStorage.removeItem(KEY)
}
