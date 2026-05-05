import { useMemo, useState } from 'react'
import type { ScheduledPost } from '../../types'
import { generateEmail } from '../../lib/email/api'
import { hydrateImages } from '../../lib/email/hydrateImages'
import { composeHtml } from '../../lib/email/composeHtml'
import { toEmailType } from '../../lib/research/researchedSeed'
import type { ResearchedSeed } from '../../lib/research/types'
import EmailPreview from '../email/EmailPreview'
import InlineSlotShell from './InlineSlotShell'

interface EmailSlotPanelProps {
  scheduled: ScheduledPost | undefined
  ensureSchedule: () => ScheduledPost
  // Per-slot trend signal. When set, derives the email type from it and
  // sends the angle/notes as a campaignNote so the LLM anchors copy to the
  // picked trend.
  slotResearch?: ResearchedSeed | null
  onChange: (post: ScheduledPost) => void
}

export default function EmailSlotPanel({
  scheduled,
  ensureSchedule,
  slotResearch,
  onChange,
}: EmailSlotPanelProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')

  const email = scheduled?.email
  const html = useMemo(() => (email ? composeHtml(email) : ''), [email])

  const persist = (next: NonNullable<ScheduledPost['email']>) => {
    const target = ensureSchedule()
    onChange({ ...target, email: next })
  }

  const runGenerate = async (force: boolean) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const variationSeed = force ? Math.floor(Math.random() * 1e9) : undefined
      const emailType = slotResearch ? toEmailType(slotResearch) : 'promo'
      const campaignNote = slotResearch
        ? `Trend angle: ${slotResearch.angle}${
            slotResearch.sourceNotes ? ` (signal: ${slotResearch.sourceNotes})` : ''
          }`
        : undefined
      const { email: generated } = await generateEmail({
        emailType,
        audience: 'existing',
        variationSeed,
        campaignNote,
      })
      const hydrated = await hydrateImages(generated)
      persist(hydrated)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <InlineSlotShell
      hasContent={!!email}
      busy={busy}
      error={error}
      generateLabel="✨ Generate email"
      emptyHint="Calls the same generator as Email Lab — subject, hero, and product slots in one click."
      onGenerate={() => void runGenerate(false)}
      onShuffle={() => void runGenerate(true)}
      onRegen={() => void runGenerate(true)}
      accentColor="#f59e0b"
    >
      {email && (
        <EmailPreview
          html={html}
          subject={email.subject}
          preheader={email.preheader}
          viewport={viewport}
          onViewportChange={setViewport}
        />
      )}
    </InlineSlotShell>
  )
}
