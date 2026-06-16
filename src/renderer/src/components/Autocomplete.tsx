import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const inputCls =
  'w-full rounded-lg bg-white/10 border border-white/10 pl-3 pr-9 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'

type Entry = { kind: 'option'; label: string } | { kind: 'create'; label: string }

/**
 * A combobox: a text box that opens a dropdown of suggestions. Click to see the
 * full list (for the in-memory `options` variant), type to filter. With
 * `allowCreate`, when the typed text matches nothing it offers a "Use \"…\"" row
 * so a brand-new value can be chosen. For large datasets pass `getMatches`.
 *
 * The dropdown renders in a portal at document.body (positioned under the input)
 * so it can't be clipped or covered by sibling cards — `.glass` cards each
 * create a stacking context via backdrop-filter, which would otherwise trap it.
 */
export function Autocomplete({
  value,
  onChange,
  options,
  getMatches,
  placeholder,
  minChars = 1,
  maxResults = 50,
  allowCreate = false,
  onEnterEmpty,
  className = ''
}: {
  value: string
  onChange: (v: string) => void
  options?: string[]
  getMatches?: (q: string) => string[]
  placeholder?: string
  minChars?: number
  maxResults?: number
  allowCreate?: boolean
  onEnterEmpty?: () => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const trimmed = value.trim()
  const lower = trimmed.toLowerCase()

  const matches = useMemo(() => {
    if (getMatches) {
      if (lower.length < minChars) return []
      return getMatches(lower).slice(0, maxResults)
    }
    const opts = options ?? []
    if (lower.length === 0) return opts.slice(0, maxResults) // empty → show all
    return opts
      .filter((o) => o.toLowerCase().includes(lower))
      .sort((a, b) => {
        const ap = a.toLowerCase().startsWith(lower) ? 0 : 1
        const bp = b.toLowerCase().startsWith(lower) ? 0 : 1
        return ap - bp || a.localeCompare(b)
      })
      .slice(0, maxResults)
  }, [lower, options, getMatches, minChars, maxResults])

  const exactMatch = matches.some((m) => m.toLowerCase() === lower)
  const showCreate = allowCreate && trimmed.length > 0 && !exactMatch

  const entries: Entry[] = [
    ...matches.map((m) => ({ kind: 'option' as const, label: m })),
    ...(showCreate ? [{ kind: 'create' as const, label: trimmed }] : [])
  ]
  const showList = open && entries.length > 0

  // Keep the portal dropdown aligned under the input while open.
  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const el = inputRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setRect({ left: r.left, top: r.bottom + 4, width: r.width })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true) // capture: any scrolling ancestor
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, entries.length])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function choose(entry: Entry) {
    onChange(entry.label)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHi(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (showList) {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setHi((h) => Math.min(h + 1, entries.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHi((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              choose(entries[hi])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          } else if (e.key === 'Enter') {
            onEnterEmpty?.()
          }
        }}
        placeholder={placeholder}
        className={`${inputCls} ${className}`}
        autoComplete="off"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => {
          setOpen((o) => !o)
          inputRef.current?.focus()
        }}
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-white/40 hover:text-white/70"
        aria-label="Toggle list"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {showList &&
        rect &&
        createPortal(
          <ul
            ref={listRef}
            style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width, zIndex: 1000 }}
            className="max-h-60 overflow-auto rounded-lg border border-white/10 bg-ink shadow-2xl"
          >
            {entries.map((entry, idx) => (
              <li
                key={entry.kind + entry.label}
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(entry)
                }}
                onMouseEnter={() => setHi(idx)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  idx === hi ? 'bg-white/15 text-white' : 'text-white/80'
                }`}
              >
                {entry.kind === 'create' ? (
                  <span>
                    Use “<span className="font-medium">{entry.label}</span>”
                    <span className="text-white/40"> — new item</span>
                  </span>
                ) : (
                  entry.label
                )}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  )
}
