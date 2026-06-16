import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  checkForUpdates: (): Promise<{ status: string; version?: string | null; message?: string }> =>
    ipcRenderer.invoke('updates:check'),
  onUpdateDownloaded: (cb: () => void): void => {
    ipcRenderer.on('updates:downloaded', () => cb())
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
