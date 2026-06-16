import React, { useEffect, useState } from 'react'
import { Card, Button, Input } from './ui'

export default function PrintSettings({ onClose }: { onClose: () => void }) {
  const [gmailUser, setGmailUser] = useState('')
  const [printerEmail, setPrinterEmail] = useState('elvistran94@print.epsonconnect.com')
  const [appPassword, setAppPassword] = useState('')
  const [configured, setConfigured] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    window.api?.getPrintSettings().then((s) => {
      if (s.gmailUser) setGmailUser(s.gmailUser)
      if (s.printerEmail) setPrinterEmail(s.printerEmail)
      setConfigured(s.configured)
    })
  }, [])

  async function save() {
    if (!gmailUser.trim() || !printerEmail.trim()) {
      setStatus('error')
      setMessage('Gmail address and printer email are both required.')
      return
    }
    if (!configured && !appPassword.trim()) {
      setStatus('error')
      setMessage('Enter your Gmail App Password to finish setup.')
      return
    }
    setStatus('saving')
    setMessage('')
    try {
      const res = await window.api!.savePrintSettings({
        gmailUser: gmailUser.trim(),
        printerEmail: printerEmail.trim(),
        appPassword: appPassword.trim() || undefined
      })
      setConfigured(res.configured)
      setAppPassword('')
      setStatus('saved')
      setMessage('Saved.')
    } catch (e) {
      setStatus('error')
      setMessage(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onMouseDown={onClose}
    >
      <Card className="w-full max-w-lg p-6" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white">Printer setup</h2>
        <p className="text-white/60 text-sm mt-1">
          Print emails a PDF of the day's shipments to your Epson printer from your Gmail.
        </p>

        <div className="mt-5 space-y-4">
          <Labeled label="Your Gmail address">
            <Input
              value={gmailUser}
              onChange={(e) => setGmailUser(e.target.value)}
              placeholder="you@gmail.com"
            />
          </Labeled>
          <Labeled label="Gmail App Password">
            <Input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder={configured ? '•••••••• (saved — leave blank to keep)' : '16-character app password'}
            />
            <p className="text-white/40 text-xs mt-1">
              Google Account → Security → 2-Step Verification → App passwords. Stored encrypted on this
              device.
            </p>
          </Labeled>
          <Labeled label="Printer email (Epson Connect)">
            <Input
              value={printerEmail}
              onChange={(e) => setPrinterEmail(e.target.value)}
              placeholder="xxxx@print.epsonconnect.com"
            />
          </Labeled>
        </div>

        {message && (
          <p className={`text-sm mt-4 ${status === 'error' ? 'text-rose-300' : 'text-emerald-300'}`}>
            {message}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={save} disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-white/40 mb-1">{label}</label>
      {children}
    </div>
  )
}
