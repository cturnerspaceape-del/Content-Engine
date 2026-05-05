import { useEffect, useState } from 'react'
import { usePersistedState } from '../../utils/persistedState'
import { generatePrintImage } from '../../lib/print/api'
import type { PrintCampaign, PrintPiece, TrifoldPiece } from '../../lib/print/types'
import type { PrintFormat } from '../../types'
import { downloadPrintPdf } from '../../lib/print/pdf'
import ResearchPanel from '../ResearchPanel'
import { useResearch } from '../../lib/research/useResearch'
import type { ResearchedSeed } from '../../lib/research/types'

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

// Per-format compositional scaffold. Combined with the active research seed's
// angle to produce the brief shown in the textarea — research is the only
// source of creative direction; this just keeps the printed dimensions /
// layout language consistent across runs.
const FORMAT_SCAFFOLD: Record<PrintFormat, string> = {
  Poster:
    '13×19 retail poster — hero product centered, generous headline space at top, clean composition that reads from across the room.',
  Trifold:
    '6.33×11 brochure panel — hero product, flavor lockup, and short tagline with room for body copy.',
  Sticker:
    '3×3 die-cut sticker — bold flavor word + product silhouette, thick clean outline so it reads at thumbnail size.',
}

export default function PrintLab({ onBack }: PrintLabProps) {
  const [campaign, setCampaign] = usePersistedState<PrintCampaign>(
    'sl:printLab:campaign',
    () => DEFAULT_CAMPAIGN,
  )

  const [researchSeeds, setResearchSeeds] = usePersistedState<ResearchedSeed[]>(
    'sl:printLab:researchSeeds',
    () => [],
  )
  const [activeResearchIdx, setActiveResearchIdx] = usePersistedState<number>(
    'sl:printLab:activeResearchIdx',
    0,
  )
  const {
    result: researchResult,
    loading: researchLoading,
    error: researchError,
    fetchTrends: fetchResearchTrends,
  } = useResearch('print')

  const activeResearchSeed: ResearchedSeed | null =
    researchSeeds.length > 0
      ? researchSeeds[Math.min(activeResearchIdx, researchSeeds.length - 1)]
      : null

  // Open the lab to a clean slate — drop any generated artwork and prior
  // research seeds. The active format selection is kept so users land on
  // whichever piece they were last working on.
  useEffect(() => {
    setCampaign((cur) => ({ ...DEFAULT_CAMPAIGN, activeFormat: cur.activeFormat }))
    setResearchSeeds([])
    setActiveResearchIdx(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setFormat = (next: PrintFormat) => {
    setCampaign((cur) => ({ ...cur, activeFormat: next }))
  }

  // Compose the brief = researched angle + format scaffold. The PieceEditor
  // listens for changes to this value (via useEffect) and reseeds its prompt
  // textarea whenever a different research candidate is picked, so switching
  // candidates after a piece has been generated still updates the prompt.
  const briefForFormat = (format: PrintFormat): string => {
    if (!activeResearchSeed) return FORMAT_SCAFFOLD[format]
    const sig = activeResearchSeed.sourceNotes
      ? `\nSignal: ${activeResearchSeed.sourceNotes}`
      : ''
    return `Trend angle: ${activeResearchSeed.angle}${sig}\n\nFormat: ${FORMAT_SCAFFOLD[format]}`
  }

  const handleResearched = (rec: ResearchedSeed, candidates: ResearchedSeed[]) => {
    setResearchSeeds([rec, ...candidates].slice(0, 3))
    setActiveResearchIdx(0)
  }

  const handlePickSeed = (idx: number) => {
    setActiveResearchIdx(idx)
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

        <ResearchPanel
          loading={researchLoading}
          error={researchError}
          result={researchResult}
          activeIdx={activeResearchIdx}
          onPickSeed={handlePickSeed}
          onResearched={handleResearched}
          fetchTrends={fetchResearchTrends}
          idleTitle="What's hot for print?"
          idleHint="Pulls fresh signal from Supreme, Scotch and Soda, Chomps, and @starface — then writes you 3 print angles to ship next."
          researchLabel="Research print trends"
        />

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

        {!activeResearchSeed ? (
          <div
            className="text-center mx-auto"
            style={{
              maxWidth: 480,
              padding: 32,
              background: 'var(--panel)',
              border: '1px dashed var(--border)',
              borderRadius: 16,
              color: 'var(--muted)',
              fontSize: 13,
            }}
          >
            Run Research above to pick a trend angle, then this lab will compose
            your print brief automatically.
          </div>
        ) : (
          <>
            {campaign.activeFormat === 'Poster' && (
              <SinglePanel
                label="Poster"
                pieceType="poster"
                piece={campaign.poster}
                brief={briefForFormat('Poster')}
                onChange={(p) => setCampaign((cur) => ({ ...cur, poster: p }))}
              />
            )}
            {campaign.activeFormat === 'Sticker' && (
              <SinglePanel
                label="Sticker"
                pieceType="sticker"
                piece={campaign.sticker}
                brief={briefForFormat('Sticker')}
                onChange={(p) => setCampaign((cur) => ({ ...cur, sticker: p }))}
              />
            )}
            {campaign.activeFormat === 'Trifold' && (
              <TrifoldEditor
                piece={campaign.trifold}
                brief={briefForFormat('Trifold')}
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
          </>
        )}
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
  brief: string
  onChange: (p: PrintPiece) => void
}

function SinglePanel({ label, pieceType, piece, brief, onChange }: SinglePanelProps) {
  return (
    <PieceEditor
      title={label}
      pieceType={pieceType}
      piece={piece}
      brief={brief}
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
  brief: string
  onChange: (p: TrifoldPiece) => void
}

function TrifoldEditor({ piece, brief, onChange }: TrifoldEditorProps) {
  const outside = piece?.outsidePanel ?? null
  const inside = piece?.insidePanel ?? null
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <PieceEditor
        title="Outside panel"
        subtitle="Cover face — what someone sees stacked face-up"
        pieceType="trifold-panel"
        piece={outside}
        brief={brief + '\n\nThis panel: outside / cover face — strongest hero, big headline.'}
        aspectStyle={{ aspectRatio: '6.33 / 11', maxWidth: 220 }}
        onChange={(p) => onChange({ outsidePanel: p, insidePanel: inside })}
      />
      <PieceEditor
        title="Inside panel"
        subtitle="Body face — opens to reveal this"
        pieceType="trifold-panel"
        piece={inside}
        brief={brief + '\n\nThis panel: inside / body face — denser content, secondary product shots, body copy block.'}
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
  // Composed brief from PrintLab — research angle + format scaffold. Changes
  // when the user picks a different research candidate; useEffect below
  // reseeds the textarea so the new brief takes effect on the next Generate.
  brief: string
  aspectStyle: React.CSSProperties
  onChange: (p: PrintPiece) => void
}

function PieceEditor({
  title,
  subtitle,
  pieceType,
  piece,
  brief,
  aspectStyle,
  onChange,
}: PieceEditorProps) {
  const [prompt, setPrompt] = useState<string>(piece?.imagePrompt ?? brief)
  const [flavor, setFlavor] = useState<string>(piece?.flavor ?? FLAVORS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When the parent's composed brief changes (user picked a different
  // research candidate), reseed the textarea. Without this, switching
  // candidates after a piece was generated would keep showing the old
  // imagePrompt because useState only initializes once.
  useEffect(() => {
    setPrompt(brief)
  }, [brief])

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
              🔀 New variation
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
