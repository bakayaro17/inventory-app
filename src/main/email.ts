import { app, BrowserWindow, safeStorage } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import nodemailer from 'nodemailer'

interface StoredSettings {
  gmailUser: string
  printerEmail: string
  passwordEnc?: string // base64 of safeStorage-encrypted Gmail app password
}

export interface PrintStatus {
  configured: boolean
  gmailUser: string
  printerEmail: string
}

const settingsPath = (): string => join(app.getPath('userData'), 'print-settings.json')

function readSettings(): StoredSettings | null {
  try {
    const p = settingsPath()
    if (!existsSync(p)) return null
    return JSON.parse(readFileSync(p, 'utf8')) as StoredSettings
  } catch {
    return null
  }
}

export function getPrintStatus(): PrintStatus {
  const s = readSettings()
  return {
    configured: !!(s?.gmailUser && s?.printerEmail && s?.passwordEnc),
    gmailUser: s?.gmailUser ?? '',
    printerEmail: s?.printerEmail ?? ''
  }
}

export function savePrintSettings(input: {
  gmailUser: string
  printerEmail: string
  appPassword?: string
}): PrintStatus {
  const cur = readSettings()
  const next: StoredSettings = {
    gmailUser: input.gmailUser.trim(),
    printerEmail: input.printerEmail.trim(),
    passwordEnc: cur?.passwordEnc
  }
  // Only overwrite the stored password when a new one is supplied.
  const pw = input.appPassword?.trim()
  if (pw) {
    next.passwordEnc = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(pw).toString('base64')
      : Buffer.from(pw, 'utf8').toString('base64')
  }
  writeFileSync(settingsPath(), JSON.stringify(next), 'utf8')
  return getPrintStatus()
}

function decryptPassword(enc: string): string {
  const buf = Buffer.from(enc, 'base64')
  if (safeStorage.isEncryptionAvailable()) {
    try {
      return safeStorage.decryptString(buf)
    } catch {
      /* fall through to plain decode if it was stored unencrypted */
    }
  }
  return buf.toString('utf8')
}

/** Render an HTML string to a PDF buffer using a hidden window. */
async function htmlToPdf(html: string): Promise<Buffer> {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: false } })
  try {
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
    return await win.webContents.printToPDF({ printBackground: true, pageSize: 'Letter' })
  } finally {
    if (!win.isDestroyed()) win.destroy()
  }
}

export async function emailShipments(payload: {
  html: string
  subject: string
  filename: string
}): Promise<{ ok: boolean; error?: string }> {
  const s = readSettings()
  if (!s?.gmailUser || !s?.printerEmail || !s?.passwordEnc) {
    return { ok: false, error: 'Printer email is not set up yet. Open Printer setup first.' }
  }
  try {
    const pdf = await htmlToPdf(payload.html)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: s.gmailUser, pass: decryptPassword(s.passwordEnc) }
    })
    await transporter.sendMail({
      from: s.gmailUser,
      to: s.printerEmail,
      subject: payload.subject,
      text: 'Shipments PDF attached (sent from the Inventory app).',
      attachments: [{ filename: payload.filename, content: pdf }]
    })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
