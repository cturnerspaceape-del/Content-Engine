import type { ContentItem } from '../../types'

type VisualPatch = Partial<NonNullable<ContentItem['generatedVisual']>>
type PostState = 'idle' | 'confirming' | 'posting' | 'error'

interface ActionButtonsProps {
  format: string
  isGenerated: boolean
  hideShuffleGenerate: boolean
  hidePostButton: boolean
  onShuffle: () => void
  onGenerate: () => void
  applyPatch: (patch: VisualPatch) => void
  canPost: boolean
  hasPostableAsset: boolean
  postState: PostState
  setPostState: (s: PostState) => void
  postErrorMessage: string | null
  facebookWarning: string | null
  hasOnPost: boolean
}

export function ActionButtons({
  format,
  isGenerated,
  hideShuffleGenerate,
  hidePostButton,
  onShuffle,
  onGenerate,
  applyPatch,
  canPost,
  hasPostableAsset,
  postState,
  setPostState,
  postErrorMessage,
  facebookWarning,
  hasOnPost,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col gap-2 mt-auto">
      <div className="flex gap-2">
        {!hideShuffleGenerate && (
          <>
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
          </>
        )}
        {isGenerated && format === 'Single Image' && (
          <button
            onClick={() =>
              applyPatch({
                imageUrl: undefined,
                imageError: undefined,
                imageVariationSeed: Math.floor(Math.random() * 100_000),
              })
            }
            title="Same brief, new output (bypasses cache, costs ~$0.15)"
            className={`${hideShuffleGenerate ? 'w-full' : ''} py-2 px-3 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105`}
            style={{
              background: 'rgba(251,146,60,.12)',
              border: '1px solid #fb923c',
              color: '#fb923c',
            }}
          >
            🎲 Reroll
          </button>
        )}
      </div>
      {/* Primary action: Post to Instagram (falls back to Log Post if no onPost wired). */}
      {!hidePostButton && (
        <button
          onClick={() => {
            if (!canPost || !hasPostableAsset) return
            setPostState('confirming')
          }}
          disabled={!canPost || !hasPostableAsset || postState === 'posting'}
          title={
            !isGenerated
              ? 'Generate the content first'
              : !hasPostableAsset
              ? 'Waiting for the visual to finish generating'
              : postState === 'error'
              ? postErrorMessage ?? 'Post failed — click to retry'
              : undefined
          }
          className="w-full py-2 rounded-xl font-bold text-xs transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={
            postState === 'error'
              ? {
                  background: 'rgba(239,68,68,.1)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                }
              : {
                  background: 'rgba(59,130,246,.1)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                }
          }
        >
          {postState === 'posting'
            ? 'Posting…'
            : postState === 'error'
            ? 'Retry Post'
            : hasOnPost
            ? 'Post to Instagram'
            : 'Log Post'}
        </button>
      )}
      {!hidePostButton && postState === 'error' && postErrorMessage && (
        <p className="text-[10px] px-1" style={{ color: '#ef4444' }}>
          {postErrorMessage}
        </p>
      )}
      {!hidePostButton && postState !== 'error' && facebookWarning && (
        <p className="text-[10px] px-1" style={{ color: '#fb923c' }}>
          IG posted ✓ · Facebook cross-post failed: {facebookWarning}
        </p>
      )}
    </div>
  )
}
