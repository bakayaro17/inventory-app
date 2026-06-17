import React, { useEffect, useState } from 'react'
import Setup from './components/Setup'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Shipments from './pages/Shipments'
import ShipmentsOut from './pages/ShipmentsOut'
import Items from './pages/Items'
import Inventory from './pages/Inventory'
import Listing from './pages/Listing'
import Overview from './pages/Overview'
import { loadConfig, clearConfig } from './lib/config'
import { getSession, onAuthChange, signOut } from './lib/supabase'
import { useData } from './lib/useData'
import type { Page } from './lib/types'
import type { UpdateStatus } from '../../preload'

export default function App() {
  const [configured, setConfigured] = useState<boolean>(() => !!loadConfig())
  const [authed, setAuthed] = useState<boolean | null>(null) // null = still checking
  const [page, setPage] = useState<Page>('shipments')

  // Once configured, check for a saved session and react to login/logout.
  useEffect(() => {
    if (!configured) return
    let active = true
    getSession().then((s) => {
      if (active) setAuthed(!!s)
    })
    const unsub = onAuthChange((s) => setAuthed(!!s))
    return () => {
      active = false
      unsub()
    }
  }, [configured])

  if (!configured) {
    return <Setup onConnected={() => setConfigured(true)} />
  }
  if (authed === null) {
    return <div className="app-gradient min-h-screen flex items-center justify-center text-white/50">Loading…</div>
  }
  if (!authed) {
    return <Login />
  }
  return (
    <Workspace
      page={page}
      setPage={setPage}
      onReset={() => {
        clearConfig()
        setConfigured(false)
      }}
      onSignOut={() => signOut()}
    />
  )
}

function Workspace({
  page,
  setPage,
  onReset,
  onSignOut
}: {
  page: Page
  setPage: (p: Page) => void
  onReset: () => void
  onSignOut: () => void
}) {
  const data = useData()
  const [refreshing, setRefreshing] = useState(false)

  // ---- Auto-update status ----
  const [update, setUpdate] = useState<UpdateStatus | null>(null)
  const [manualCheck, setManualCheck] = useState(false)

  useEffect(() => {
    window.api?.onUpdateStatus((s) => setUpdate(s))
  }, [])

  async function checkUpdates() {
    setManualCheck(true)
    setUpdate({ state: 'checking' })
    const res = await window.api?.checkForUpdates()
    if (res?.status === 'dev') {
      setUpdate({ state: 'none', message: 'Updates run only in the installed app.' })
    } else if (res?.status === 'error') {
      setUpdate({ state: 'error', message: res.message })
    }
    // In the packaged app, the rest is driven by onUpdateStatus events.
  }

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
      <Sidebar
        page={page}
        setPage={setPage}
        onReset={onReset}
        onSignOut={onSignOut}
        onCheckUpdates={checkUpdates}
      />
      <main className="flex-1 h-screen overflow-y-auto">
        <UpdateBanner
          update={update}
          manualCheck={manualCheck}
          onRestart={() => window.api?.quitAndInstall()}
          onDismiss={() => {
            setUpdate(null)
            setManualCheck(false)
          }}
        />
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
          {page === 'outbound' && <ShipmentsOut data={data} />}
          {page === 'items' && <Items data={data} />}
          {page === 'inventory' && <Inventory data={data} />}
          {page === 'listing' && <Listing data={data} />}
          {page === 'overview' && <Overview data={data} />}
        </div>
      </main>
    </div>
  )
}

function UpdateBanner({
  update,
  manualCheck,
  onRestart,
  onDismiss
}: {
  update: UpdateStatus | null
  manualCheck: boolean
  onRestart: () => void
  onDismiss: () => void
}) {
  if (!update) return null
  const { state } = update
  // Download progress and "ready" always show; transient states only when the
  // user clicked "Check for updates" (so background checks stay quiet).
  const transient = state === 'checking' || state === 'available' || state === 'none' || state === 'error'
  if (transient && !manualCheck) return null

  const base = 'text-sm px-6 py-2 flex items-center justify-center gap-3'

  if (state === 'downloaded') {
    return (
      <div className={`${base} bg-emerald-400/20 text-emerald-100`}>
        <span>Update {update.version ? `v${update.version} ` : ''}downloaded and ready.</span>
        <button
          onClick={onRestart}
          className="rounded-lg bg-emerald-400 text-emerald-950 font-medium px-3 py-1 hover:bg-emerald-300"
        >
          Restart &amp; install
        </button>
      </div>
    )
  }

  if (state === 'downloading') {
    const pct = update.percent ?? 0
    return (
      <div className="bg-sky-400/15 text-sky-100 px-6 py-2">
        <div className="flex items-center justify-center gap-3 text-sm">
          <span>Downloading update…</span>
          <span className="tabular-nums font-medium">{pct}%</span>
        </div>
        <div className="mt-1.5 mx-auto max-w-md h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-sky-300 transition-all duration-200" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  const text =
    state === 'checking'
      ? 'Checking for updates…'
      : state === 'available'
        ? `Update ${update.version ? `v${update.version} ` : ''}found — downloading…`
        : state === 'none'
          ? update.message || "You're on the latest version."
          : `Update error: ${update.message || 'unknown error'}`

  const tone = state === 'error' ? 'bg-rose-500/20 text-rose-100' : 'bg-white/10 text-white/80'
  const dismissable = state === 'none' || state === 'error'

  return (
    <div className={`${base} ${tone}`}>
      <span>{text}</span>
      {dismissable && (
        <button onClick={onDismiss} className="text-white/50 hover:text-white" title="Dismiss">
          ✕
        </button>
      )}
    </div>
  )
}
