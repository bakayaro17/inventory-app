import React, { useEffect, useMemo, useRef, useState } from 'react'

const inputCls =
  'w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30'

/**
 * A free-text input with a filtered suggestion dropdown. Users can pick a
 * suggestion or type any value. Pass `options` for small in-memory lists, or
 * `getMatches` for large datasets (e.g. US cities) that filter themselves.
 */
export function Autocomplete({
  value,
  onChange,
  options,
  getMatches,
  placeholder,
  minChars = 1,
  maxResults = 30,
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
  onEnterEmpty?: () => void // called when Enter is pressed and no list is open
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (q.length < minChars) return []
    if (getMatches) return getMatches(q).slice(0, maxResults)
    return (options ?? [])
      .filter((o) => o.toLowerCase().includes(q))
      .sort((a, b) => {
        const ap = a.toLowerCase().startsWith(q) ? 0 : 1
        const bp = b.toLowerCase().startsWith(q) ? 0 : 1
        return ap - bp || a.localeCompare(b)
      })
      .slice(0, maxResults)
  }, [value, options, getMatches, minChars, maxResults])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showList = open && matches.length > 0

  function choose(v: string) {
    onChange(v)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
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
              setHi((h) => Math.min(h + 1, matches.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setHi((h) => Math.max(h - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              choose(matches[hi])
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
      {showList && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-white/10 bg-ink shadow-xl">
          {matches.map((m, idx) => (
            <li
              key={m}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(m)
              }}
              onMouseEnter={() => setHi(idx)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                idx === hi ? 'bg-white/15 text-white' : 'text-white/80'
              }`}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
