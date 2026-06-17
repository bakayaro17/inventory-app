import React, { useEffect, useRef, useState } from 'react'
import { Card, Button, Input } from './ui'
import { signIn } from '../lib/supabase'
import { getLoginEmail } from '../lib/defaults'

// Passwords are a fixed length, so we auto-submit once the field is full —
// like an iPhone passcode (no Enter needed; wrong codes shake and clear).
const PASSCODE_LENGTH = 6

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
  const [errorNonce, setErrorNonce] = useState(0) // bumps to replay the shake
  const submitting = useRef(false)

  async function attempt(pwd: string) {
    if (submitting.current) return
    if (!email.trim() || !pwd) {
      setStatus('error')
      setMessage(bakedEmail ? 'Enter your password.' : 'Email and password are required.')
      setErrorNonce((n) => n + 1)
      return
    }
    submitting.current = true
    setStatus('signing')
    setMessage('')
    const res = await signIn(email.trim(), pwd)
    submitting.current = false
    if (!res.ok) {
      setStatus('error')
      setMessage(
        res.error?.toLowerCase().includes('invalid')
          ? 'Incorrect password.'
          : `Could not sign in: ${res.error}`
      )
      setPassword('')
      setErrorNonce((n) => n + 1)
    }
    // On success, the auth listener in App.tsx switches to the workspace.
  }

  // Auto-submit the moment the passcode is complete.
  useEffect(() => {
    if (password.length === PASSCODE_LENGTH) void attempt(password)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password])

  return (
    <div className="app-gradient min-h-screen flex items-center justify-center p-6">
      <Card key={errorNonce} className={`w-full max-w-sm p-8 ${status === 'error' ? 'shake' : ''}`}>
        <div className="text-center">
          <div className="text-3xl mb-3">🔒</div>
          <h1 className="text-2xl font-semibold text-white">Inventory</h1>
          <p className="text-white/60 text-sm mt-2">Enter your password to continue.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void attempt(password)
          }}
          className="mt-6 space-y-4"
        >
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
              placeholder="••••••"
              type="password"
              maxLength={PASSCODE_LENGTH}
              autoComplete="current-password"
              autoFocus
              disabled={status === 'signing'}
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
