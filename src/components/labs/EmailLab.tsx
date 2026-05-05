import { useEffect, useMemo, useState } from 'react'
import EmailTypePicker from '../email/EmailTypePicker'
import AudienceToggle from '../email/AudienceToggle'
import EmailPreview from '../email/EmailPreview'
import EmailEditor, { type ReRollTarget } from '../email/EmailEditor'
import { usePersistedState } from '../../utils/persistedState'
import { composeHtml } from '../../lib/email/composeHtml'
import { generateEmail, generateEmailImage } from '../../lib/email/api'
import { hydrateImages } from '../../lib/email/hydrateImages'
import type {
  EmailCampaign,
  EmailType,
  AudienceType,
  GeneratedEmail,
  EmailSection,
  HeroSectionData,
  ProductSectionData,
} from '../../lib/email/types'
import ResearchPanel from '../ResearchPanel'
import { useResearch } from '../../lib/research/useResearch'
import type { ResearchedSeed } from '../../lib/research/types'

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

// Derive a short style anchor the research prompt can use to keep its
// recommendations grounded in the brand's existing voice — last few generated
// subjects + section kinds are enough; we don't need full bodies.
function buildHistoricalContext(campaign: EmailCampaign): string | undefined {
  const items: string[] = []
  for (const audience of ['existing', 'inactive'] as const) {
    const cached = campaign.cache[audience]
    if (!cached) continue
    const subject = cached.subject?.trim()
    const sections = cached.sections.map((s) => s.kind).join(', ')
    if (subject || sections) {
      items.push(
        `(${audience}) subject: ${subject || '—'} · sections: ${sections || '—'}`,
      )
    }
  }
  return items.length > 0 ? items.join('\n') : undefined
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
  const [mobileTab, setMobileTab] = usePersistedState<'edit' | 'preview'>(
    'sl:emailLab:mobileTab',
    'edit',
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reRollBusy, setReRollBusy] = useState<Set<string>>(() => new Set())
  const [recipientInput, setRecipientInput] = usePersistedState<string>(
    'sl:emailLab:lastRecipient',
    '',
  )
  const [sendBusy, setSendBusy] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ kind: 'sent' | 'error'; text: string } | null>(
    null,
  )

  // Active research seed index — reset to 0 whenever the user changes
  // emailType (since research is scoped to the type and switching slots in
  // a different cached set).
  const [activeResearchIdx, setActiveResearchIdx] = useState(0)

  const historicalContext = useMemo(() => buildHistoricalContext(campaign), [campaign])

  const {
    result: researchResult,
    loading: researchLoading,
    error: researchError,
    fetchTrends: fetchResearchTrends,
  } = useResearch('email', { emailType: campaign.emailType, historicalContext })

  // Reset active idx when the type-scoped result switches under us.
  useEffect(() => {
    setActiveResearchIdx(0)
  }, [campaign.emailType])

  // Open the lab to a clean slate — drop the current draft and any cached
  // per-audience generations. Email type, audience, viewport, and last
  // recipient are kept so users don't re-enter basics every visit.
  useEffect(() => {
    setCampaign((cur) => ({ ...cur, email: null, cache: {} }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const researchSeeds: ResearchedSeed[] = researchResult
    ? [researchResult.recommendation, ...researchResult.candidates].slice(0, 3)
    : []
  const activeResearchSeed: ResearchedSeed | null =
    researchSeeds.length > 0
      ? researchSeeds[Math.min(activeResearchIdx, researchSeeds.length - 1)]
      : null

  const html = useMemo(() => (campaign.email ? composeHtml(campaign.email) : ''), [campaign.email])

  const cachedAudiences: AudienceType[] = []
  if (campaign.cache.existing) cachedAudiences.push('existing')
  if (campaign.cache.inactive) cachedAudiences.push('inactive')

  const handleEmailTypeChange = (next: EmailType) => {
    setCampaign((cur) => ({
      ...cur,
      emailType: next,
      email: null,
      cache: {},
    }))
    setActiveResearchIdx(0)
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
      const campaignNote = activeResearchSeed
        ? `Trend angle: ${activeResearchSeed.angle}${
            activeResearchSeed.sourceNotes ? ` (signal: ${activeResearchSeed.sourceNotes})` : ''
          }`
        : undefined
      const { email } = await generateEmail({
        emailType,
        audience,
        variationSeed,
        campaignNote,
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
      void runGenerate(next, campaign.emailType, false)
    } else {
      setCampaign((cur) => ({ ...cur, audienceType: next }))
    }
  }

  const handleGenerate = () => {
    void runGenerate(campaign.audienceType, campaign.emailType, true)
  }

  const handleResearched = () => {
    // Reset active idx so the recommendation is highlighted; the seeds are
    // sourced from researchResult, so no local copy needed.
    setActiveResearchIdx(0)
  }

  const handlePickSeed = (idx: number) => {
    setActiveResearchIdx(idx)
  }

  const parseRecipients = (raw: string): string[] =>
    raw
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

  const recipients = parseRecipients(recipientInput)
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const recipientsValid = recipients.length > 0 && recipients.every((r) => EMAIL_REGEX.test(r))
  const canSend = Boolean(campaign.email) && recipientsValid && !sendBusy && !busy

  const handleSend = async () => {
    if (!campaign.email || !canSend) return
    setSendBusy(true)
    setSendStatus(null)
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients,
          subject: campaign.email.subject,
          html,
          preheader: campaign.email.preheader,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Send failed (${res.status})`)
      }
      const label = recipients.length === 1 ? recipients[0] : `${recipients.length} recipients`
      setSendStatus({ kind: 'sent', text: `Sent ✓ to ${label}` })
      window.setTimeout(() => setSendStatus(null), 3000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setSendStatus({ kind: 'error', text: msg })
    } finally {
      setSendBusy(false)
    }
  }

  const handleEdit = (next: GeneratedEmail) => {
    setCampaign((cur) => ({
      ...cur,
      email: next,
      cache: { ...cur.cache, [cur.audienceType]: next },
    }))
  }

  const reRollKey = (t: ReRollTarget): string =>
    t.cellIdx == null ? `s${t.sectionIdx}` : `s${t.sectionIdx}c${t.cellIdx}`

  const handleReRollImage = async (target: ReRollTarget) => {
    const key = reRollKey(target)
    setReRollBusy((cur) => {
      const next = new Set(cur)
      next.add(key)
      return next
    })
    setError(null)
    try {
      const cur = campaign.email
      if (!cur) return
      const section = cur.sections[target.sectionIdx]
      if (!section) return

      let prompt: string | undefined
      let slot: 'hero' | 'product'
      if (target.cellIdx == null) {
        if (section.kind !== 'hero') return
        const heroData = section.data as HeroSectionData
        prompt = heroData.imagePrompt
        slot = 'hero'
      } else {
        if (section.kind !== 'product') return
        const productData = section.data as ProductSectionData
        prompt = productData.cells[target.cellIdx]?.imagePrompt
        slot = 'product'
      }
      if (!prompt) {
        setError('No image prompt on this slot — regenerate the email first.')
        return
      }

      const variationSeed = Math.floor(Math.random() * 1e9)
      try {
        const r = await generateEmailImage({ slot, prompt, variationSeed })
        setCampaign((curCampaign) => {
          if (!curCampaign.email) return curCampaign
          const sections = curCampaign.email.sections.map((s, i) => {
            if (i !== target.sectionIdx) return s
            if (target.cellIdx == null) {
              const heroData = s.data as HeroSectionData
              return {
                ...s,
                data: { ...heroData, imageUrl: r.url, imageError: undefined },
              } as EmailSection
            }
            const productData = s.data as ProductSectionData
            const cells = productData.cells.map((c, idx) =>
              idx === target.cellIdx
                ? { ...c, imageUrl: r.url, imageError: undefined }
                : c,
            )
            return { ...s, data: { ...productData, cells } } as EmailSection
          })
          const nextEmail = { ...curCampaign.email, sections }
          return {
            ...curCampaign,
            email: nextEmail,
            cache: { ...curCampaign.cache, [curCampaign.audienceType]: nextEmail },
          }
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        setCampaign((curCampaign) => {
          if (!curCampaign.email) return curCampaign
          const sections = curCampaign.email.sections.map((s, i) => {
            if (i !== target.sectionIdx) return s
            if (target.cellIdx == null) {
              const heroData = s.data as HeroSectionData
              return { ...s, data: { ...heroData, imageError: msg } } as EmailSection
            }
            const productData = s.data as ProductSectionData
            const cells = productData.cells.map((c, idx) =>
              idx === target.cellIdx ? { ...c, imageError: msg } : c,
            )
            return { ...s, data: { ...productData, cells } } as EmailSection
          })
          const nextEmail = { ...curCampaign.email, sections }
          return {
            ...curCampaign,
            email: nextEmail,
            cache: { ...curCampaign.cache, [curCampaign.audienceType]: nextEmail },
          }
        })
      }
    } finally {
      setReRollBusy((cur) => {
        const next = new Set(cur)
        next.delete(key)
        return next
      })
    }
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

        <ResearchPanel
          loading={researchLoading}
          error={researchError}
          result={researchResult}
          activeIdx={activeResearchIdx}
          onPickSeed={handlePickSeed}
          onResearched={handleResearched}
          fetchTrends={fetchResearchTrends}
          fetchScope={{ emailType: campaign.emailType, historicalContext }}
          idleTitle={`What's hot for ${campaign.emailType} emails?`}
          idleHint="Scoped to this email type — pulls fresh signal from Supreme, Scotch and Soda, Chomps, and @starface, then tunes 3 angles to your brand's existing voice."
          researchLabel={`Research ${campaign.emailType} trends`}
        />

        {/* Mobile-only Edit / Preview pill — desktop shows both panes side-by-side. */}
        <div className="md:hidden flex justify-center mt-3">
          <div
            className="inline-flex p-1 rounded-full"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--border)' }}
          >
            {(['edit', 'preview'] as const).map((tab) => {
              const active = mobileTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className="text-xs font-bold px-4 py-1.5 rounded-full transition-all"
                  style={{
                    background: active ? 'var(--brand-pink)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--muted)',
                    minHeight: 32,
                  }}
                >
                  {tab === 'edit' ? '✍️ Edit' : '👁 Preview'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="email-lab-grid" data-mobile-tab={mobileTab}>
          <div className="email-lab-pane email-lab-edit">
            {campaign.email ? (
              <EmailEditor
                email={campaign.email}
                onChange={handleEdit}
                onReRollImage={handleReRollImage}
                busyKeys={reRollBusy}
              />
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

          <div className="email-lab-pane email-lab-preview">
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
          {campaign.email && (
            <div className="flex items-center gap-2 w-full max-w-xl">
              <input
                type="text"
                inputMode="email"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="you@example.com (commas for multiple)"
                aria-label="Recipient email"
                className="flex-1 text-xs px-3 py-2 rounded-lg"
                style={{
                  background: 'var(--panel-2)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                }}
              />
              {recipients.length > 0 && (
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                  {recipients.length} {recipients.length === 1 ? 'recipient' : 'recipients'}
                  {!recipientsValid && ' — invalid'}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2 items-start">
            <button
              onClick={handleGenerate}
              disabled={busy || sendBusy}
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
              onClick={() => void handleSend()}
              disabled={!canSend}
              title={
                !campaign.email
                  ? 'Generate an email first'
                  : !recipientsValid
                  ? 'Enter a valid recipient email'
                  : 'Send via Resend'
              }
              className="text-sm font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: canSend ? 'var(--accent)' : 'rgba(148,163,184,.1)',
                color: canSend ? '#fff' : 'var(--muted)',
                border: canSend ? '1px solid var(--accent)' : '1px solid var(--border)',
                cursor: canSend ? 'pointer' : 'not-allowed',
              }}
            >
              {sendBusy ? 'Sending…' : '📤 Send'}
            </button>
          </div>

          {sendStatus && (
            <div
              className="text-xs font-semibold px-4 py-2 rounded-lg max-w-xl text-center"
              style={{
                background:
                  sendStatus.kind === 'sent' ? 'rgba(34,197,94,.12)' : 'rgba(239,68,68,.1)',
                color: sendStatus.kind === 'sent' ? '#22c55e' : '#ef4444',
                border:
                  sendStatus.kind === 'sent'
                    ? '1px solid rgba(34,197,94,.4)'
                    : '1px solid rgba(239,68,68,.4)',
              }}
            >
              {sendStatus.kind === 'sent' ? sendStatus.text : `Send failed: ${sendStatus.text}`}
            </div>
          )}

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
