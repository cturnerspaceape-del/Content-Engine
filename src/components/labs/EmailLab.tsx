import { useMemo, useState } from 'react'
import EmailTypePicker from '../email/EmailTypePicker'
import AudienceToggle from '../email/AudienceToggle'
import EmailPreview from '../email/EmailPreview'
import EmailEditor from '../email/EmailEditor'
import { usePersistedState } from '../../utils/persistedState'
import { composeHtml } from '../../lib/email/composeHtml'
import { generateEmail, generateEmailImage } from '../../lib/email/api'
import type {
  EmailCampaign,
  EmailType,
  AudienceType,
  GeneratedEmail,
  EmailSection,
  HeroSectionData,
  ProductSectionData,
} from '../../lib/email/types'

interface EmailLabProps {
  onBack: () => void
}

const DEFAULT_CAMPAIGN: EmailCampaign = {
  campaignName: 'Untitled email',
  emailType: 'promo',
  audienceType: 'existing',
  email: null,
  cache: {},
}

// After Gemini returns subject + sections (with imagePrompt slots but no
// imageUrl), fan out parallel image generation calls and patch the URLs in.
async function hydrateImages(email: GeneratedEmail, flavor?: string): Promise<GeneratedEmail> {
  const tasks: Array<Promise<void>> = []
  const next: GeneratedEmail = {
    ...email,
    sections: email.sections.map((s) => ({ ...s, data: { ...(s.data as object) } } as EmailSection)),
  }

  for (const section of next.sections) {
    if (section.kind === 'hero') {
      const data = section.data as HeroSectionData
      const prompt = data.imagePrompt
      if (prompt && !data.imageUrl) {
        tasks.push(
          generateEmailImage({ slot: 'hero', prompt, flavor })
            .then((r) => {
              data.imageUrl = r.url
            })
            .catch((err) => {
              data.imageError = err instanceof Error ? err.message : String(err)
            }),
        )
      }
    }
    if (section.kind === 'product') {
      const data = section.data as ProductSectionData
      data.cells = data.cells.map((cell) => ({ ...cell }))
      for (const cell of data.cells) {
        const prompt = cell.imagePrompt
        if (prompt && !cell.imageUrl) {
          tasks.push(
            generateEmailImage({ slot: 'product', prompt, flavor })
              .then((r) => {
                cell.imageUrl = r.url
              })
              .catch((err) => {
                cell.imageError = err instanceof Error ? err.message : String(err)
              }),
          )
        }
      }
    }
  }

  await Promise.all(tasks)
  return next
}

export default function EmailLab({ onBack }: EmailLabProps) {
  const [campaign, setCampaign] = usePersistedState<EmailCampaign>(
    'sl:emailLab:campaign',
    () => DEFAULT_CAMPAIGN,
  )
  const [viewport, setViewport] = usePersistedState<'desktop' | 'mobile'>(
    'sl:emailLab:viewport',
    'desktop',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const html = useMemo(() => (campaign.email ? composeHtml(campaign.email) : ''), [campaign.email])

  const cachedAudiences: AudienceType[] = []
  if (campaign.cache.existing) cachedAudiences.push('existing')
  if (campaign.cache.inactive) cachedAudiences.push('inactive')

  const handleEmailTypeChange = (next: EmailType) => {
    // Switching email type invalidates the cached versions — different sections.
    setCampaign((cur) => ({
      ...cur,
      emailType: next,
      email: null,
      cache: {},
    }))
  }

  const runGenerate = async (audience: AudienceType, emailType: EmailType, force: boolean) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const cached = campaign.cache[audience]
      if (cached && !force) {
        setCampaign((cur) => ({ ...cur, audienceType: audience, email: cached }))
        return
      }
      const variationSeed = force ? Math.floor(Math.random() * 1e9) : undefined
      const { email } = await generateEmail({
        emailType,
        audience,
        variationSeed,
      })
      const hydrated = await hydrateImages(email)
      setCampaign((cur) => ({
        ...cur,
        audienceType: audience,
        email: hydrated,
        cache: { ...cur.cache, [audience]: hydrated },
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleAudienceChange = (next: AudienceType) => {
    if (next === campaign.audienceType) return
    const cached = campaign.cache[next]
    if (cached) {
      setCampaign((cur) => ({ ...cur, audienceType: next, email: cached }))
    } else if (campaign.email) {
      // Auto-generate the alternate audience version once the user has at
      // least generated something — avoids surprise empty preview.
      void runGenerate(next, campaign.emailType, false)
    } else {
      setCampaign((cur) => ({ ...cur, audienceType: next }))
    }
  }

  const handleGenerate = () => {
    void runGenerate(campaign.audienceType, campaign.emailType, true)
  }

  const handleEdit = (next: GeneratedEmail) => {
    setCampaign((cur) => ({
      ...cur,
      email: next,
      cache: { ...cur.cache, [cur.audienceType]: next },
    }))
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', padding: '32px 24px' }}>
      <div className="max-w-6xl mx-auto">
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
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            📧 Email Lab
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Lifecycle emails — generate, preview, send (coming soon)
          </p>
        </div>

        <EmailTypePicker value={campaign.emailType} onChange={handleEmailTypeChange} />
        <AudienceToggle
          value={campaign.audienceType}
          onChange={handleAudienceChange}
          cachedAudiences={cachedAudiences}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,360px) minmax(0,1fr)',
            gap: 24,
            marginTop: 16,
            alignItems: 'start',
          }}
        >
          <div>
            {campaign.email ? (
              <EmailEditor email={campaign.email} onChange={handleEdit} />
            ) : (
              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px dashed var(--border)',
                  borderRadius: 14,
                  padding: 32,
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 13,
                }}
              >
                No email yet. Click Generate to create your first draft.
              </div>
            )}
          </div>

          <div>
            {campaign.email ? (
              <EmailPreview
                html={html}
                subject={campaign.email.subject}
                preheader={campaign.email.preheader}
                viewport={viewport}
                onViewportChange={setViewport}
              />
            ) : (
              <div
                style={{
                  background: 'var(--panel)',
                  border: '1px dashed var(--border)',
                  borderRadius: 14,
                  padding: 64,
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: 14,
                }}
              >
                Preview will render here once you generate an email.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={busy}
              className="text-sm font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#0b0b0c',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {busy ? 'Generating…' : campaign.email ? '⚡ Regenerate' : '⚡ Generate email'}
            </button>
            <button
              disabled
              className="text-sm font-bold px-6 py-3 rounded-xl"
              title="Sending wires up in Phase 2 (Resend integration)"
              style={{
                background: 'rgba(148,163,184,.1)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
                cursor: 'not-allowed',
              }}
            >
              📤 Send (Phase 2)
            </button>
          </div>

          {error && (
            <div
              className="text-xs font-semibold px-4 py-2 rounded-lg max-w-xl text-center"
              style={{
                background: 'rgba(251,146,60,.12)',
                color: '#fb923c',
                border: '1px solid #fb923c',
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
