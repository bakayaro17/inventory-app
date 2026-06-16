import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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
      auth: { persistSession: false }
    })
    signature = sig
  }
  return client
}

/** Quick connectivity check used by the setup screen. */
export async function testConnection(cfg: SupabaseConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const probe = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false } })
    const { error } = await probe.from('shipments').select('id').limit(1)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
