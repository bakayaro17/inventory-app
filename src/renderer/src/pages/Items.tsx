import React, { useEffect, useRef, useState } from 'react'
import { Card, Button, Input, EmptyState } from '../components/ui'
import PageHeader from '../components/PageHeader'
import { addItem, updateItem, deleteItem } from '../lib/db'
import { fileToResizedDataUrl } from '../lib/image'
import type { DataState } from '../lib/useData'
import type { ItemPreset } from '../lib/types'

export default function Items({ data }: { data: DataState }) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<ItemPreset | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      setPhoto(await fileToResizedDataUrl(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function add() {
    if (!name.trim()) return setError('Give the item a name.')
    setSaving(true)
    setError('')
    try {
      await addItem({ name: name.trim(), photo })
      setName('')
      setPhoto(null)
      if (fileRef.current) fileRef.current.value = ''
      await data.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    await deleteItem(id)
    await data.refresh()
  }

  return (
    <div>
      <PageHeader
        title="Items"
        subtitle="Build a library of items you reuse. Click an item to edit its name or photo. Pick them from a dropdown in other tabs instead of retyping — you can always type new ones too."
      />

      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs uppercase tracking-wide text-white/40 mb-1">Item name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Purple Swirlies"
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-white/40 mb-1">Photo (optional)</label>
            <div className="flex items-center gap-3">
              {photo ? (
                <img src={photo} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10" />
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
                className="text-xs text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white/80 hover:file:bg-white/20"
              />
              {photo && (
                <button
                  onClick={() => {
                    setPhoto(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="text-xs text-white/40 hover:text-rose-300"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <Button onClick={add} disabled={saving}>
            {saving ? 'Saving…' : 'Add item'}
          </Button>
        </div>
        {error && <p className="text-rose-300 text-sm mt-3">{error}</p>}
      </Card>

      {data.items.length === 0 ? (
        <Card>
          <EmptyState title="No preset items yet" hint="Add the items you reuse most above." />
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.items.map((it) => (
            <Card
              key={it.id}
              onClick={() => setEditing(it)}
              className="p-3 group relative cursor-pointer hover:bg-white/10 transition-colors"
              title="Click to edit"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-white/5 border border-white/10 mb-2 flex items-center justify-center">
                {it.photo ? (
                  <img src={it.photo} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl opacity-30">📦</span>
                )}
              </div>
              <div className="text-sm font-medium truncate" title={it.name}>
                {it.name}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  remove(it.id)
                }}
                className="absolute top-2 right-2 rounded-md bg-black/40 px-2 py-0.5 text-xs text-white/70 opacity-0 group-hover:opacity-100 hover:text-rose-300 transition"
              >
                Delete
              </button>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EditItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            await data.refresh()
          }}
        />
      )}
    </div>
  )
}

function EditItemModal({
  item,
  onClose,
  onSaved
}: {
  item: ItemPreset
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [name, setName] = useState(item.name)
  const [photo, setPhoto] = useState<string | null>(item.photo ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Close on Escape for a native-feeling modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      setPhoto(await fileToResizedDataUrl(file))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function save() {
    if (!name.trim()) return setError('Give the item a name.')
    setSaving(true)
    setError('')
    try {
      await updateItem(item.id, { name: name.trim(), photo })
      await onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Edit item</h2>

        <div className="flex gap-4">
          <div className="shrink-0">
            <div className="h-24 w-24 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
              {photo ? (
                <img src={photo} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl opacity-30">📦</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onPickPhoto}
              className="mt-2 w-24 text-[11px] text-white/60 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-white/80 hover:file:bg-white/20"
            />
            {photo && (
              <button
                onClick={() => {
                  setPhoto(null)
                  if (fileRef.current) fileRef.current.value = ''
                }}
                className="mt-1 block text-[11px] text-white/40 hover:text-rose-300"
              >
                Remove photo
              </button>
            )}
          </div>

          <div className="flex-1">
            <label className="block text-xs uppercase tracking-wide text-white/40 mb-1">Item name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              autoFocus
            />
          </div>
        </div>

        {error && <p className="text-rose-300 text-sm mt-3">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
