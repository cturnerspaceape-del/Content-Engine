import { useState } from 'react'
import { usePersistedState } from '../../utils/persistedState'
import { generatePrintImage } from '../../lib/print/api'
import type { PrintCampaign, PrintPiece, TrifoldPiece } from '../../lib/print/types'
import type { PrintFormat } from '../../types'
import { downloadPrintPdf } from '../../lib/print/pdf'

interface PrintLabProps {
  onBack: () => void
}

const DEFAULT_CAMPAIGN: PrintCampaign = {
  activeFormat: 'Poster',
  poster: null,
  trifold: null,
  sticker: null,
}

const FLAVORS = [
  'Amped Apple',
  'Blue Frenzy',
  'Blue Zlushie',
  'Dragon Drip',
  'Lemon Cherry Slam',
  'Lime Zest',
  'Midnight Cherry Pop',
  'Nebula Grape Groove',
  'Oryon Lemonade',
  'Raspberry Rebel',
  'Razzle Dazzle',
  'Electric Apple',
] as const

const FORMATS: { id: PrintFormat; emoji: string; tagline: string }[] = [
  { id: 'Poster', emoji: '🪧', tagline: '13×19 retail poster' },
  { id: 'Trifold', emoji: '📰', tagline: '6.33×11 panels — 3-up on 13×19' },
  { id: 'Sticker', emoji: '✨', tagline: '3×3 die-cut sticker' },
]

const DEFAULT_PROMPTS: Record<PrintFormat, string> = {
  Poster:
    'Hero product centered on a glossy gradient backdrop. Big confident headline space at top reading "STAY APE". Showroom-ready.',
  Trifold:
    'Magazine-style brochure panel. Hero product on the left, flavor lockup and short tagline on the right with room for body copy.',
  Sticker:
    'Sticker-pop badge with the product silhouette and a bold flavor word. Thick clean outline so it reads at 3 inches.',
}

export default function PrintLab({ onBack }: PrintLabProps) {
  const [campaign, setCampaign] = usePersistedState<PrintCampaign>(
    'sl:printLab:campaign',
    () => DEFAULT_CAMPAIGN,
  )

  const setFormat = (next: PrintFormat) => {
    setCampaign((cur) => ({ ...cur, activeFormat: next }))
  }

  const accent = '#0ea5e9'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '32px 24px' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-4" style={{ position: 'relative', textAlign: 'center' }}>
          <button
            onClick={onBack}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              background: 'rgba(148,163,184,.1)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            ← Back
          </button>
          <h1
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🖨️ Print Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Posters, brochures, stickers — generate art then export a print-ready PDF
          </p>
        </div>

        {/* Format picker */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {FORMATS.map((f) => {
            const active = campaign.activeFormat === f.id
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: active ? accent : 'var(--panel-2)',
                  color: active ? '#fff' : 'var(--text)',
                  border: active ? '1px solid transparent' : '1px solid var(--border)',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                }}
                title={f.tagline}
              >
                <span className="mr-1.5">{f.emoji}</span>
                {f.id}
              </button>
            )
          })}
        </div>

        {campaign.activeFormat === 'Poster' && (
          <SinglePanel
            label="Poster"
            pieceType="poster"
            piece={campaign.poster}
            onChange={(p) => setCampaign((cur) => ({ ...cur, poster: p }))}
          />
        )}
        {campaign.activeFormat === 'Sticker' && (
          <SinglePanel
            label="Sticker"
            pieceType="sticker"
            piece={campaign.sticker}
            onChange={(p) => setCampaign((cur) => ({ ...cur, sticker: p }))}
          />
        )}
        {campaign.activeFormat === 'Trifold' && (
          <TrifoldEditor
            piece={campaign.trifold}
            onChange={(p) => setCampaign((cur) => ({ ...cur, trifold: p }))}
          />
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={() => void downloadPrintPdf(campaign)}
            disabled={!hasArtForActiveFormat(campaign)}
            className="text-sm font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
              color: '#fff',
              boxShadow: 'var(--shadow-md)',
            }}
            title={
              hasArtForActiveFormat(campaign)
                ? 'Compose 13×19 PDF (or 3×3 PDF for sticker) ready to send to a print shop'
                : 'Generate art first'
            }
          >
            ⬇ Export print-ready PDF
          </button>
        </div>
      </div>
    </div>
  )
}

function hasArtForActiveFormat(c: PrintCampaign): boolean {
  if (c.activeFormat === 'Poster') return !!c.poster?.imageUrl
  if (c.activeFormat === 'Sticker') return !!c.sticker?.imageUrl
  if (c.activeFormat === 'Trifold') {
    return !!(c.trifold?.outsidePanel?.imageUrl && c.trifold?.insidePanel?.imageUrl)
  }
  return false
}

interface SinglePanelProps {
  label: string
  pieceType: 'poster' | 'sticker'
  piece: PrintPiece | null
  onChange: (p: PrintPiece) => void
}

function SinglePanel({ label, pieceType, piece, onChange }: SinglePanelProps) {
  return (
    <PieceEditor
      title={label}
      pieceType={pieceType}
      piece={piece}
      defaultPrompt={DEFAULT_PROMPTS[pieceType === 'poster' ? 'Poster' : 'Sticker']}
      aspectStyle={
        pieceType === 'poster'
          ? { aspectRatio: '13 / 19', maxWidth: 360 }
          : { aspectRatio: '1 / 1', maxWidth: 320 }
      }
      onChange={onChange}
    />
  )
}

interface TrifoldEditorProps {
  piece: TrifoldPiece | null
  onChange: (p: TrifoldPiece) => void
}

function TrifoldEditor({ piece, onChange }: TrifoldEditorProps) {
  const outside = piece?.outsidePanel ?? null
  const inside = piece?.insidePanel ?? null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PieceEditor
        title="Outside panel"
        subtitle="Cover face — what someone sees stacked face-up"
        pieceType="trifold-panel"
        piece={outside}
        defaultPrompt={DEFAULT_PROMPTS.Trifold + ' Outside / cover face — strongest hero, big headline.'}
        aspectStyle={{ aspectRatio: '6.33 / 11', maxWidth: 220 }}
        onChange={(p) => onChange({ outsidePanel: p, insidePanel: inside })}
      />
      <PieceEditor
        title="Inside panel"
        subtitle="Body face — opens to reveal this"
        pieceType="trifold-panel"
        piece={inside}
        defaultPrompt={DEFAULT_PROMPTS.Trifold + ' Inside / body face — denser content, secondary product shots, body copy block.'}
        aspectStyle={{ aspectRatio: '6.33 / 11', maxWidth: 220 }}
        onChange={(p) => onChange({ outsidePanel: outside, insidePanel: p })}
      />
    </div>
  )
}

interface PieceEditorProps {
  title: string
  subtitle?: string
  pieceType: 'poster' | 'trifold-panel' | 'sticker'
  piece: PrintPiece | null
  defaultPrompt: string
  aspectStyle: React.CSSProperties
  onChange: (p: PrintPiece) => void
}

function PieceEditor({
  title,
  subtitle,
  pieceType,
  piece,
  defaultPrompt,
  aspectStyle,
  onChange,
}: PieceEditorProps) {
  const [prompt, setPrompt] = useState<string>(piece?.imagePrompt ?? defaultPrompt)
  const [flavor, setFlavor] = useState<string>(piece?.flavor ?? FLAVORS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (force: boolean) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const variationSeed = force ? Math.floor(Math.random() * 1e9) : piece?.variationSeed
      const r = await generatePrintImage({ pieceType, prompt, flavor, variationSeed })
      onChange({
        pieceType,
        imageUrl: r.url,
        imagePrompt: prompt,
        flavor: r.flavor,
        variationSeed,
        generatedAt: new Date().toISOString(),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      className="glass-panel"
      style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div>
        <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Image preview */}
      <div
        className="rounded-xl overflow-hidden mx-auto w-full"
        style={{
          ...aspectStyle,
          background: 'var(--panel-2)',
          border: '1px dashed var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {piece?.imageUrl ? (
          <img
            src={piece.imageUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {busy ? 'Generating…' : 'No art yet'}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Brief
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="px-3 py-2 rounded-lg text-sm resize-y"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'inherit',
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Flavor
          </label>
          <select
            value={flavor}
            onChange={(e) => setFlavor(e.target.value)}
            className="px-2 py-1 rounded-lg text-xs"
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            {FLAVORS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          <button
            onClick={() => void run(false)}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: piece ? 'rgba(184,164,255,.18)' : '#0ea5e9',
              color: piece ? '#7c5fff' : '#fff',
              border: piece ? '1px solid #b8a4ff55' : 'none',
            }}
          >
            {busy ? 'Generating…' : piece ? '↻ Regenerate' : '✨ Generate'}
          </button>
          {piece && (
            <button
              onClick={() => void run(true)}
              disabled={busy}
              className="px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: 'var(--panel-2)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              🔀 Shuffle
            </button>
          )}
        </div>

        {error && (
          <p className="text-[11px]" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>
    </section>
  )
}
