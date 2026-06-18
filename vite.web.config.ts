import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone web build of the renderer for hosting as a PWA (Cloudflare Pages).
// The Electron build still uses electron.vite.config.ts; this reuses the exact
// same renderer source. VITE_* env vars (.env locally, host settings in CI) are
// baked in just like the desktop build.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  // .env lives at the project root, not under src/renderer (which is `root`).
  // On Cloudflare the VITE_* values come from the dashboard env instead.
  envDir: __dirname,
  base: '/',
  plugins: [react()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src/renderer/src') }
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
})
