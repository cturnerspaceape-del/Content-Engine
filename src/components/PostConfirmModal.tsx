import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ContentItem, PostDestination } from '../types'
import { MAX_CAPTION_LENGTH, buildCaption } from '../lib/instagramCaption'

export interface PostConfirmOptions {
  alsoFacebook: boolean
}

export interface PostConfirmEdits {
  caption?: string
}

interface PostConfirmModalProps {
  item: ContentItem
  allowedDestinations: PostDestination[]
  onCancel: () => void
  onConfirm: (
    destination: PostDestination,
    opts: PostConfirmOptions,
    edits?: PostConfirmEdits,
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
  const originalCaption = item.generatedVisual?.caption ?? ''
  const [isEditingCaption, setIsEditingCaption] = useState(false)
  const [editedCaption, setEditedCaption] = useState<string>(originalCaption)

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
    hashtags: v?.hashtags,
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
        background: 'rgba(0,0,0,0.7)',
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
          Post to Instagram now?
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
          <label
            className="flex items-center gap-2 mb-4 cursor-pointer select-none"
            style={{ color: 'var(--text)' }}
          >
            <input
              type="checkbox"
              checked={alsoFacebook}
              onChange={(e) => handleToggleFacebook(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
            />
            <span className="text-xs font-semibold">Also post to Facebook Page</span>
          </label>
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
            <div className="flex items-center justify-between mb-1.5">
              <p
                className="text-[11px] font-bold uppercase flex items-center gap-1.5"
                style={{ color: 'var(--muted)', letterSpacing: '0.05em' }}
              >
                Caption preview
                {captionDirty && (
                  <span
                    className="text-[9px] font-bold normal-case px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(59,130,246,.15)', color: 'var(--accent)', letterSpacing: 0 }}
                  >
                    edited
                  </span>
                )}
              </p>
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
                {(v?.hashtags?.length ?? 0) > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(v?.hashtags ?? [])
                      .filter((t) => typeof t === 'string' && t.length > 0)
                      .map((t) => (t.startsWith('#') ? t : `#${t}`))
                      .map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          title="Hashtags are auto-appended and can't be edited here"
                          style={{
                            background: 'var(--panel-2)',
                            color: 'var(--muted)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className="text-[10px]"
                    style={{ color: captionOverLimit ? '#ef4444' : 'var(--muted)' }}
                  >
                    {editedCaption.length} / {MAX_CAPTION_LENGTH}
                    {captionOverLimit && ' — will be truncated'}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        setEditedCaption(originalCaption)
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

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            autoFocus
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm(
                destination,
                { alsoFacebook },
                captionDirty ? { caption: editedCaption } : undefined,
              )
            }
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: '1px solid var(--accent)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
