export interface Shipment {
  id: string
  date: string // ISO date (YYYY-MM-DD)
  retailer: string
  item_name: string
  quantity: number
  created_at?: string
}

export interface Listing {
  id: string
  item_name: string
  quantity: number
  platform: string // e.g. "eBay", "Mercari"
  listed_at: string // ISO date
  created_at?: string
}

/** Derived: current stock available to list (received − listed). */
export interface InventoryRow {
  item_name: string
  received: number
  listed: number
  available: number
}

export type Page = 'shipments' | 'inventory' | 'listing' | 'overview'

export type Period = 'daily' | 'weekly' | 'monthly'
