import React, { useState } from 'react'
import { Card, Button, Input } from './ui'
import { signIn } from '../lib/supabase'
import { getLoginEmail } from '../lib/defaults'

/**
 * Single-account lock screen. When VITE_LOGIN_EMAIL is baked into the build it
 * shows only a password field (iPhone-passcode style); otherwise it also asks
 * for the email. On success, onAuthChange in App swaps to the workspace.
 */
export default function Login() {
  const bakedEmail = getLoginEmail()
  const [email, setEmail] = useState(bakedEmail)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'signing' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!email.trim() || !password) {
      setStatus('error')
      setMessage(bakedEmail ? 'Enter your password.' : 'Email and password are required.')
      return
    }
    setStatus('signing')
    setMessage('')
    const res = await signIn(email.trim(), password)
    if (!res.ok) {
      setStatus('error')
      setMessage(
        res.error?.toLowerCase().includes('invalid')
          ? 'Incorrect password.'
          : `Could not sign in: ${res.error}`
      )
      setPassword('')
    }
    // On success, the auth listener in App.tsx switches to the workspace.
  }

  return (
    <div className="app-gradient min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm p-8">
        <div className="text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h1 className="text-2xl font-semibold text-white">Inventory</h1>
          <p className="text-white/60 text-sm mt-2">Enter your password to continue.</p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!bakedEmail && (
            <div>
              <label className="text-xs uppercase tracking-wide text-white/50">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="username"
              />
            </div>
          )}
          <div>
            <label className="text-xs uppercase tracking-wide text-white/50">Password</label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              autoFocus
            />
          </div>

          {status === 'error' && <p className="text-rose-300 text-sm">{message}</p>}

          <Button type="submit" disabled={status === 'signing'} className="w-full">
            {status === 'signing' ? 'Signing in…' : 'Unlock'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
