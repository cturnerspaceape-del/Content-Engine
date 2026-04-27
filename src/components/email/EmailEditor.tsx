import type { GeneratedEmail, EmailSection } from '../../lib/email/types'

interface EmailEditorProps {
  email: GeneratedEmail
  onChange: (next: GeneratedEmail) => void
}

function setSubject(email: GeneratedEmail, subject: string): GeneratedEmail {
  return { ...email, subject }
}
function setPreheader(email: GeneratedEmail, preheader: string): GeneratedEmail {
  return { ...email, preheader }
}
function patchSection(
  email: GeneratedEmail,
  idx: number,
  patch: Record<string, unknown>,
): GeneratedEmail {
  const next = email.sections.slice()
  const target = next[idx]
  next[idx] = { ...target, data: { ...target.data, ...patch } } as EmailSection
  return { ...email, sections: next }
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '.18em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--panel-2)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
}

export default function EmailEditor({ email, onChange }: EmailEditorProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 18,
      }}
    >
      <div>
        <div style={labelStyle}>Subject</div>
        <input
          value={email.subject}
          onChange={(e) => onChange(setSubject(email, e.target.value))}
          style={inputStyle}
          placeholder="Subject line"
        />
      </div>

      <div>
        <div style={labelStyle}>Preview text</div>
        <input
          value={email.preheader}
          onChange={(e) => onChange(setPreheader(email, e.target.value))}
          style={inputStyle}
          placeholder="Preview text shown next to the subject in the inbox"
        />
      </div>

      {email.sections.map((s, idx) => (
        <SectionEditor
          key={s.id}
          section={s}
          onPatch={(patch) => onChange(patchSection(email, idx, patch))}
        />
      ))}
    </div>
  )
}

function SectionEditor({
  section,
  onPatch,
}: {
  section: EmailSection
  onPatch: (patch: Record<string, unknown>) => void
}) {
  const data = section.data as unknown as Record<string, unknown>
  const heading = (
    <div style={{ ...labelStyle, color: '#f59e0b' }}>{section.kind.replace('_', ' ')}</div>
  )

  switch (section.kind) {
    case 'hero':
      return (
        <div>
          {heading}
          <input
            value={(data.eyebrow as string) ?? ''}
            onChange={(e) => onPatch({ eyebrow: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8 }}
            placeholder="Eyebrow (optional)"
          />
          <input
            value={(data.headline as string) ?? ''}
            onChange={(e) => onPatch({ headline: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8, fontWeight: 700 }}
            placeholder="Headline"
          />
          <textarea
            value={(data.subhead as string) ?? ''}
            onChange={(e) => onPatch({ subhead: e.target.value })}
            style={{ ...inputStyle, minHeight: 60 }}
            placeholder="Subhead (optional)"
          />
        </div>
      )
    case 'offer':
      return (
        <div>
          {heading}
          <input
            value={(data.badge as string) ?? ''}
            onChange={(e) => onPatch({ badge: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8 }}
            placeholder="Badge (e.g. LIMITED DROP)"
          />
          <input
            value={(data.title as string) ?? ''}
            onChange={(e) => onPatch({ title: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8, fontWeight: 700 }}
            placeholder="Offer title"
          />
          <textarea
            value={(data.body as string) ?? ''}
            onChange={(e) => onPatch({ body: e.target.value })}
            style={{ ...inputStyle, minHeight: 60, marginBottom: 8 }}
            placeholder="Offer body"
          />
          <input
            value={(data.fineprint as string) ?? ''}
            onChange={(e) => onPatch({ fineprint: e.target.value })}
            style={inputStyle}
            placeholder="Fine print (optional)"
          />
        </div>
      )
    case 'cta':
      return (
        <div>
          {heading}
          <input
            value={(data.label as string) ?? ''}
            onChange={(e) => onPatch({ label: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8, fontWeight: 700 }}
            placeholder="Button label"
          />
          <input
            value={(data.url as string) ?? ''}
            onChange={(e) => onPatch({ url: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8 }}
            placeholder="Destination URL"
          />
          <input
            value={(data.supporting as string) ?? ''}
            onChange={(e) => onPatch({ supporting: e.target.value })}
            style={inputStyle}
            placeholder="Supporting text (optional)"
          />
        </div>
      )
    case 'social_proof':
      return (
        <div>
          {heading}
          <textarea
            value={(data.quote as string) ?? ''}
            onChange={(e) => onPatch({ quote: e.target.value })}
            style={{ ...inputStyle, minHeight: 60, marginBottom: 8 }}
            placeholder="Quote"
          />
          <input
            value={(data.attribution as string) ?? ''}
            onChange={(e) => onPatch({ attribution: e.target.value })}
            style={inputStyle}
            placeholder="Attribution (e.g. Brand Manager, NYC Smoke)"
          />
        </div>
      )
    case 'header':
      return (
        <div>
          {heading}
          <input
            value={(data.tagline as string) ?? ''}
            onChange={(e) => onPatch({ tagline: e.target.value })}
            style={inputStyle}
            placeholder="Header tagline (optional)"
          />
        </div>
      )
    default:
      // benefits / product / footer rendered read-only in v1 — image regen
      // and bullet/cell editing are v2.
      return (
        <div>
          {heading}
          <div
            style={{
              fontSize: 12,
              color: 'var(--muted)',
              fontStyle: 'italic',
              padding: '8px 12px',
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          >
            Live preview — regenerate the email to refresh this section's copy.
          </div>
        </div>
      )
  }
}
