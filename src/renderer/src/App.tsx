import React, { useEffect, useState } from 'react'
import Setup from './components/Setup'
import Sidebar from './components/Sidebar'
import Shipments from './pages/Shipments'
import Inventory from './pages/Inventory'
import Listing from './pages/Listing'
import Overview from './pages/Overview'
import { loadConfig, clearConfig } from './lib/config'
import { useData } from './lib/useData'
import type { Page } from './lib/types'

export default function App() {
  const [configured, setConfigured] = useState<boolean>(() => !!loadConfig())
  const [page, setPage] = useState<Page>('shipments')
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    window.api?.onUpdateDownloaded(() => setUpdateReady(true))
  }, [])

  if (!configured) {
    return <Setup onConnected={() => setConfigured(true)} />
  }
  return (
    <Workspace
      page={page}
      setPage={setPage}
      updateReady={updateReady}
      onReset={() => {
        clearConfig()
        setConfigured(false)
      }}
    />
  )
}

function Workspace({
  page,
  setPage,
  updateReady,
  onReset
}: {
  page: Page
  setPage: (p: Page) => void
  updateReady: boolean
  onReset: () => void
}) {
  const data = useData()
  const [refreshing, setRefreshing] = useState(false)

  const refresh = async () => {
    setRefreshing(true)
    try {
      await data.refresh()
    } finally {
      setRefreshing(false)
    }
  }

  // Pull the latest from Supabase whenever the window regains focus, so edits
  // made on another computer show up without a manual refresh or restart.
  useEffect(() => {
    const onFocus = () => data.refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [data])

  return (
    <div className="app-gradient min-h-screen flex text-white">
      <Sidebar page={page} setPage={setPage} onReset={onReset} />
      <main className="flex-1 h-screen overflow-y-auto">
        {updateReady && (
          <div className="bg-emerald-400/20 text-emerald-100 text-sm px-6 py-2 text-center">
            An update has been downloaded — it will install next time you restart.
          </div>
        )}
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex justify-end mb-4">
            <button
              onClick={refresh}
              disabled={refreshing || data.loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-sm text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
              title="Reload data from the cloud"
            >
              <svg
                className={`h-4 w-4 ${refreshing || data.loading ? 'animate-spin' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <path d="M21 3v6h-6" />
              </svg>
              {refreshing || data.loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          {data.error && (
            <div className="mb-6 rounded-xl bg-rose-500/20 border border-rose-400/30 px-4 py-3 text-rose-100 text-sm">
              {data.error}
            </div>
          )}
          {page === 'shipments' && <Shipments data={data} />}
          {page === 'inventory' && <Inventory data={data} />}
          {page === 'listing' && <Listing data={data} />}
          {page === 'overview' && <Overview data={data} />}
        </div>
      </main>
    </div>
  )
}
