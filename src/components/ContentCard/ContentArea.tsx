import { useState } from 'react'
import type { ContentItem } from '../../types'
import CaptionEditDialog from '../CaptionEditDialog'
import { formatHashtagsForInput, parseHashtagInput } from '../PostConfirmModal'

type VisualPatch = Partial<NonNullable<ContentItem['generatedVisual']>>

interface ContentAreaProps {
  item: ContentItem
  format: string
  isGenerated: boolean
  isPosted: boolean
  isLogged: boolean
  descLines: string[]
  applyPatch: (patch: VisualPatch) => void
}

export function ContentArea({
  item,
  format,
  isGenerated,
  isPosted,
  isLogged,
  descLines,
  applyPatch,
}: ContentAreaProps) {
  const [editState, setEditState] = useState<{
    open: boolean
    captionDraft: string
    hashtagInputDraft: string
  }>({
    open: false,
    captionDraft: '',
    hashtagInputDraft: '',
  })

  const showEditButton =
    isGenerated
    && !isPosted
    && !isLogged
    && item.generatedVisual?.caption != null
    && (format === 'Single Image' || format === 'Carousel')

  return (
    <>
      <div className="flex-1 mb-3 relative">
        {showEditButton && (
          <button
            onClick={() =>
              setEditState({
                open: true,
                captionDraft: item.generatedVisual?.caption ?? '',
                hashtagInputDraft: formatHashtagsForInput(item.generatedVisual?.hashtags),
              })
            }
            title="Edit caption & hashtags"
            aria-label="Edit caption and hashtags"
            className="absolute -top-1 right-0 text-[10px] font-bold px-2 py-0.5 rounded-md transition-all hover:scale-105"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--accent)',
              border: '1px solid var(--border)',
              lineHeight: 1.2,
              zIndex: 1,
            }}
          >
            ✎ Edit
          </button>
        )}
        {isGenerated ? (
          // Generated content sourced from generatedVisual so caption edits
          // reflect immediately. Ungenerated / legacy items fall back to the
          // static description split.
          (() => {
            const gv = item.generatedVisual
            const generatedLines: Array<{ text: string; kind: 'hook' | 'body' | 'hashtags' }> = []
            if (gv) {
              if (gv.hook) generatedLines.push({ text: gv.hook, kind: 'hook' })
              if (gv.caption) generatedLines.push({ text: gv.caption, kind: 'body' })
              const tags = (gv.hashtags ?? []).filter((t) => typeof t === 'string' && t.length > 0)
              if (tags.length > 0) {
                const tagLine = tags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' ')
                generatedLines.push({ text: tagLine, kind: 'hashtags' })
              }
            }
            const lines = generatedLines.length > 0
              ? generatedLines
              : descLines.map((text, i) => ({
                  text,
                  kind:
                    i === 0 ? ('hook' as const) : text.startsWith('#') ? ('hashtags' as const) : ('body' as const),
                }))
            return lines.map((row, i) => (
              <p
                key={i}
                className={`${row.kind === 'hashtags' ? 'text-[10px]' : 'text-[11px]'} leading-snug ${i < lines.length - 1 ? 'mb-1.5' : ''}`}
                style={{
                  color: row.kind === 'hashtags' ? 'var(--muted)' : 'var(--text)',
                  fontWeight: row.kind === 'hook' ? 700 : 400,
                  fontStyle: row.kind === 'hook' ? 'italic' : 'normal',
                }}
              >
                {row.kind === 'hook' ? `"${row.text}"` : row.text}
              </p>
            ))
          })()
        ) : (
          // Checklist instructions
          descLines.map((line, i) => (
            <div key={i} className="flex items-start gap-1.5 mb-1">
              <span
                className="mt-px flex-shrink-0 text-[9px] leading-none"
                style={{ color: '#10b981' }}
              >
                ✓
              </span>
              <span className="text-[11px] leading-snug" style={{ color: 'var(--text)' }}>
                {line}
              </span>
            </div>
          ))
        )}
      </div>

      {editState.open && item.generatedVisual && (
        <CaptionEditDialog
          captionDraft={editState.captionDraft}
          hashtagInputDraft={editState.hashtagInputDraft}
          onCaptionChange={(captionDraft) =>
            setEditState((prev) => ({ ...prev, captionDraft }))
          }
          onHashtagsChange={(hashtagInputDraft) =>
            setEditState((prev) => ({ ...prev, hashtagInputDraft }))
          }
          onCancel={() =>
            setEditState({ open: false, captionDraft: '', hashtagInputDraft: '' })
          }
          onSave={() => {
            applyPatch({
              caption: editState.captionDraft,
              hashtags: parseHashtagInput(editState.hashtagInputDraft),
            })
            setEditState({ open: false, captionDraft: '', hashtagInputDraft: '' })
          }}
        />
      )}
    </>
  )
}
