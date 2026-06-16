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

/** A preset item in the reusable library, with an optional photo. */
export interface ItemPreset {
  id: string
  name: string
  photo?: string | null // base64 data URL, resized client-side
  created_at?: string
}

/** One line within an outbound shipment. */
export interface ShipmentLine {
  item_name: string
  quantity: number
}

/** An outbound shipment containing one or more item lines. Decrements inventory. */
export interface OutboundShipment {
  id: string
  date: string // ISO date
  ship_to: string // "City, ST"
  initials: string
  items: ShipmentLine[]
  created_at?: string
}

/** Derived: current stock available (received − listed − shipped). */
export interface InventoryRow {
  item_name: string
  received: number
  listed: number
  shipped: number
  available: number
}

export type Page = 'shipments' | 'outbound' | 'inventory' | 'listing' | 'items' | 'overview'

export type Period = 'daily' | 'weekly' | 'monthly'
