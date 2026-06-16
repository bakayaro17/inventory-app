import { getSupabase } from './supabase'
import type { Shipment, Listing, InventoryRow } from './types'

function client() {
  const c = getSupabase()
  if (!c) throw new Error('Supabase is not configured.')
  return c
}

// ---------- Shipments ----------

export async function listShipments(): Promise<Shipment[]> {
  const { data, error } = await client()
    .from('shipments')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addShipment(s: Omit<Shipment, 'id' | 'created_at'>): Promise<Shipment> {
  const { data, error } = await client().from('shipments').insert(s).select().single()
  if (error) throw error
  return data
}

export async function updateShipment(id: string, patch: Partial<Shipment>): Promise<void> {
  const { error } = await client().from('shipments').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteShipment(id: string): Promise<void> {
  const { error } = await client().from('shipments').delete().eq('id', id)
  if (error) throw error
}

// ---------- Listings ----------

export async function listListings(): Promise<Listing[]> {
  const { data, error } = await client()
    .from('listings')
    .select('*')
    .order('listed_at', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addListing(l: Omit<Listing, 'id' | 'created_at'>): Promise<Listing> {
  const { data, error } = await client().from('listings').insert(l).select().single()
  if (error) throw error
  return data
}

export async function updateListing(id: string, patch: Partial<Listing>): Promise<void> {
  const { error } = await client().from('listings').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await client().from('listings').delete().eq('id', id)
  if (error) throw error
}

// ---------- Derived inventory ----------

/**
 * Inventory = received (sum of shipment quantities) − listed (sum of listing
 * quantities), grouped by item name. Items with 0 available are hidden from the
 * Inventory page but kept so they reappear automatically on restock.
 */
export function computeInventory(shipments: Shipment[], listings: Listing[]): InventoryRow[] {
  const map = new Map<string, InventoryRow>()

  const key = (name: string) => name.trim().toLowerCase()

  for (const s of shipments) {
    if (!s.item_name?.trim()) continue
    const k = key(s.item_name)
    const row = map.get(k) ?? { item_name: s.item_name.trim(), received: 0, listed: 0, available: 0 }
    row.received += Number(s.quantity) || 0
    map.set(k, row)
  }

  for (const l of listings) {
    if (!l.item_name?.trim()) continue
    const k = key(l.item_name)
    const row = map.get(k) ?? { item_name: l.item_name.trim(), received: 0, listed: 0, available: 0 }
    row.listed += Number(l.quantity) || 0
    map.set(k, row)
  }

  const rows = [...map.values()]
  for (const r of rows) r.available = r.received - r.listed
  rows.sort((a, b) => a.item_name.localeCompare(b.item_name))
  return rows
}

/** Distinct item names known to the system (for autocomplete / dropdowns). */
export function knownItems(shipments: Shipment[]): string[] {
  const set = new Set<string>()
  for (const s of shipments) if (s.item_name?.trim()) set.add(s.item_name.trim())
  return [...set].sort((a, b) => a.localeCompare(b))
}
