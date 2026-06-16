import { useCallback, useEffect, useState } from 'react'
import { listShipments, listListings } from './db'
import type { Shipment, Listing } from './types'

export interface DataState {
  shipments: Shipment[]
  listings: Listing[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useData(): DataState {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    try {
      const [s, l] = await Promise.all([listShipments(), listListings()])
      setShipments(s)
      setListings(l)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { shipments, listings, loading, error, refresh }
}
