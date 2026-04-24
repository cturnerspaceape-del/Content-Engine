import { useState } from 'react'
import type { ContentItem } from '../types'
import type { ReelProps } from '../remotion/types'
import SingleImageVisual from './SingleImageVisual'
import ReelLoungeVisual from './ReelLoungeVisual'
import CaptionEditDialog from './CaptionEditDialog'
import { formatHashtagsForInput, parseHashtagInput } from './PostConfirmModal'

type VisualPatch = Partial<NonNullable<ContentItem['generatedVisual']>>

export type XFormat = 'text' | 'image' | 'reel'

interface XPostCardProps {
  item: ContentItem
  format: XFormat
  onShuffle: () => void
  onGenerate: () => void
  onVisualResult?: (patch: VisualPatch) => void
}

const TWEET_CHAR_LIMIT = 280

const FORMAT_CHIP: Record<XFormat, { label: string; color: string }> = {
  text: { label: 'X Post · Text', color: '#1d9bf0' },
  image: { label: 'X Post · Image', color: '#f59e0b' },
  reel: { label: 'X Post · Reel', color: '#ec4899' },
}

export default function XPostCard({
  item,
  format,
  onShuffle,
  onGenerate,
  onVisualResult,
}: XPostCardProps) {
  const [cardEditState, setCardEditState] = useState<{
    open: boolean
    captionDraft: string
    hashtagInputDraft: string
  }>({
    open: false,
    captionDraft: '',
    hashtagInputDraft: '',
  })

  const applyPatch = (patch: VisualPatch) => {
    if (onVisualResult) onVisualResult(patch)
  }

  const isGenerated = Boolean(item.generated)
  const gv = item.generatedVisual
  const tweet = gv?.caption ?? ''
  const chip = FORMAT_CHIP[format]
  const overLimit = tweet.length > TWEET_CHAR_LIMIT

  const titleParts = item.title.split(' — ')
  const seedLabel = titleParts[1]?.trim() || titleParts[0]?.trim() || item.title

  return (
    <div
      className="glass-panel flex flex-col card-enter"
      style={{ width: '100%' }}
    >
      <div
        style={{
          height: 4,
          background: chip.color,
          borderRadius: '16px 16px 0 0',
        }}
      />

      <div className="p-4 flex flex-col flex-1">
        {/* Chip + edit button row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${chip.color}15`, color: chip.color }}
          >
            {chip.label}
          </span>
          {isGenerated && gv?.caption != null && (
            <button
              onClick={() =>
                setCardEditState({
                  open: true,
                  captionDraft: gv.caption,
                  hashtagInputDraft: formatHashtagsForInput(gv.hashtags),
                })
              }
              title="Edit caption & hashtags"
              aria-label="Edit caption and hashtags"
              className="text-[10px] font-bold px-2 py-0.5 rounded-md transition-all hover:scale-105"
              style={{
                background: 'var(--panel-2)',
                color: 'var(--accent)',
                border: '1px solid var(--border)',
                lineHeight: 1.2,
              }}
            >
              ✎ Edit
            </button>
          )}
        </div>

        {/* Seed label */}
        <h3
          className="text-xs font-bold uppercase leading-tight mb-3"
          style={{ color: 'var(--text)', letterSpacing: '0.02em' }}
        >
          {seedLabel}
        </h3>

        <div className="mb-3" style={{ borderBottom: '1px solid var(--border)' }} />

        {/* Visual area — only for image / reel */}
        {isGenerated && gv && format === 'image' && (
          <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1' }}>
            <SingleImageVisual
              flavor={(gv.flavor || 'Amped Apple') as React.ComponentProps<typeof SingleImageVisual>['flavor']}
              hook={gv.hook}
              caption={gv.caption}
              hashtags={gv.hashtags}
              pillar={gv.pillar}
              subcategory={gv.subcategory}
              {...(gv.shotTemplateId ? { shotTemplateId: gv.shotTemplateId } : {})}
              {...(typeof gv.imageVariationSeed === 'number'
                ? { variationSeed: gv.imageVariationSeed }
                : {})}
              {...(gv.imageUrl ? { imageUrl: gv.imageUrl } : {})}
              {...(gv.imageError ? { imageError: gv.imageError } : {})}
              onResult={(url, error) => {
                applyPatch({
                  imageUrl: url ?? undefined,
                  imageError: error ?? undefined,
                })
              }}
            />
          </div>
        )}
        {isGenerated && gv && format === 'reel' && gv.reelArcId && (
          <div className="mb-3">
            <ReelLoungeVisual
              flavor={(gv.flavor || 'Amped Apple') as ReelProps['flavor']}
              hook={gv.hook}
              caption={gv.caption}
              pillar={gv.pillar}
              subcategory={gv.subcategory}
              reelArcId={gv.reelArcId}
              reelSeed={gv.reelSeed ?? 0}
              durationSeconds={gv.durationSeconds ?? 8}
              {...(typeof gv.reelVariationSeed === 'number'
                ? { variationSeed: gv.reelVariationSeed }
                : {})}
              {...(gv.reelUrl ? { url: gv.reelUrl } : {})}
              {...(gv.reelError ? { error: gv.reelError } : {})}
              onResult={(url, error, vseed) => {
                applyPatch({
                  reelUrl: url ?? undefined,
                  reelError: error ?? undefined,
                  reelVariationSeed: typeof vseed === 'number' ? vseed : undefined,
                })
              }}
            />
          </div>
        )}

        {/* Tweet body */}
        <div className="flex-1 mb-3">
          {isGenerated && gv ? (
            <>
              <p
                className="text-[13px] leading-snug whitespace-pre-wrap mb-2"
                style={{ color: 'var(--text)' }}
              >
                {tweet}
              </p>
              {(gv.hashtags ?? []).length > 0 && (
                <p
                  className="text-[11px] leading-snug mb-2"
                  style={{ color: 'var(--muted)' }}
                >
                  {(gv.hashtags ?? [])
                    .map((t) => (t.startsWith('#') ? t : `#${t}`))
                    .join(' ')}
                </p>
              )}
              <p
                className="text-[10px]"
                style={{ color: overLimit ? '#ef4444' : 'var(--muted)' }}
              >
                {tweet.length} / {TWEET_CHAR_LIMIT}
                {overLimit && ' — over limit; X will reject'}
              </p>
            </>
          ) : (
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              Click Generate to build this X post.
            </p>
          )}
        </div>

        {/* Action buttons — Shuffle + Generate only (no post action per plan) */}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={onShuffle}
            className="flex-1 py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
            style={{
              background: '#10b981',
              color: '#ffffff',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Shuffle
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105"
            style={
              isGenerated
                ? {
                    background: 'rgba(16,185,129,.1)',
                    border: '1px solid #10b981',
                    color: '#10b981',
                  }
                : {
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--muted)',
                  }
            }
          >
            {isGenerated ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {cardEditState.open && gv && (
        <CaptionEditDialog
          captionDraft={cardEditState.captionDraft}
          hashtagInputDraft={cardEditState.hashtagInputDraft}
          onCaptionChange={(captionDraft) =>
            setCardEditState((prev) => ({ ...prev, captionDraft }))
          }
          onHashtagsChange={(hashtagInputDraft) =>
            setCardEditState((prev) => ({ ...prev, hashtagInputDraft }))
          }
          onCancel={() =>
            setCardEditState({ open: false, captionDraft: '', hashtagInputDraft: '' })
          }
          onSave={() => {
            applyPatch({
              caption: cardEditState.captionDraft,
              hashtags: parseHashtagInput(cardEditState.hashtagInputDraft),
            })
            setCardEditState({ open: false, captionDraft: '', hashtagInputDraft: '' })
          }}
        />
      )}
    </div>
  )
}
