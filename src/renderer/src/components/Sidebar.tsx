import React, { useEffect, useState } from 'react'
import type { Page } from '../lib/types'
import { isDesktop } from '../lib/platform'

// Grouped so a divider sits between each cluster of related tabs.
const NAV_GROUPS: { id: Page; label: string; icon: string }[][] = [
  [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'shipments', label: 'Shipment Received', icon: '📦' },
    { id: 'inventory', label: 'Inventory', icon: '🗃️' },
    { id: 'listing', label: 'Listing', icon: '🏷️' }
  ],
  [{ id: 'outbound', label: 'Shipments', icon: '🚚' }],
  [{ id: 'items', label: 'Items', icon: '🧸' }]
]

export default function Sidebar({
  page,
  setPage,
  onReset,
  onSignOut,
  onCheckUpdates
}: {
  page: Page
  setPage: (p: Page) => void
  onReset: () => void
  onSignOut: () => void
  onCheckUpdates: () => void
}) {
  const [version, setVersion] = useState('')

  useEffect(() => {
    window.api?.getVersion().then(setVersion).catch(() => {})
  }, [])

  return (
    <aside className="w-64 shrink-0 h-screen glass border-r border-white/10 flex flex-col px-4 py-6">
      <div className="px-2 mb-8">
        <div className="text-xl font-semibold tracking-tight">Inventory</div>
        <div className="text-white/40 text-xs mt-0.5">Personal stock manager</div>
      </div>

      <nav className="flex-1">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-3 border-t border-white/10" />}
            <div className="space-y-1">
              {group.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setPage(n.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    page === n.id ? 'bg-white text-ink' : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-base">{n.icon}</span>
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 space-y-2 px-1">
        {isDesktop && (
          <>
            <button onClick={onCheckUpdates} className="text-xs text-white/50 hover:text-white/80">
              Check for updates
            </button>
            <br />
          </>
        )}
        <button onClick={onSignOut} className="text-xs text-white/50 hover:text-white/80">
          Sign out
        </button>
        <br />
        <button onClick={onReset} className="text-xs text-white/40 hover:text-white/70">
          Disconnect database
        </button>
        {isDesktop && <div className="text-[10px] text-white/30 pt-2">v{version || '—'}</div>}
      </div>
    </aside>
  )
}
