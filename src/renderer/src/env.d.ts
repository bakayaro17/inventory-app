/// <reference types="vite/client" />

import type { Api } from '../../preload'

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_LOGIN_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    // Present only in the Electron shell (injected by the preload script);
    // undefined in the browser / PWA. See lib/platform.ts.
    api?: Api
  }
}

export {}
