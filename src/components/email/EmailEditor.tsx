import type {
  GeneratedEmail,
  EmailSection,
  HeroSectionData,
  ProductSectionData,
  ProductCellData,
} from '../../lib/email/types'
import IconActionButton from '../ui/IconActionButton'

export interface ReRollTarget {
  sectionIdx: number
  cellIdx?: number
}

function reRollKey(t: ReRollTarget): string {
  return t.cellIdx == null ? `s${t.sectionIdx}` : `s${t.sectionIdx}c${t.cellIdx}`
}

interface EmailEditorProps {
  email: GeneratedEmail
  onChange: (next: GeneratedEmail) => void
  onReRollImage?: (target: ReRollTarget) => void
  onEditImage?: (target: ReRollTarget) => void
  busyKeys?: ReadonlySet<string>
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

export default function EmailEditor({
  email,
  onChange,
  onReRollImage,
  onEditImage,
  busyKeys,
}: EmailEditorProps) {
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
          sectionIdx={idx}
          onPatch={(patch) => onChange(patchSection(email, idx, patch))}
          onReRollImage={onReRollImage}
          onEditImage={onEditImage}
          busyKeys={busyKeys}
        />
      ))}
    </div>
  )
}

function ImageRow({
  imageUrl,
  imageError,
  busy,
  onReRoll,
  onEdit,
  label,
}: {
  imageUrl?: string
  imageError?: string
  busy: boolean
  onReRoll?: () => void
  onEdit?: () => void
  label?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 8,
        marginBottom: 8,
        background: 'var(--panel-2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--muted)',
          fontSize: 11,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : imageError ? (
          <span title={imageError}>⚠️</span>
        ) : (
          <span>◌</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {label && (
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        )}
        {imageError && (
          <div
            style={{
              fontSize: 10,
              color: '#fb923c',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={imageError}
          >
            {imageError}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {onEdit && imageUrl && (
          <IconActionButton
            icon="✏️"
            label="Edit"
            tone="edit"
            size="md"
            title="Edit this image"
            disabled={busy}
            onClick={onEdit}
          />
        )}
        {onReRoll && (
          <IconActionButton
            icon={busy ? '' : '🎲'}
            label={busy ? '…' : 'Reroll'}
            tone="reroll"
            size="md"
            title="Reroll this image"
            disabled={busy}
            onClick={onReRoll}
          />
        )}
      </div>
    </div>
  )
}

function SectionEditor({
  section,
  sectionIdx,
  onPatch,
  onReRollImage,
  onEditImage,
  busyKeys,
}: {
  section: EmailSection
  sectionIdx: number
  onPatch: (patch: Record<string, unknown>) => void
  onReRollImage?: (target: ReRollTarget) => void
  onEditImage?: (target: ReRollTarget) => void
  busyKeys?: ReadonlySet<string>
}) {
  const data = section.data as unknown as Record<string, unknown>
  const heading = (
    <div style={{ ...labelStyle, color: '#f59e0b' }}>{section.kind.replace('_', ' ')}</div>
  )

  switch (section.kind) {
    case 'hero': {
      const hero = section.data as HeroSectionData
      const heroBusy = busyKeys?.has(reRollKey({ sectionIdx })) ?? false
      return (
        <div>
          {heading}
          <ImageRow
            imageUrl={hero.imageUrl}
            imageError={hero.imageError}
            busy={heroBusy}
            onReRoll={onReRollImage ? () => onReRollImage({ sectionIdx }) : undefined}
            onEdit={onEditImage ? () => onEditImage({ sectionIdx }) : undefined}
            label="Hero image"
          />
          <input
            value={hero.eyebrow ?? ''}
            onChange={(e) => onPatch({ eyebrow: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8 }}
            placeholder="Eyebrow (optional)"
          />
          <input
            value={hero.headline ?? ''}
            onChange={(e) => onPatch({ headline: e.target.value })}
            style={{ ...inputStyle, marginBottom: 8, fontWeight: 700 }}
            placeholder="Headline"
          />
          <textarea
            value={hero.subhead ?? ''}
            onChange={(e) => onPatch({ subhead: e.target.value })}
            style={{ ...inputStyle, minHeight: 60, marginBottom: 8 }}
            placeholder="Subhead / hero caption (optional)"
          />
          <input
            value={hero.imagePrompt ?? ''}
            onChange={(e) => onPatch({ imagePrompt: e.target.value })}
            style={{ ...inputStyle, fontSize: 12, color: 'var(--muted)' }}
            placeholder="Image prompt (edit before re-rolling)"
          />
        </div>
      )
    }
    case 'product': {
      const product = section.data as ProductSectionData
      const updateCell = (idx: number, patch: Partial<ProductCellData>) => {
        const nextCells = product.cells.map((c, i) => (i === idx ? { ...c, ...patch } : c))
        onPatch({ cells: nextCells })
      }
      return (
        <div>
          {heading}
          <input
            value={product.title ?? ''}
            onChange={(e) => onPatch({ title: e.target.value })}
            style={{ ...inputStyle, marginBottom: 10 }}
            placeholder="Section title (optional, e.g. THE DROP)"
          />
          {product.cells.length === 0 ? (
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
              No cells yet — regenerate the email.
            </div>
          ) : (
            product.cells.map((cell: ProductCellData, cellIdx: number) => {
              const busy = busyKeys?.has(reRollKey({ sectionIdx, cellIdx })) ?? false
              return (
                <div key={cellIdx} style={{ marginBottom: 10 }}>
                  <ImageRow
                    imageUrl={cell.imageUrl}
                    imageError={cell.imageError}
                    busy={busy}
                    onReRoll={
                      onReRollImage
                        ? () => onReRollImage({ sectionIdx, cellIdx })
                        : undefined
                    }
                    onEdit={
                      onEditImage
                        ? () => onEditImage({ sectionIdx, cellIdx })
                        : undefined
                    }
                    label={cell.name}
                  />
                  <input
                    value={cell.name ?? ''}
                    onChange={(e) => updateCell(cellIdx, { name: e.target.value })}
                    style={{ ...inputStyle, marginBottom: 6, fontWeight: 700 }}
                    placeholder="Product name"
                  />
                  <textarea
                    value={cell.blurb ?? ''}
                    onChange={(e) => updateCell(cellIdx, { blurb: e.target.value })}
                    style={{ ...inputStyle, minHeight: 50, marginBottom: 6 }}
                    placeholder="Photo caption (shown under the image)"
                  />
                  <input
                    value={cell.imagePrompt ?? ''}
                    onChange={(e) => updateCell(cellIdx, { imagePrompt: e.target.value })}
                    style={{
                      ...inputStyle,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                    placeholder="Image prompt for this cell"
                  />
                </div>
              )
            })
          )}
        </div>
      )
    }
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
