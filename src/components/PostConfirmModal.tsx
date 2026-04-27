import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ContentItem, PostDestination } from '../types'
import { MAX_CAPTION_LENGTH, buildCaption } from '../lib/instagramCaption'
import type { TunerPlatform } from '../lib/platformTuners'

type PostLocationId = 'IG' | 'FB' | TunerPlatform

const POST_LOCATIONS: ReadonlyArray<{ id: PostLocationId; label: string; icon: string }> = [
  { id: 'IG', label: 'Instagram', icon: '📷' },
  { id: 'FB', label: 'Facebook', icon: '📘' },
  { id: 'X', label: 'X', icon: '𝕏' },
  { id: 'Threads', label: 'Threads', icon: '@' },
  { id: 'TikTok', label: 'TikTok', icon: '🎵' },
  { id: 'YouTube Shorts', label: 'YouTube Shorts', icon: '▶' },
]

export interface PostConfirmOptions {
  alsoFacebook: boolean
}

export interface PostConfirmEdits {
  caption?: string
  hashtags?: string[]
}

// Parses a space / comma / newline separated hashtag string into a normalized
// array. Drops empty tokens, strips leading # so storage stays consistent with
// how the generator writes hashtags.
export function parseHashtagInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim().replace(/^#+/, ''))
    .filter((t) => t.length > 0)
}

export function formatHashtagsForInput(tags: string[] | undefined): string {
  return (tags ?? [])
    .filter((t) => typeof t === 'string' && t.length > 0)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ')
}

interface PostConfirmModalProps {
  item: ContentItem
  allowedDestinations: PostDestination[]
  // Non-IG platforms the user picked on the lab page. Drives which rows in
  // the "Confirm post location" checklist start checked. UI-only for now —
  // toggling these does not yet filter the clipboard payload.
  crossPostPlatforms?: ReadonlyArray<TunerPlatform>
  // When the parent is waiting on a publish call, show a busy state and
  // disable the buttons so the user can't double-click. The parent stays
  // responsible for dismissing the modal on success.
  busy?: boolean
  // Server-side error from the most recent attempt. Surfaces inline so the
  // user can see the raw Graph API message without hunting through toasts.
  lastError?: string | null
  onCancel: () => void
  onConfirm: (
    destination: PostDestination,
    opts: PostConfirmOptions,
    edits?: PostConfirmEdits,
    selectedCrossPosts?: TunerPlatform[],
  ) => void
}

// Cached across modal mounts — first open triggers the fetch, subsequent
// opens read from this. Empty-string caches a known-missing username.
let usernameCache: string | null | undefined
let pageNameCache: string | null | undefined

const ALSO_FB_STORAGE_KEY = 'postConfirm.alsoFacebook'

function readAlsoFacebookPreference(): boolean {
  try {
    const v = window.localStorage.getItem(ALSO_FB_STORAGE_KEY)
    if (v === null) return true // default ON
    return v === '1'
  } catch {
    return true
  }
}

function writeAlsoFacebookPreference(value: boolean) {
  try {
    window.localStorage.setItem(ALSO_FB_STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export default function PostConfirmModal({
  item,
  allowedDestinations,
  crossPostPlatforms = [],
  busy = false,
  lastError = null,
  onCancel,
  onConfirm,
}: PostConfirmModalProps) {
  const feedAllowed = allowedDestinations.includes('feed')
  const initialDestination: PostDestination = feedAllowed ? 'feed' : 'story'
  const [destination, setDestination] = useState<PostDestination>(initialDestination)
  const [username, setUsername] = useState<string | null>(
    usernameCache === undefined ? null : usernameCache,
  )
  const [pageName, setPageName] = useState<string | null>(
    pageNameCache === undefined ? null : pageNameCache,
  )
  const [alsoFacebook, setAlsoFacebook] = useState<boolean>(readAlsoFacebookPreference())
  const [crossPostChecked, setCrossPostChecked] = useState<Set<TunerPlatform>>(
    () => new Set(crossPostPlatforms),
  )
  const originalCaption = item.generatedVisual?.caption ?? ''
  const originalHashtags = item.generatedVisual?.hashtags ?? []
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [editedCaption, setEditedCaption] = useState<string>(originalCaption)
  const [editedHashtagInput, setEditedHashtagInput] = useState<string>(
    formatHashtagsForInput(originalHashtags),
  )
  const editedHashtags = parseHashtagInput(editedHashtagInput)

  useEffect(() => {
    if (usernameCache === undefined) {
      let cancelled = false
      fetch('/api/instagram/account')
        .then((r) => r.json())
        .then((data) => {
          const u = (data && data.ok && typeof data.username === 'string' ? data.username : null) as
            | string
            | null
          usernameCache = u
          if (!cancelled) setUsername(u)
        })
        .catch(() => {
          usernameCache = null
        })
      return () => {
        cancelled = true
      }
    }
    return undefined
  }, [])

  useEffect(() => {
    if (pageNameCache === undefined) {
      let cancelled = false
      fetch('/api/facebook/account')
        .then((r) => r.json())
        .then((data) => {
          const n = (data && data.ok && typeof data.pageName === 'string' ? data.pageName : null) as
            | string
            | null
          pageNameCache = n
          if (!cancelled) setPageName(n)
        })
        .catch(() => {
          pageNameCache = null
        })
      return () => {
        cancelled = true
      }
    }
    return undefined
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const v = item.generatedVisual
  const format = v?.format
  const slideCount = v?.slideUrls?.filter(Boolean).length ?? 0
  const thumbnail = v?.imageUrl || v?.slideUrls?.find(Boolean) || v?.reelUrl
  const isVideo = Boolean(v?.reelUrl) && !v?.imageUrl && (!v?.slideUrls || v.slideUrls.filter(Boolean).length === 0)

  const previewCaption = buildCaption({
    caption: editedCaption,
    hashtags: editedHashtags,
  })

  const formatChipText =
    format === 'Carousel'
      ? `Carousel · ${slideCount} ${slideCount === 1 ? 'slide' : 'slides'}`
      : format ?? '—'

  const showStoryOption = allowedDestinations.includes('story')
  const showFeedOption = feedAllowed
  const showToggle = showStoryOption && showFeedOption
  const showFacebookCheckbox = destination === 'feed'
  const captionEditable =
    destination === 'feed' && (format === 'Single Image' || format === 'Carousel') && v?.caption != null
  const captionDirty = editedCaption !== originalCaption
  const hashtagsDirty =
    editedHashtags.length !== originalHashtags.length
    || editedHashtags.some((t, i) => t !== originalHashtags[i])
  const editsDirty = captionDirty || hashtagsDirty
  const captionOverLimit = editedCaption.length > MAX_CAPTION_LENGTH

  const handleToggleFacebook = (next: boolean) => {
    setAlsoFacebook(next)
    writeAlsoFacebookPreference(next)
  }

  const confirmLabel = destination === 'story' ? 'Confirm & Post to Story' : 'Confirm & Post'

  const destinationLine = (() => {
    const igLabel = username ? `@${username} on Instagram` : 'your connected Instagram account'
    const fbLabel = pageName ? `${pageName} on Facebook` : 'your connected Facebook Page'
    if (destination === 'story') return `Posts to ${igLabel} (Story)`
    if (alsoFacebook) return `Posts to ${igLabel} and ${fbLabel}`
    return `Posts to ${igLabel}`
  })()

  return createPortal(
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10_000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(26,18,48,0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: 16,
      }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-confirm-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-enter glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          borderRadius: 16,
          padding: 20,
          background: 'var(--panel)',
        }}
      >
        <h2
          id="post-confirm-title"
          className="text-lg font-bold mb-1"
          style={{ color: 'var(--text)' }}
        >
          Post Now?
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
          Review what will be posted. Nothing goes live until you confirm.
        </p>

        {/* Format chip + thumbnail */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(59,130,246,.12)', color: 'var(--accent)' }}
          >
            {formatChipText}
          </span>
        </div>

        {thumbnail && (
          <div
            className="rounded-lg overflow-hidden mb-4"
            style={{
              width: '100%',
              maxHeight: 260,
              background: 'var(--panel-2)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {isVideo ? (
              <video
                src={thumbnail}
                style={{ width: '100%', maxHeight: 260, objectFit: 'contain' }}
                muted
                playsInline
              />
            ) : (
              <img
                src={thumbnail}
                alt="Post preview"
                style={{ width: '100%', maxHeight: 260, objectFit: 'contain' }}
              />
            )}
          </div>
        )}

        {/* Destination toggle */}
        {showToggle && (
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase mb-1.5" style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}>
              Destination
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDestination('feed')}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: destination === 'feed' ? 'var(--accent)' : 'var(--panel-2)',
                  color: destination === 'feed' ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                Feed
              </button>
              <button
                onClick={() => setDestination('story')}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: destination === 'story' ? 'var(--accent)' : 'var(--panel-2)',
                  color: destination === 'story' ? '#fff' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                Story
              </button>
            </div>
          </div>
        )}

        {showFacebookCheckbox && (
          <div className="mb-4">
            <p
              className="text-[11px] font-bold uppercase mb-1.5"
              style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}
            >
              Confirm post location
            </p>
            <div className="flex flex-col gap-1.5">
              {POST_LOCATIONS.map((loc) => {
                const isIG = loc.id === 'IG'
                const isFB = loc.id === 'FB'
                // YouTube Shorts only accepts video uploads — disable the row
                // when the current item isn't a Reel so the user can't tick a
                // checkbox that would 400 on submit.
                const isYouTube = loc.id === 'YouTube Shorts'
                const youtubeBlocked = isYouTube && format !== 'Reel'
                const rowDisabled = isIG || youtubeBlocked
                const checked = isIG
                  ? true
                  : isFB
                  ? alsoFacebook
                  : !youtubeBlocked && crossPostChecked.has(loc.id as TunerPlatform)
                const onChange = (next: boolean) => {
                  if (rowDisabled) return
                  if (isFB) {
                    handleToggleFacebook(next)
                    return
                  }
                  setCrossPostChecked((prev) => {
                    const nextSet = new Set(prev)
                    if (next) nextSet.add(loc.id as TunerPlatform)
                    else nextSet.delete(loc.id as TunerPlatform)
                    return nextSet
                  })
                }
                return (
                  <label
                    key={loc.id}
                    className="flex items-center gap-2 cursor-pointer select-none"
                    style={{
                      color: 'var(--text)',
                      opacity: isIG ? 0.85 : youtubeBlocked ? 0.4 : 1,
                      cursor: rowDisabled ? 'not-allowed' : 'pointer',
                    }}
                    title={youtubeBlocked ? 'YouTube Shorts requires a Reel' : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={rowDisabled}
                      onChange={(e) => onChange(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontSize: 14 }}>{loc.icon}</span>
                    <span className="text-xs font-semibold">{loc.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* Caption preview or Story note */}
        {destination === 'story' ? (
          <div
            className="rounded-lg p-3 mb-4 text-xs"
            style={{ background: 'rgba(251,146,60,.08)', border: '1px solid rgba(251,146,60,.3)', color: 'var(--text)' }}
          >
            <p className="font-bold mb-1" style={{ color: '#fb923c' }}>Story notes</p>
            <p style={{ color: 'var(--muted)' }}>
              Stories don't support captions via API — your caption and hashtags won't be included.
              Stories disappear after 24 hours.
            </p>
          </div>
        ) : (
          <div className="mb-4">
            <div className="flex items-center justify-end mb-1.5 gap-1.5" style={{ minHeight: 22 }}>
              {editsDirty && (
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(59,130,246,.15)', color: 'var(--accent)' }}
                >
                  edited
                </span>
              )}
              {captionEditable && !isEditingCaption && (
                <button
                  onClick={() => setIsEditingCaption(true)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  style={{
                    background: 'var(--panel-2)',
                    color: 'var(--accent)',
                    border: '1px solid var(--border)',
                  }}
                >
                  ✎ Edit
                </button>
              )}
            </div>
            {isEditingCaption ? (
              <>
                <textarea
                  value={editedCaption}
                  onChange={(e) => setEditedCaption(e.target.value)}
                  rows={6}
                  autoFocus
                  className="w-full rounded-lg p-3 text-[11px] leading-snug"
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
                <input
                  type="text"
                  value={editedHashtagInput}
                  onChange={(e) => setEditedHashtagInput(e.target.value)}
                  placeholder="#spaceape #liveresin #premium"
                  className="w-full rounded-lg p-2 text-[11px] mt-2"
                  style={{
                    background: 'var(--panel-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontFamily: 'inherit',
                  }}
                />
                <p className="text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
                  {editedHashtags.length} tag{editedHashtags.length === 1 ? '' : 's'}
                  {editedHashtags.length > 30 && ' — IG caps at 30'}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span
                    className="text-[10px]"
                    style={{ color: captionOverLimit ? '#ef4444' : 'var(--muted)' }}
                  >
                    Caption: {editedCaption.length} / {MAX_CAPTION_LENGTH}
                    {captionOverLimit && ' — will be truncated'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditedCaption(originalCaption)
                        setEditedHashtagInput(formatHashtagsForInput(originalHashtags))
                        setIsEditingCaption(false)
                      }}
                      className="text-[10px] font-bold px-2 py-1 rounded-md"
                      style={{
                        background: 'var(--panel-2)',
                        color: 'var(--muted)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      Revert
                    </button>
                    <button
                      onClick={() => setIsEditingCaption(false)}
                      className="text-[10px] font-bold px-2 py-1 rounded-md"
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        border: '1px solid var(--accent)',
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div
                className="rounded-lg p-3 text-[11px] leading-snug whitespace-pre-wrap"
                style={{
                  background: 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  maxHeight: 180,
                  overflowY: 'auto',
                }}
              >
                {previewCaption || <span style={{ color: 'var(--muted)' }}>(no caption)</span>}
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] mb-4" style={{ color: 'var(--muted)' }}>
          {destinationLine}
        </p>

        {lastError && (
          <div
            className="rounded-lg p-3 mb-4 text-[11px]"
            style={{
              background: 'rgba(239,68,68,.08)',
              border: '1px solid rgba(239,68,68,.4)',
              color: 'var(--text)',
            }}
          >
            <p className="font-bold mb-1" style={{ color: '#ef4444' }}>
              Last attempt failed
            </p>
            <p style={{ color: 'var(--muted)', wordBreak: 'break-word' }}>{lastError}</p>
            <p className="mt-1.5" style={{ color: 'var(--muted)', fontSize: 10 }}>
              Hit <code>/api/instagram/debug</code> for token + env diagnostics.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            autoFocus
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              opacity: busy ? 0.5 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={() =>
              onConfirm(
                destination,
                { alsoFacebook },
                editsDirty
                  ? {
                      ...(captionDirty ? { caption: editedCaption } : {}),
                      ...(hashtagsDirty ? { hashtags: editedHashtags } : {}),
                    }
                  : undefined,
                Array.from(crossPostChecked),
              )
            }
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: '1px solid var(--accent)',
              opacity: busy ? 0.7 : 1,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? 'Posting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
