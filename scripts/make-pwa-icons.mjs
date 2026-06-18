// One-off: renders build/icon-square.svg at 512px (Electron offscreen) and
// downscales it to the PNG sizes the PWA / iOS "Add to Home Screen" needs,
// written to src/renderer/public/. No extra image deps.
//
//   npx electron scripts/make-pwa-icons.mjs
import { app, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = readFileSync(join(root, 'build', 'icon-square.svg'), 'utf8')
const publicDir = join(root, 'src', 'renderer', 'public')

app.disableHardwareAcceleration()
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 512, height: 512, show: false, webPreferences: { offscreen: true } })
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0}svg{display:block;width:512px;height:512px}</style>
</head><body>${svg}</body></html>`

  win.webContents.once('paint', (_e, _dirty, image) => {
    const out = [
      ['icon-512.png', image],
      ['icon-192.png', image.resize({ width: 192, height: 192, quality: 'best' })],
      ['apple-touch-icon.png', image.resize({ width: 180, height: 180, quality: 'best' })]
    ]
    for (const [name, img] of out) {
      writeFileSync(join(publicDir, name), img.toPNG())
      console.log('Wrote', name)
    }
    app.exit(0)
  })

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
})
