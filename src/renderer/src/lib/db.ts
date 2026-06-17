import { getSupabase } from './supabase'
import type { Shipment, Listing, InventoryRow, ItemPreset, OutboundShipment } from './types'

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

/** Delete every listing. The neq filter matches all real rows (Supabase
 * requires a WHERE clause on delete) — a zero UUID never exists. */
export async function clearListings(): Promise<void> {
  const { error } = await client()
    .from('listings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw error
}

// ---------- Item presets ----------

export async function listItems(): Promise<ItemPreset[]> {
  const { data, error } = await client()
    .from('items')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addItem(i: Omit<ItemPreset, 'id' | 'created_at'>): Promise<ItemPreset> {
  const { data, error } = await client().from('items').insert(i).select().single()
  if (error) throw error
  return data
}

export async function updateItem(id: string, patch: Partial<ItemPreset>): Promise<void> {
  const { error } = await client().from('items').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await client().from('items').delete().eq('id', id)
  if (error) throw error
}

// ---------- Outbound shipments ----------

export async function listOutbound(): Promise<OutboundShipment[]> {
  const { data, error } = await client()
    .from('outbound_shipments')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  // Defensively coerce the jsonb items column into a typed array.
  return (data ?? []).map((r) => ({ ...r, items: Array.isArray(r.items) ? r.items : [] }))
}

export async function addOutbound(s: Omit<OutboundShipment, 'id' | 'created_at'>): Promise<OutboundShipment> {
  const { data, error } = await client().from('outbound_shipments').insert(s).select().single()
  if (error) throw error
  return data
}

export async function deleteOutbound(id: string): Promise<void> {
  const { error } = await client().from('outbound_shipments').delete().eq('id', id)
  if (error) throw error
}

// ---------- Derived inventory ----------

/**
 * Inventory = received (sum of shipment quantities) − listed (sum of listing
 * quantities) − shipped (sum of outbound shipment line quantities), grouped by
 * item name. Items with 0 available are hidden from the Inventory page but kept
 * so they reappear automatically on restock.
 */
export function computeInventory(
  shipments: Shipment[],
  listings: Listing[],
  outbound: OutboundShipment[] = []
): InventoryRow[] {
  const map = new Map<string, InventoryRow>()

  const key = (name: string) => name.trim().toLowerCase()
  const rowFor = (name: string) =>
    map.get(key(name)) ?? { item_name: name.trim(), received: 0, listed: 0, shipped: 0, available: 0 }

  for (const s of shipments) {
    if (!s.item_name?.trim()) continue
    const row = rowFor(s.item_name)
    row.received += Number(s.quantity) || 0
    map.set(key(s.item_name), row)
  }

  for (const l of listings) {
    if (!l.item_name?.trim()) continue
    const row = rowFor(l.item_name)
    row.listed += Number(l.quantity) || 0
    map.set(key(l.item_name), row)
  }

  for (const o of outbound) {
    for (const line of o.items ?? []) {
      if (!line.item_name?.trim()) continue
      const row = rowFor(line.item_name)
      row.shipped += Number(line.quantity) || 0
      map.set(key(line.item_name), row)
    }
  }

  const rows = [...map.values()]
  for (const r of rows) r.available = r.received - r.listed - r.shipped
  rows.sort((a, b) => a.item_name.localeCompare(b.item_name))
  return rows
}

/**
 * Distinct item names known to the system, for autocomplete. Presets come first
 * (they're the curated library), then any other names seen in shipment history.
 */
export function knownItems(shipments: Shipment[], presets: ItemPreset[] = []): string[] {
  const set = new Set<string>()
  for (const p of presets) if (p.name?.trim()) set.add(p.name.trim())
  for (const s of shipments) if (s.item_name?.trim()) set.add(s.item_name.trim())
  return [...set].sort((a, b) => a.localeCompare(b))
}
