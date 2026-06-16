import { contextBridge, ipcRenderer } from 'electron'

export interface PrintStatus {
  configured: boolean
  gmailUser: string
  printerEmail: string
}

export interface UpdateStatus {
  state: 'checking' | 'available' | 'none' | 'downloading' | 'downloaded' | 'error'
  percent?: number
  version?: string
  message?: string
}

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  checkForUpdates: (): Promise<{ status: string; version?: string | null; message?: string }> =>
    ipcRenderer.invoke('updates:check'),
  onUpdateStatus: (cb: (s: UpdateStatus) => void): void => {
    ipcRenderer.on('updates:status', (_e, payload: UpdateStatus) => cb(payload))
  },
  quitAndInstall: (): Promise<void> => ipcRenderer.invoke('updates:quitAndInstall'),
  getPrintSettings: (): Promise<PrintStatus> => ipcRenderer.invoke('print:getSettings'),
  savePrintSettings: (input: {
    gmailUser: string
    printerEmail: string
    appPassword?: string
  }): Promise<PrintStatus> => ipcRenderer.invoke('print:saveSettings', input),
  emailShipments: (payload: {
    html: string
    subject: string
    filename: string
  }): Promise<{ ok: boolean; error?: string }> => ipcRenderer.invoke('print:email', payload)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
