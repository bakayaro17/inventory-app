import React, { useMemo, useState } from 'react'
import { Card, Button, Input, Select, EmptyState, Pill } from '../components/ui'
import PageHeader from '../components/PageHeader'
import { addListing, deleteListing, clearListings, computeInventory } from '../lib/db'
import type { DataState } from '../lib/useData'

const today = () => new Date().toISOString().slice(0, 10)
const PLATFORMS = ['eBay', 'Mercari', 'Poshmark', 'Other']

export default function Listing({ data }: { data: DataState }) {
  const inventory = useMemo(
    () => computeInventory(data.shipments, data.listings, data.outbound),
    [data.shipments, data.listings, data.outbound]
  )
  const available = inventory.filter((r) => r.available > 0)

  const [item, setItem] = useState('')
  const [quantity, setQuantity] = useState('')
  const [platform, setPlatform] = useState(PLATFORMS[0])
  const [date, setDate] = useState(today())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const maxForItem = inventory.find((r) => r.item_name === item)?.available ?? 0

  async function list() {
    setError('')
    const qty = parseInt(quantity, 10)
    if (!item) return setError('Pick an item to list.')
    if (!qty || qty <= 0) return setError('Enter a quantity.')
    if (qty > maxForItem) return setError(`Only ${maxForItem} available for ${item}.`)
    setSaving(true)
    try {
      await addListing({ item_name: item, quantity: qty, platform, listed_at: date })
      setItem('')
      setQuantity('')
      await data.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await deleteListing(id)
    await data.refresh()
  }

  async function clearAll() {
    setClearing(true)
    try {
      await clearListings()
      await data.refresh()
      setConfirmingClear(false)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Listing"
        subtitle="List stock on a marketplace. This reduces what's available in Inventory."
      />

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_150px_auto] gap-3 items-end">
          <Field label="Item">
            <Select value={item} onChange={(e) => setItem(e.target.value)}>
              <option value="">Select item…</option>
              {available.map((r) => (
                <option key={r.item_name} value={r.item_name}>
                  {r.item_name} ({r.available} available)
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity">
            <Input
              type="number"
              min={1}
              max={maxForItem || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="Platform">
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Button onClick={list} disabled={saving}>
            List
          </Button>
        </div>
        {error && <p className="text-rose-300 text-sm mt-3">{error}</p>}
        {available.length === 0 && (
          <p className="text-white/40 text-sm mt-3">
            Nothing available to list right now. Receive a shipment first.
          </p>
        )}
      </Card>

      <Card className="overflow-hidden">
        {data.listings.length === 0 ? (
          <EmptyState title="No listings yet" hint="List an item above to get started." />
        ) : (
          <>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white/50 text-sm">
              {data.listings.length} {data.listings.length === 1 ? 'listing' : 'listings'}
            </span>
            {confirmingClear ? (
              <div className="flex items-center gap-3">
                <span className="text-rose-200 text-sm">Delete all listings? This can't be undone.</span>
                <Button variant="danger" onClick={clearAll} disabled={clearing}>
                  {clearing ? 'Clearing…' : 'Yes, clear all'}
                </Button>
                <button
                  onClick={() => setConfirmingClear(false)}
                  disabled={clearing}
                  className="text-white/50 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingClear(true)}
                className="text-white/40 hover:text-rose-300 text-xs"
              >
                Clear all
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 text-left border-b border-white/10">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Item name</th>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium text-right">Listed</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.listings.map((l) => (
                <tr key={l.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">{l.listed_at}</td>
                  <td className="px-4 py-3 font-medium">{l.item_name}</td>
                  <td className="px-4 py-3">
                    <Pill>{l.platform || '—'}</Pill>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(l.id)}
                      className="text-white/30 hover:text-rose-300 text-xs"
                    >
                      Unlist
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-white/40 mb-1">{label}</label>
      {children}
    </div>
  )
}
