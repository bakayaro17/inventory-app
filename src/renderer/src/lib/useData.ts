import { useCallback, useEffect, useState } from 'react'
import { listShipments, listListings, listItems, listOutbound } from './db'
import type { Shipment, Listing, ItemPreset, OutboundShipment } from './types'

export interface DataState {
  shipments: Shipment[]
  listings: Listing[]
  items: ItemPreset[]
  outbound: OutboundShipment[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useData(): DataState {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [items, setItems] = useState<ItemPreset[]>([])
  const [outbound, setOutbound] = useState<OutboundShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const [s, l, i, o] = await Promise.all([
        listShipments(),
        listListings(),
        listItems(),
        listOutbound()
      ])
      setShipments(s)
      setListings(l)
      setItems(i)
      setOutbound(o)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { shipments, listings, items, outbound, loading, error, refresh }
}
