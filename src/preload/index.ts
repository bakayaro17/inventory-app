import { contextBridge, ipcRenderer } from 'electron'

export interface PrintStatus {
  configured: boolean
  gmailUser: string
  printerEmail: string
}

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  checkForUpdates: (): Promise<{ status: string; version?: string | null; message?: string }> =>
    ipcRenderer.invoke('updates:check'),
  onUpdateDownloaded: (cb: () => void): void => {
    ipcRenderer.on('updates:downloaded', () => cb())
  },
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
