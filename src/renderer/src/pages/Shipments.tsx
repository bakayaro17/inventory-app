import React, { useMemo, useState } from 'react'
import { Card, Button, Input, EmptyState } from '../components/ui'
import { Autocomplete } from '../components/Autocomplete'
import PageHeader from '../components/PageHeader'
import { addShipment, deleteShipment, knownItems } from '../lib/db'
import type { DataState } from '../lib/useData'

const today = () => new Date().toISOString().slice(0, 10)

export default function Shipments({ data }: { data: DataState }) {
  const itemOptions = useMemo(
    () => knownItems(data.shipments, data.items),
    [data.shipments, data.items]
  )
  const [date, setDate] = useState(today())
  const [retailer, setRetailer] = useState('')
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)

  async function add() {
    const qty = parseInt(quantity, 10)
    if (!itemName.trim() || !qty || qty <= 0) return
    setSaving(true)
    try {
      await addShipment({
        date,
        retailer: retailer.trim(),
        item_name: itemName.trim(),
        quantity: qty
      })
      setRetailer('')
      setItemName('')
      setQuantity('')
      await data.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await deleteShipment(id)
    await data.refresh()
  }

  return (
    <div>
      <PageHeader
        title="Shipment Received"
        subtitle="Log each shipment as it arrives. Quantities roll up into Inventory automatically."
      />

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[150px_1fr_1fr_110px_auto] gap-3 items-end">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Retailer">
            <Input value={retailer} onChange={(e) => setRetailer(e.target.value)} placeholder="e.g. Amazon" />
          </Field>
          <Field label="Item name">
            <Autocomplete
              value={itemName}
              onChange={setItemName}
              options={itemOptions}
              placeholder="Pick or type an item…"
              onEnterEmpty={add}
            />
          </Field>
          <Field label="Quantity">
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
          </Field>
          <Button onClick={add} disabled={saving}>
            Add
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {data.shipments.length === 0 ? (
          <EmptyState title="No shipments yet" hint="Add your first shipment above." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 text-left border-b border-white/10">
                <Th>Date</Th>
                <Th>Retailer</Th>
                <Th>Item name</Th>
                <Th className="text-right">Quantity</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {data.shipments.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <Td>{s.date}</Td>
                  <Td>{s.retailer || <span className="text-white/30">—</span>}</Td>
                  <Td className="font-medium">{s.item_name}</Td>
                  <Td className="text-right tabular-nums">{s.quantity}</Td>
                  <Td className="text-right">
                    <button
                      onClick={() => remove(s.id)}
                      className="text-white/30 hover:text-rose-300 text-xs"
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
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

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}
function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}
