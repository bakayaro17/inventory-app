/**
 * True only inside the Electron desktop shell, where the preload script injects
 * `window.api`. In the browser / installed PWA it's undefined, so desktop-only
 * features (auto-update, email-to-printer) are hidden and their bridge calls
 * are skipped.
 */
export const isDesktop = typeof window !== 'undefined' && window.api != null
