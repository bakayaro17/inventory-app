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
