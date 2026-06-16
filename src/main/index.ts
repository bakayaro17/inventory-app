import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import { getPrintStatus, savePrintSettings, emailShipments } from './email'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 940,
    minHeight: 620,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f1226',
    title: 'Inventory',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // electron-vite injects this env var in dev; load the built file in prod.
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) {
    mainWindow.loadURL(devUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Auto-update: only check in packaged builds.
  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {})
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Expose app version to the renderer.
ipcMain.handle('app:getVersion', () => app.getVersion())

// Manual "check for updates" trigger from the UI.
ipcMain.handle('updates:check', async () => {
  if (!app.isPackaged) return { status: 'dev', message: 'Updates run only in the installed app.' }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { status: 'ok', version: result?.updateInfo?.version ?? null }
  } catch (e) {
    return { status: 'error', message: String(e) }
  }
})

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('updates:downloaded')
})

// ---- Printer email (Epson Email Print) ----
ipcMain.handle('print:getSettings', () => getPrintStatus())
ipcMain.handle('print:saveSettings', (_e, input) => savePrintSettings(input))
ipcMain.handle('print:email', (_e, payload) => emailShipments(payload))
