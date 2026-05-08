import { useState } from 'react'
import type { TunerPlatform } from '../lib/platformTuners'
import { parseHashtagInput, formatHashtagsForInput } from '../lib/instagramCaption'
import Modal from './ui/Modal'

interface TextVariantEditDialogProps {
  platform: TunerPlatform
  caption: string
  hashtags: string[]
  charLimit: number
  onSave: (next: { caption: string; hashtags: string[] }) => void
  onCancel: () => void
}

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  'IG/FB': 'IG/FB',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'YouTube Shorts',
}

export default function TextVariantEditDialog({
  platform,
  caption,
  hashtags,
  charLimit,
  onSave,
  onCancel,
}: TextVariantEditDialogProps) {
  const [captionDraft, setCaptionDraft] = useState(caption)
  const [hashtagInput, setHashtagInput] = useState(formatHashtagsForInput(hashtags))

  const overLimit = captionDraft.length > charLimit
  const pct = captionDraft.length / charLimit
  const counterColor = pct > 1 ? '#ef4444' : pct > 0.9 ? '#f59e0b' : 'var(--muted)'

  const handleSave = () => {
    if (overLimit) return
    onSave({
      caption: captionDraft,
      hashtags: parseHashtagInput(hashtagInput),
    })
  }

  return (
    <Modal open onCancel={onCancel} maxWidth={440}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          Edit {PLATFORM_LABELS[platform]} caption
        </h2>
        <span className="text-[11px] font-mono" style={{ color: counterColor }}>
          {captionDraft.length}/{charLimit}
        </span>
      </div>

      <div className="mb-4">
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-1"
          style={{ color: 'var(--muted)' }}
        >
          Caption
        </div>
        <textarea
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            minHeight: 140,
            background: 'var(--panel-2)',
            border: `1px solid ${overLimit ? '#ef4444' : 'var(--border)'}`,
            borderRadius: 10,
            padding: '10px 12px',
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      <div className="mb-5">
        <div
          className="text-[10px] font-bold uppercase tracking-wider mb-1"
          style={{ color: 'var(--muted)' }}
        >
          Hashtags
        </div>
        <input
          value={hashtagInput}
          onChange={(e) => setHashtagInput(e.target.value)}
          placeholder="#tag1 #tag2"
          style={{
            width: '100%',
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 12px',
            color: 'var(--text)',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="text-sm font-bold px-4 py-2 rounded-lg"
          style={{
            background: 'rgba(148,163,184,.1)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={overLimit}
          className="text-sm font-bold px-4 py-2 rounded-lg transition-all"
          style={{
            background: overLimit ? 'rgba(148,163,184,.1)' : 'var(--accent)',
            color: overLimit ? 'var(--muted)' : 'white',
            cursor: overLimit ? 'not-allowed' : 'pointer',
            border: '1px solid transparent',
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  )
}
