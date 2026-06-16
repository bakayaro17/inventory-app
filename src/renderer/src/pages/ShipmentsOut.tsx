import React, { useMemo, useState } from 'react'
import { Card, Button, Input, EmptyState } from '../components/ui'
import { Autocomplete } from '../components/Autocomplete'
import PageHeader from '../components/PageHeader'
import { addOutbound, deleteOutbound, knownItems } from '../lib/db'
import { searchCities } from '../data/cities'
import { printShipments, buildShipmentsHtml } from '../lib/print'
import PrintSettings from '../components/PrintSettings'
import type { DataState } from '../lib/useData'
import type { ShipmentLine } from '../lib/types'

const today = () => new Date().toISOString().slice(0, 10)

const fmtDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

/** "Purple Swirlies, blue nice cream (×2)" — quantity shown only when > 1. */
export function lineSummary(items: ShipmentLine[]): string {
  return items
    .filter((l) => l.item_name?.trim())
    .map((l) => (l.quantity > 1 ? `${l.item_name} (×${l.quantity})` : l.item_name))
    .join(', ')
}

export default function ShipmentsOut({ data }: { data: DataState }) {
  const itemOptions = useMemo(
    () => knownItems(data.shipments, data.items),
    [data.shipments, data.items]
  )

  const [date, setDate] = useState(today())
  const [lines, setLines] = useState<ShipmentLine[]>([{ item_name: '', quantity: 1 }])
  const [shipTo, setShipTo] = useState('')
  const [initials, setInitials] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Dates that have shipments, plus today, newest first — these are the tabs.
  const dates = useMemo(() => {
    const set = new Set(data.outbound.map((o) => o.date))
    set.add(today())
    return [...set].sort().reverse()
  }, [data.outbound])

  const [activeDate, setActiveDate] = useState(today())
  const dayShipments = data.outbound.filter((o) => o.date === activeDate)

  const [showSettings, setShowSettings] = useState(false)
  const [sending, setSending] = useState(false)
  const [printMsg, setPrintMsg] = useState('')

  async function emailDay() {
    if (dayShipments.length === 0) return
    setSending(true)
    setPrintMsg('')
    try {
      const res = await window.api?.emailShipments({
        html: buildShipmentsHtml(activeDate, dayShipments),
        subject: `Shipments ${activeDate}`,
        filename: `shipments-${activeDate}.pdf`
      })
      if (res?.ok) {
        setPrintMsg('Sent to printer ✓')
      } else {
        setPrintMsg(res?.error || 'Could not send.')
        if (res?.error?.toLowerCase().includes('set up')) setShowSettings(true)
      }
    } catch (e) {
      setPrintMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setSending(false)
    }
  }

  function setLine(i: number, patch: Partial<ShipmentLine>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }
  function addLine() {
    setLines((ls) => [...ls, { item_name: '', quantity: 1 }])
  }
  function removeLine(i: number) {
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, idx) => idx !== i)))
  }

  async function save() {
    setError('')
    const items = lines
      .map((l) => ({ item_name: l.item_name.trim(), quantity: Number(l.quantity) || 0 }))
      .filter((l) => l.item_name && l.quantity > 0)
    if (items.length === 0) return setError('Add at least one item with a quantity.')
    if (!shipTo.trim()) return setError('Enter a Ship To city.')
    setSaving(true)
    try {
      await addOutbound({ date, ship_to: shipTo.trim(), initials: initials.trim(), items })
      setLines([{ item_name: '', quantity: 1 }])
      setShipTo('')
      setInitials('')
      setActiveDate(date)
      await data.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await deleteOutbound(id)
    await data.refresh()
  }

  return (
    <div>
      <PageHeader
        title="Shipments"
        subtitle="Log outbound orders by day. Each shipment can hold several items and reduces your available inventory."
      />

      {/* Add form */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-white/40 mb-1">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <label className="block text-xs uppercase tracking-wide text-white/40 mb-1 mt-4">
              Ship To
            </label>
            <Autocomplete
              value={shipTo}
              onChange={setShipTo}
              getMatches={(q) => searchCities(q)}
              minChars={2}
              placeholder="Search US city…"
            />
            <label className="block text-xs uppercase tracking-wide text-white/40 mb-1 mt-4">
              Initials
            </label>
            <Input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="e.g. AT" />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wide text-white/40 mb-1">Items</label>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <Autocomplete
                      value={l.item_name}
                      onChange={(v) => setLine(i, { item_name: v })}
                      options={itemOptions}
                      placeholder="Pick or type an item…"
                    />
                  </div>
                  <div className="w-20 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      value={String(l.quantity)}
                      onChange={(e) => setLine(i, { quantity: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <button
                    onClick={() => removeLine(i)}
                    disabled={lines.length === 1}
                    className="shrink-0 text-white/30 hover:text-rose-300 disabled:opacity-30 px-1"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addLine} className="mt-2 text-xs text-white/60 hover:text-white">
              + Add another item
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Add shipment'}
          </Button>
          {error && <span className="text-rose-300 text-sm">{error}</span>}
        </div>
      </Card>

      {/* Date tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {dates.map((d) => {
          const count = data.outbound.filter((o) => o.date === d).length
          return (
            <button
              key={d}
              onClick={() => setActiveDate(d)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                d === activeDate ? 'bg-white text-ink' : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {fmtDate(d)}
              {count > 0 && (
                <span className={`ml-2 text-xs ${d === activeDate ? 'text-ink/60' : 'text-white/40'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Day table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="font-medium">{fmtDate(activeDate)}</div>
          <div className="flex items-center gap-2">
            {printMsg && (
              <span
                className={`text-xs ${printMsg.includes('✓') ? 'text-emerald-300' : 'text-rose-300'}`}
              >
                {printMsg}
              </span>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="text-xs text-white/50 hover:text-white/80 px-2"
              title="Printer setup"
            >
              ⚙ Setup
            </button>
            <Button
              variant="ghost"
              onClick={() => printShipments(activeDate, dayShipments)}
              disabled={dayShipments.length === 0}
            >
              Save PDF
            </Button>
            <Button onClick={emailDay} disabled={dayShipments.length === 0 || sending}>
              {sending ? 'Sending…' : '🖨️ Print'}
            </Button>
          </div>
        </div>
        {dayShipments.length === 0 ? (
          <EmptyState title="No shipments for this day" hint="Add one above, or pick another date." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 text-left border-b border-white/10">
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Ship To</th>
                <th className="px-4 py-3 font-medium">Initials</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {dayShipments.map((o) => (
                <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 align-top">
                  <td className="px-4 py-3">{lineSummary(o.items)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {o.ship_to || <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {o.initials || <span className="text-white/30">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(o.id)}
                      className="text-white/30 hover:text-rose-300 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showSettings && <PrintSettings onClose={() => setShowSettings(false)} />}
    </div>
  )
}
