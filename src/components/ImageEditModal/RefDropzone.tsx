import { useRef, useState } from 'react'
import type { UserRef } from './types'

interface RefDropzoneProps {
  refs: UserRef[]
  onChange: (next: UserRef[]) => void
  max?: number
  disabled?: boolean
}

const ACCEPTED_PREFIX = 'image/'
const DEFAULT_MAX = 4

async function fileToUserRef(file: File): Promise<UserRef> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`failed to read ${file.name}`))
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const idx = result.indexOf(',')
      const base64 = idx >= 0 ? result.slice(idx + 1) : ''
      resolve({ mime: file.type || 'image/png', base64, previewUrl: result })
    }
    reader.readAsDataURL(file)
  })
}

export default function RefDropzone({
  refs,
  onChange,
  max = DEFAULT_MAX,
  disabled = false,
}: RefDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [hover, setHover] = useState(false)

  const ingest = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith(ACCEPTED_PREFIX))
    if (arr.length === 0) return
    const room = Math.max(0, max - refs.length)
    const trimmed = arr.slice(0, room)
    const newRefs = await Promise.all(trimmed.map(fileToUserRef))
    onChange([...refs, ...newRefs])
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setHover(false)
    if (disabled) return
    void ingest(e.dataTransfer.files)
  }

  const removeAt = (i: number) => {
    const next = refs.slice(0, i).concat(refs.slice(i + 1))
    onChange(next)
  }

  const atCap = refs.length >= max

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Your refs</span>
        <span style={{ fontWeight: 600, letterSpacing: 0, textTransform: 'none' }}>
          {refs.length}/{max}
        </span>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled && !atCap) setHover(true)
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        onClick={() => {
          if (!disabled && !atCap) inputRef.current?.click()
        }}
        style={{
          borderRadius: 14,
          border: `1px dashed ${hover ? '#8b5cf6' : 'var(--border)'}`,
          background: hover
            ? 'linear-gradient(135deg, rgba(29,155,240,0.10), rgba(139,92,246,0.10))'
            : 'rgba(15,23,42,0.25)',
          padding: 10,
          cursor: disabled || atCap ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        {refs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '14px 10px',
              fontSize: 12,
              color: 'var(--muted)',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>✨</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>
              Drop a vibe ref
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              style · pose · color · composition
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {refs.map((r, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  background: 'rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src={r.previewUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeAt(i)
                  }}
                  disabled={disabled}
                  aria-label="Remove reference"
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: 'rgba(15,23,42,0.85)',
                    color: '#fff',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: 10,
                    lineHeight: '18px',
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {!atCap && (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 10,
                  border: '1px dashed var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  color: 'var(--muted)',
                }}
              >
                +
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (!e.target.files) return
          void ingest(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
