import { MAX_CAPTION_LENGTH, parseHashtagInput } from '../lib/instagramCaption'
import Modal from './ui/Modal'

interface CaptionEditDialogProps {
  captionDraft: string
  hashtagInputDraft: string
  onCaptionChange: (v: string) => void
  onHashtagsChange: (v: string) => void
  onCancel: () => void
  onSave: () => void
}

// Always rendered when mounted — parents conditionally mount this so internal
// state (textarea drafts) resets per session.
export default function CaptionEditDialog({
  captionDraft,
  hashtagInputDraft,
  onCaptionChange,
  onHashtagsChange,
  onCancel,
  onSave,
}: CaptionEditDialogProps) {
  const overLimit = captionDraft.length > MAX_CAPTION_LENGTH
  const parsedTags = parseHashtagInput(hashtagInputDraft)
  const overTagLimit = parsedTags.length > 30

  return (
    <Modal
      open
      onCancel={onCancel}
      ariaLabelledBy="caption-edit-title"
      maxWidth={440}
    >
      <h2
        id="caption-edit-title"
        className="text-lg font-bold mb-4"
        style={{ color: 'var(--text)' }}
      >
        Edit caption & hashtags
      </h2>

      <textarea
        value={captionDraft}
        onChange={(e) => onCaptionChange(e.target.value)}
        rows={6}
        autoFocus
        className="w-full rounded-lg p-3 text-[12px] leading-snug mb-1"
        style={{
          background: 'var(--panel-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      <div
        className="text-[10px] mb-4"
        style={{ color: overLimit ? '#ef4444' : 'var(--muted)' }}
      >
        {captionDraft.length} / {MAX_CAPTION_LENGTH}
        {overLimit && ' — will be truncated when posted'}
      </div>

      <input
        type="text"
        value={hashtagInputDraft}
        onChange={(e) => onHashtagsChange(e.target.value)}
        placeholder="#spaceape #liveresin #premium"
        className="w-full rounded-lg p-2.5 text-[12px] mb-1"
        style={{
          background: 'var(--panel-2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontFamily: 'inherit',
        }}
      />
      <div
        className="text-[10px] mb-4"
        style={{ color: overTagLimit ? '#ef4444' : 'var(--muted)' }}
      >
        Separated by spaces. {parsedTags.length} tag{parsedTags.length === 1 ? '' : 's'}
        {overTagLimit && ' — IG caps at 30; extras will be dropped'}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
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
          onClick={onSave}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: '1px solid var(--accent)',
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  )
}
