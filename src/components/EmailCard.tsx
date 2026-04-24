import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { EmailItem } from '../types'
import { EMAIL_TYPES } from '../data/emailContentTemplates'

type EmailContent = NonNullable<EmailItem['content']>

interface EmailCardProps {
  item: EmailItem
  onShuffle: () => void
  onGenerate: () => void
  onEdit: (patch: Partial<EmailContent>) => void
}

const ACCENT = '#8b5cf6'

function htmlToPlain(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/g, '\n\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<strong>/g, '')
    .replace(/<\/strong>/g, '')
    .replace(/<em>/g, '')
    .replace(/<\/em>/g, '')
    .trim()
}

function buildPlaintext(content: EmailContent): string {
  const body = htmlToPlain(content.bodyHtml)
  return `Subject: ${content.subject}\nPreheader: ${content.preheader}\n\n${body}\n\nCTA: ${content.ctaLabel} → ${content.ctaUrl}`
}

export default function EmailCard({ item, onShuffle, onGenerate, onEdit }: EmailCardProps) {
  const typeLabel = EMAIL_TYPES.find((t) => t.id === item.typeId)?.label ?? item.typeId
  const content = item.content
  const generated = Boolean(item.generated && content)

  const [copied, setCopied] = useState<'subject' | 'all' | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  const copy = async (text: string, kind: 'subject' | 'all') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1200)
    } catch {
      // ignore — older browsers / permission denied
    }
  }

  return (
    <div
      className="rounded-2xl"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        padding: 20,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background: `${ACCENT}1a`,
            color: ACCENT,
            border: `1px solid ${ACCENT}66`,
          }}
        >
          📧 Email · {typeLabel}
        </span>
        {generated && (
          <button
            onClick={() => setEditOpen(true)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            ✎ Edit
          </button>
        )}
      </div>

      {!generated && (
        <div
          className="rounded-xl p-4 mb-4 text-sm"
          style={{
            background: 'var(--panel-2)',
            border: '1px dashed var(--border)',
            color: 'var(--muted)',
          }}
        >
          {item.description}
        </div>
      )}

      {generated && content && (
        <div
          className="rounded-xl mb-4"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                className="font-bold"
                style={{ color: 'var(--text)', fontSize: 15, lineHeight: 1.3 }}
              >
                {content.subject}
              </div>
              <div
                className="text-[12px] mt-1"
                style={{ color: 'var(--muted)' }}
              >
                {content.preheader}
              </div>
            </div>
            <button
              onClick={() => copy(content.subject, 'subject')}
              className="text-[10px] font-semibold px-2 py-1 rounded-md whitespace-nowrap"
              style={{
                background: 'var(--panel)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {copied === 'subject' ? '✓' : '📋'}
            </button>
          </div>

          <div
            className="text-[13px]"
            style={{ padding: '14px', color: 'var(--text)', lineHeight: 1.55 }}
            dangerouslySetInnerHTML={{ __html: content.bodyHtml }}
          />

          <div style={{ padding: '0 14px 14px' }}>
            <div
              className="rounded-xl text-center font-bold"
              style={{
                background: ACCENT,
                color: '#fff',
                padding: '10px 16px',
                fontSize: 13,
              }}
            >
              {content.ctaLabel}
            </div>
            <div
              className="text-[10px] mt-1.5 text-center"
              style={{ color: 'var(--muted)' }}
            >
              → {content.ctaUrl}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onShuffle}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          }}
        >
          🔀 Shuffle
        </button>
        <button
          onClick={onGenerate}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
          style={{
            background: ACCENT,
            color: '#fff',
            border: `1px solid ${ACCENT}`,
          }}
        >
          {generated ? '✨ Regenerate' : '✨ Generate'}
        </button>
        {generated && content && (
          <button
            onClick={() => copy(buildPlaintext(content), 'all')}
            className="py-2.5 px-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
            title="Copy full email as plaintext"
          >
            {copied === 'all' ? '✓' : '📋'}
          </button>
        )}
      </div>

      {editOpen && content && (
        <EmailEditDialog
          initial={content}
          onCancel={() => setEditOpen(false)}
          onSave={(patch) => {
            onEdit(patch)
            setEditOpen(false)
          }}
        />
      )}
    </div>
  )
}

interface EmailEditDialogProps {
  initial: EmailContent
  onCancel: () => void
  onSave: (patch: Partial<EmailContent>) => void
}

function EmailEditDialog({ initial, onCancel, onSave }: EmailEditDialogProps) {
  const [subject, setSubject] = useState(initial.subject)
  const [preheader, setPreheader] = useState(initial.preheader)
  const [bodyHtml, setBodyHtml] = useState(initial.bodyHtml)
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel)
  const [ctaUrl, setCtaUrl] = useState(initial.ctaUrl)

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

  const inputStyle = {
    background: 'var(--panel-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontFamily: 'inherit' as const,
  }

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
      aria-labelledby="email-edit-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-enter glass-panel"
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          borderRadius: 16,
          padding: 20,
          background: 'var(--panel)',
        }}
      >
        <h2
          id="email-edit-title"
          className="text-lg font-bold mb-4"
          style={{ color: 'var(--text)' }}
        >
          Edit email
        </h2>

        <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--muted)' }}>
          Subject
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          autoFocus
          className="w-full rounded-lg p-2.5 text-[13px] mb-3"
          style={inputStyle}
        />

        <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--muted)' }}>
          Preheader
        </label>
        <input
          type="text"
          value={preheader}
          onChange={(e) => setPreheader(e.target.value)}
          className="w-full rounded-lg p-2.5 text-[13px] mb-3"
          style={inputStyle}
        />

        <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--muted)' }}>
          Body (HTML allowed: &lt;p&gt;, &lt;strong&gt;, &lt;br/&gt;)
        </label>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={8}
          className="w-full rounded-lg p-3 text-[12px] leading-snug mb-3"
          style={{ ...inputStyle, resize: 'vertical' }}
        />

        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--muted)' }}>
              CTA label
            </label>
            <input
              type="text"
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
              className="w-full rounded-lg p-2.5 text-[13px]"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-[11px] font-bold mb-1 block" style={{ color: 'var(--muted)' }}>
              CTA URL
            </label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              className="w-full rounded-lg p-2.5 text-[13px]"
              style={inputStyle}
            />
          </div>
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
            onClick={() =>
              onSave({ subject, preheader, bodyHtml, ctaLabel, ctaUrl })
            }
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: ACCENT,
              color: '#fff',
              border: `1px solid ${ACCENT}`,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
