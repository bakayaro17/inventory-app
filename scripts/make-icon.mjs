// One-off: rasterizes build/icon.svg -> build/icon.png (1024x1024) using the
// already-installed Electron (offscreen rendering), so no extra image deps are
// needed. electron-builder then generates the .ico / .icns from the PNG.
//
//   npx electron scripts/make-icon.mjs
import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const buildDir = join(__dirname, '..', 'build')
const svg = readFileSync(join(buildDir, 'icon.svg'), 'utf8')

const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>
</head><body>${svg}</body></html>`

app.disableHardwareAcceleration()

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true }
  })

  win.webContents.once('paint', (_e, _dirty, image) => {
    writeFileSync(join(buildDir, 'icon.png'), image.toPNG())
    console.log('Wrote build/icon.png')
    app.exit(0)
  })

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
})
