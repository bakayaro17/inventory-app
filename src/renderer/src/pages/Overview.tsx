import React, { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card } from '../components/ui'
import PageHeader from '../components/PageHeader'
import { totalsForPeriod, listingsByPlatform } from '../lib/stats'
import type { DataState } from '../lib/useData'
import type { Period } from '../lib/types'

const PERIODS: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' }
]

const FLOW_COLORS = ['#34d399', '#f472b6'] // received, listed
const PLATFORM_COLORS = ['#60a5fa', '#fbbf24', '#a78bfa', '#f87171', '#34d399', '#f472b6']

export default function Overview({ data }: { data: DataState }) {
  const [period, setPeriod] = useState<Period>('daily')
  const totals = totalsForPeriod(data.shipments, data.listings, period)
  const platformData = listingsByPlatform(data.listings, period)

  const flowData = [
    { name: 'Received', value: totals.received },
    { name: 'Listed', value: totals.listed }
  ].filter((d) => d.value > 0)

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="How much you received vs. listed, at a glance."
        action={
          <div className="flex gap-1 rounded-xl bg-white/10 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p.id ? 'bg-white text-ink' : 'text-white/60 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Received" value={totals.received} hint={`${totals.receivedItems} item types`} />
        <Stat label="Listed" value={totals.listed} hint={`${totals.listedItems} item types`} />
        <Stat
          label="Net change"
          value={totals.received - totals.listed}
          hint="received − listed"
          signed
        />
        <Stat
          label="Total in stock"
          value={data.shipments.reduce((a, s) => a + (s.quantity || 0), 0) -
            data.listings.reduce((a, l) => a + (l.quantity || 0), 0)}
          hint="all time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-white/70 mb-4">Received vs. Listed</h3>
          {flowData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={flowData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {flowData.map((_, i) => (
                    <Cell key={i} fill={FLOW_COLORS[i % FLOW_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e2233', border: 'none', borderRadius: 12, color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#fff', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-white/70 mb-4">Listings by platform</h3>
          {platformData.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={platformData} dataKey="value" nameKey="name" outerRadius={95} paddingAngle={3}>
                  {platformData.map((_, i) => (
                    <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e2233', border: 'none', borderRadius: 12, color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#fff', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  signed
}: {
  label: string
  value: number
  hint?: string
  signed?: boolean
}) {
  const display = signed && value > 0 ? `+${value}` : `${value}`
  return (
    <Card className="p-5">
      <div className="text-white/50 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-semibold mt-1 tabular-nums">{display}</div>
      {hint && <div className="text-white/40 text-xs mt-1">{hint}</div>}
    </Card>
  )
}

function Empty() {
  return (
    <div className="h-[260px] flex items-center justify-center text-white/40 text-sm">
      No data for this period yet.
    </div>
  )
}
