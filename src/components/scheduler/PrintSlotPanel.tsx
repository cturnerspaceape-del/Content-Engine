import { useState } from 'react'
import type { PrintFormat, ScheduledPost } from '../../types'
import type { PrintPiece, PrintPieceType, TrifoldPiece } from '../../lib/print/types'
import { isTrifold } from '../../lib/print/types'
import { generatePrintImage } from '../../lib/print/api'
import InlineSlotShell from './InlineSlotShell'

interface PrintSlotPanelProps {
  format: PrintFormat
  scheduled: ScheduledPost | undefined
  ensureSchedule: () => ScheduledPost
  onChange: (post: ScheduledPost) => void
  onOpenPrintLab: () => void
}

const PIECE_TYPE_FOR_FORMAT: Record<PrintFormat, PrintPieceType> = {
  Poster: 'poster',
  Sticker: 'sticker',
  Trifold: 'trifold-panel',
}

const DEFAULT_BRIEF: Record<PrintFormat, string> = {
  Poster: 'Hero product centered with a bold headline space at the top.',
  Sticker: 'Sticker-pop badge with the product silhouette and a flavor word.',
  Trifold: 'Cover face — hero product on the left, flavor lockup and tagline on the right.',
}

export default function PrintSlotPanel({
  format,
  scheduled,
  ensureSchedule,
  onChange,
  onOpenPrintLab,
}: PrintSlotPanelProps) {
  const stored = scheduled?.print
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewPiece: PrintPiece | null = (() => {
    if (!stored) return null
    if (isTrifold(stored)) return stored.outsidePanel
    return stored
  })()
  const hasContent = !!previewPiece?.imageUrl

  const persist = (next: PrintPiece | TrifoldPiece) => {
    const target = ensureSchedule()
    onChange({ ...target, print: next })
  }

  const runGenerate = async (force: boolean) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const pieceType = PIECE_TYPE_FOR_FORMAT[format]
      const variationSeed = force ? Math.floor(Math.random() * 1e9) : undefined
      const r = await generatePrintImage({
        pieceType,
        prompt: DEFAULT_BRIEF[format],
        variationSeed,
      })
      const piece: PrintPiece = {
        pieceType,
        imageUrl: r.url,
        imagePrompt: DEFAULT_BRIEF[format],
        flavor: r.flavor,
        variationSeed,
        generatedAt: new Date().toISOString(),
      }
      // For Trifold the inline generator only produces the outside face — Print
      // Lab is required to design the inside face and export the imposed PDF.
      if (format === 'Trifold') {
        const cur = stored && isTrifold(stored) ? stored : null
        persist({ outsidePanel: piece, insidePanel: cur?.insidePanel ?? null })
      } else {
        persist(piece)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const emptyHint =
    format === 'Trifold'
      ? 'Generates the cover face — open Print Lab to design the inside face and export the print-ready PDF.'
      : 'Generates a single piece — open Print Lab to export a print-ready PDF.'

  return (
    <InlineSlotShell
      hasContent={hasContent}
      busy={busy}
      error={error}
      generateLabel={`✨ Generate ${format}`}
      emptyHint={emptyHint}
      onGenerate={() => void runGenerate(false)}
      onShuffle={() => void runGenerate(true)}
      onRegen={() => void runGenerate(true)}
      accentColor="#0ea5e9"
    >
      {previewPiece?.imageUrl && (
        <div
          className="rounded-xl overflow-hidden mx-auto"
          style={{
            background: 'var(--panel-2)',
            maxWidth: format === 'Sticker' ? 240 : format === 'Poster' ? 280 : 220,
            width: '100%',
            aspectRatio:
              format === 'Sticker' ? '1 / 1' : format === 'Poster' ? '13 / 19' : '6.33 / 11',
          }}
        >
          <img
            src={previewPiece.imageUrl}
            alt={`${format} preview`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
      <button
        onClick={onOpenPrintLab}
        className="self-start px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
        style={{
          background: 'rgba(14,165,233,.15)',
          color: '#0ea5e9',
          border: '1px solid #0ea5e955',
        }}
      >
        🖨️ Open in Print Lab
      </button>
    </InlineSlotShell>
  )
}
