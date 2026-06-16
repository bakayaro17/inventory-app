import React, { useState } from 'react'
import { Card, EmptyState, Pill } from '../components/ui'
import PageHeader from '../components/PageHeader'
import { computeInventory } from '../lib/db'
import type { DataState } from '../lib/useData'

export default function Inventory({ data }: { data: DataState }) {
  const [showHidden, setShowHidden] = useState(false)
  const rows = computeInventory(data.shipments, data.listings, data.outbound)
  const inStock = rows.filter((r) => r.available > 0)
  const depleted = rows.filter((r) => r.available <= 0)
  const visible = showHidden ? rows : inStock

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Live stock available to list — received minus everything already listed."
        action={
          depleted.length > 0 ? (
            <button
              onClick={() => setShowHidden((v) => !v)}
              className="text-xs text-white/50 hover:text-white/80"
            >
              {showHidden ? 'Hide' : 'Show'} {depleted.length} depleted item{depleted.length > 1 ? 's' : ''}
            </button>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState
            title="Nothing in stock"
            hint="Add shipments, or everything you have is fully listed."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/50 text-left border-b border-white/10">
                <th className="px-4 py-3 font-medium">Item name</th>
                <th className="px-4 py-3 font-medium text-right">Received</th>
                <th className="px-4 py-3 font-medium text-right">Listed</th>
                <th className="px-4 py-3 font-medium text-right">Shipped</th>
                <th className="px-4 py-3 font-medium text-right">Available</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.item_name}
                  className={`border-b border-white/5 hover:bg-white/5 ${r.available <= 0 ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium">{r.item_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/60">{r.received}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/60">{r.listed}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-white/60">{r.shipped}</td>
                  <td className="px-4 py-3 text-right">
                    {r.available > 0 ? (
                      <Pill tone="good">{r.available}</Pill>
                    ) : (
                      <Pill tone="warn">0</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
