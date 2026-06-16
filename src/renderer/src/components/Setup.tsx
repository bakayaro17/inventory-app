import React, { useState } from 'react'
import { Card, Button, Input } from './ui'
import { saveConfig } from '../lib/config'
import { testConnection } from '../lib/supabase'

export default function Setup({ onConnected }: { onConnected: () => void }) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [status, setStatus] = useState<'idle' | 'testing' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function connect() {
    if (!url.trim() || !anonKey.trim()) {
      setStatus('error')
      setMessage('Both the Project URL and anon key are required.')
      return
    }
    setStatus('testing')
    setMessage('')
    const cfg = { url: url.trim().replace(/\/+$/, ''), anonKey: anonKey.trim() }
    const res = await testConnection(cfg)
    if (res.ok) {
      saveConfig(cfg)
      onConnected()
    } else {
      setStatus('error')
      setMessage(
        res.error?.includes('relation') || res.error?.includes('does not exist')
          ? 'Connected, but tables are missing. Run supabase/schema.sql in your project first.'
          : `Could not connect: ${res.error}`
      )
    }
  }

  return (
    <div className="app-gradient min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-lg p-8">
        <h1 className="text-2xl font-semibold text-white">Connect your inventory</h1>
        <p className="text-white/60 text-sm mt-2">
          Your data syncs through a free Supabase project so it's available on every computer. Paste your
          project details below — you only do this once per device.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wide text-white/50">Project URL</label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxxxx.supabase.co"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-white/50">Anon public key</label>
            <Input
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              type="password"
            />
          </div>
        </div>

        {status === 'error' && <p className="text-rose-300 text-sm mt-4">{message}</p>}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={connect} disabled={status === 'testing'}>
            {status === 'testing' ? 'Connecting…' : 'Connect'}
          </Button>
          <span className="text-white/40 text-xs">
            Find these in Supabase → Project Settings → API
          </span>
        </div>

        <div className="mt-6 rounded-xl bg-white/5 p-4 text-xs text-white/50 leading-relaxed">
          <span className="text-white/70 font-medium">First time?</span> Create a free project at
          supabase.com, open the SQL Editor, and run the <code className="text-white/70">supabase/schema.sql</code>{' '}
          file included with this app. Then come back here.
        </div>
      </Card>
    </div>
  )
}
