import { useState } from 'react'
import type { ResearchedSeed, ResearchResult } from '../lib/research/types'
import type { ContentPillar } from '../types'
import type { ResearchScope } from '../lib/research/useResearch'

// Sentinel index for the user-authored custom seed. Sits past the 3 research
// cards so the parent's activeIdx logic treats it as a normal selection.
const CUSTOM_SEED_IDX = 99

const PILLARS: ContentPillar[] = [
  'Lifestyle',
  'Product Centric',
  'Education',
  'Entertainment',
  'Brand Building',
  'Social Proof',
]

interface ResearchPanelProps {
  loading: boolean
  error: string | null
  result: ResearchResult | null
  // Index of the currently-active seed. -1 means "none picked yet" — the
  // user must explicitly choose a strategy before Generate is enabled.
  activeIdx: number
  // Fired when the user picks an idea card.
  onPickSeed: (idx: number, seed: ResearchedSeed) => void
  // Fired with the fresh recommendation + candidates after a successful fetch.
  // Callers should NOT auto-select index 0 — leave activeIdx at -1 so the
  // user picks the strategy they like best.
  onResearched: (rec: ResearchedSeed, candidates: ResearchedSeed[]) => void
  fetchTrends: (scope?: ResearchScope) => Promise<ResearchResult | null>
  // Scope passed into fetchTrends each click (e.g. EmailLab passes emailType).
  fetchScope?: ResearchScope
  // Idle/CTA copy overrides.
  idleTitle?: string
  idleHint?: string
  researchLabel?: string
  // When true, the custom-seed editor renders an extra "Visual brief"
  // textarea so users authoring a strategy from scratch can describe the
  // photo directly. Set by visual labs (Image, Carousel, Print). When the
  // field is left blank the lab-level handleGenerate falls back to `angle`.
  includeShotBrief?: boolean
}

const VISIBLE_COUNT = 3

function seedsFromResult(result: ResearchResult): ResearchedSeed[] {
  return [result.recommendation, ...result.candidates].slice(0, VISIBLE_COUNT)
}

export default function ResearchPanel({
  loading,
  error,
  result,
  activeIdx,
  onPickSeed,
  onResearched,
  fetchTrends,
  fetchScope,
  idleTitle = 'Find what’s hot right now',
  idleHint = 'Hunts trending posts on Instagram and TikTok across cannabis-adjacent lifestyle (nightlife, streetwear, music, party culture) — then writes you 3 ideas to ship next.',
  researchLabel = 'Research trends',
  includeShotBrief = false,
}: ResearchPanelProps) {
  // Editor state lives at the panel level so the same form is reachable from
  // both the idle CTA ("Write my own" peer button) and the post-research
  // strategy grid (footer peer button).
  const [editing, setEditing] = useState(false)
  const [pillar, setPillar] = useState<ContentPillar>('Lifestyle')
  const [subcategory, setSubcategory] = useState('')
  const [angle, setAngle] = useState('')
  const [shotBriefText, setShotBriefText] = useState('')

  const customActive = activeIdx === CUSTOM_SEED_IDX
  const hasCustomDraft = subcategory.trim().length > 0 && angle.trim().length > 0

  const handleFetch = async () => {
    const fresh = await fetchTrends(fetchScope)
    if (fresh) onResearched(fresh.recommendation, fresh.candidates)
  }

  const handleSubmitCustom = () => {
    if (!hasCustomDraft) return
    const trimmedBrief = shotBriefText.trim()
    onPickSeed(CUSTOM_SEED_IDX, {
      pillar,
      subcategory: subcategory.trim(),
      angle: angle.trim(),
      sourceAccounts: [],
      sourceNotes: '',
      // Only attach when the user actually filled it in — visual labs
      // fall back to `angle` when shotBrief is absent.
      ...(includeShotBrief && trimmedBrief ? { shotBrief: trimmedBrief } : {}),
    })
    setEditing(false)
  }

  if (loading) {
    return <PanelShell><LoadingState /></PanelShell>
  }

  if (editing) {
    return (
      <PanelShell>
        <CustomSeedEditor
          pillar={pillar}
          subcategory={subcategory}
          angle={angle}
          shotBriefText={shotBriefText}
          includeShotBrief={includeShotBrief}
          onPillarChange={setPillar}
          onSubcategoryChange={setSubcategory}
          onAngleChange={setAngle}
          onShotBriefChange={setShotBriefText}
          canSubmit={hasCustomDraft}
          onSubmit={handleSubmitCustom}
          onCancel={() => setEditing(false)}
        />
      </PanelShell>
    )
  }

  if (!result) {
    return (
      <PanelShell>
        <IdleState
          title={idleTitle}
          hint={idleHint}
          label={researchLabel}
          error={error}
          onResearch={() => void handleFetch()}
          onWriteOwn={() => setEditing(true)}
        />
        {customActive && hasCustomDraft && (
          <div className="mt-3">
            <CustomActiveCard
              pillar={pillar}
              subcategory={subcategory}
              angle={angle}
              onEdit={() => setEditing(true)}
            />
          </div>
        )}
      </PanelShell>
    )
  }

  const seeds = seedsFromResult(result)
  // -1 (or any out-of-range index) means "nothing picked yet" — every card
  // renders unselected and the parent's Generate button stays disabled.
  const activeSafe = activeIdx >= 0 && activeIdx < seeds.length ? activeIdx : -1

  return (
    <PanelShell>
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] font-bold" style={{ color: 'var(--muted)' }}>
            Pick a strategy
          </p>
          <button
            onClick={() => void handleFetch()}
            className="text-[11px] font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--muted)' }}
          >
            🔄 Refresh
          </button>
        </div>

        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            alignItems: 'stretch',
          }}
        >
          {seeds.map((seed, idx) => (
            <StrategyCard
              key={seed.subcategory + idx}
              seed={seed}
              isActive={activeSafe === idx}
              onClick={() => onPickSeed(idx, seed)}
            />
          ))}
        </div>

        {customActive && hasCustomDraft ? (
          <CustomActiveCard
            pillar={pillar}
            subcategory={subcategory}
            angle={angle}
            onEdit={() => setEditing(true)}
          />
        ) : (
          <WriteOwnButton onClick={() => setEditing(true)} />
        )}

        {error && (
          <p className="text-[11px] text-center" style={{ color: '#fb923c' }}>
            {error}
          </p>
        )}
      </div>
    </PanelShell>
  )
}

function PanelShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl mx-auto w-full mb-4"
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        padding: 18,
        maxWidth: 720,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  )
}

function IdleState({
  title,
  hint,
  label,
  error,
  onResearch,
  onWriteOwn,
}: {
  title: string
  hint: string
  label: string
  error: string | null
  onResearch: () => void
  onWriteOwn: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h3 className="text-base font-bold" style={{ color: 'var(--text)' }}>
        {title}
      </h3>
      <p className="text-xs leading-relaxed max-w-md" style={{ color: 'var(--muted)' }}>
        {hint}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onResearch}
          className="text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
            color: 'white',
            boxShadow: '0 6px 20px -8px rgba(236,72,153,.6)',
          }}
        >
          🔍 {label}
        </button>
        <button
          onClick={onWriteOwn}
          className="text-sm font-bold px-6 py-3 rounded-xl transition-all hover:scale-105"
          style={{
            background: 'var(--panel-2)',
            color: 'var(--text)',
            border: '1px dashed var(--border)',
            cursor: 'pointer',
          }}
        >
          ✍ Write my own
        </button>
      </div>
      {error && (
        <p className="text-[11px]" style={{ color: '#fb923c' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function WriteOwnButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-bold rounded-xl transition-all hover:scale-[1.01]"
      style={{
        padding: '12px 16px',
        background: 'var(--panel-2)',
        color: 'var(--text)',
        border: '1px dashed var(--border)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <span style={{ color: 'var(--muted)' }}>✍</span>
      Or write my own
    </button>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-2 text-center py-2">
      <div
        className="animate-pulse"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        }}
      />
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        🔭 Scanning trends…
      </p>
      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
        Scanning IG + TikTok — last 14 days
      </p>
    </div>
  )
}

function StrategyCard({
  seed,
  isActive,
  onClick,
}: {
  seed: ResearchedSeed
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl transition-all hover:scale-[1.01]"
      style={{
        padding: '14px 16px',
        background: isActive
          ? 'linear-gradient(135deg, rgba(236,72,153,.14), rgba(139,92,246,.10))'
          : 'var(--panel-2)',
        border: isActive ? '1.5px solid #ec4899' : '1px solid var(--border)',
        boxShadow: isActive ? '0 6px 20px -10px rgba(236,72,153,.5)' : 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        {seed.pillar}
      </div>
      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
        {seed.subcategory}
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text)', opacity: 0.8 }}>
        {seed.angle}
      </p>
      {(() => {
        // Pre-rename caches stored this field as `sourceBrands`. Read both
        // so a stale persisted ResearchResult doesn't white-screen the lab.
        const accounts =
          seed.sourceAccounts ??
          (seed as unknown as { sourceBrands?: string[] }).sourceBrands ??
          []
        if (accounts.length === 0) return null
        return (
          <p className="text-[10px] mt-auto" style={{ color: 'var(--muted)' }}>
            Seen on{' '}
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
              {accounts.join(', ')}
            </span>
          </p>
        )
      })()}
    </button>
  )
}

function CustomActiveCard({
  pillar,
  subcategory,
  angle,
  onEdit,
}: {
  pillar: ContentPillar
  subcategory: string
  angle: string
  onEdit: () => void
}) {
  return (
    <button
      onClick={onEdit}
      className="text-left rounded-xl transition-all hover:scale-[1.01]"
      style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, rgba(236,72,153,.14), rgba(139,92,246,.10))',
        border: '1.5px solid #ec4899',
        boxShadow: '0 6px 20px -10px rgba(236,72,153,.5)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        {pillar} · Your strategy
      </div>
      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>
        {subcategory}
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text)', opacity: 0.8 }}>
        {angle}
      </p>
      <p className="text-[10px] mt-auto" style={{ color: 'var(--muted)' }}>
        Tap to edit
      </p>
    </button>
  )
}

function CustomSeedEditor({
  pillar,
  subcategory,
  angle,
  shotBriefText,
  includeShotBrief,
  onPillarChange,
  onSubcategoryChange,
  onAngleChange,
  onShotBriefChange,
  canSubmit,
  onSubmit,
  onCancel,
}: {
  pillar: ContentPillar
  subcategory: string
  angle: string
  shotBriefText: string
  includeShotBrief: boolean
  onPillarChange: (p: ContentPillar) => void
  onSubcategoryChange: (s: string) => void
  onAngleChange: (s: string) => void
  onShotBriefChange: (s: string) => void
  canSubmit: boolean
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="rounded-xl"
      style={{
        padding: '14px 16px',
        background: 'var(--panel-2)',
        border: '1.5px dashed #ec4899',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        Your strategy
      </div>
      <select
        value={pillar}
        onChange={(e) => onPillarChange(e.target.value as ContentPillar)}
        className="text-[11px] rounded px-2 py-1"
        style={{ background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)' }}
      >
        {PILLARS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        type="text"
        value={subcategory}
        onChange={(e) => onSubcategoryChange(e.target.value)}
        placeholder="Drop Hype Snippet"
        className="text-[12px] rounded px-2 py-1 font-bold"
        style={{ background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)' }}
      />
      <textarea
        value={angle}
        onChange={(e) => onAngleChange(e.target.value)}
        placeholder="Frame the post like a group-chat dispatch from a friend who just got their hands on the new drop."
        rows={3}
        className="text-[11px] rounded px-2 py-1 leading-relaxed resize-none"
        style={{ background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)' }}
      />
      {includeShotBrief && (
        <textarea
          value={shotBriefText}
          onChange={(e) => onShotBriefChange(e.target.value)}
          placeholder="Visual brief (optional). e.g. Tight overhead on matte black acrylic. Hard key from camera-left, sharp shadow. Kodak Portra 400 grain. Top-right 30% reserved for caption."
          rows={3}
          className="text-[11px] rounded px-2 py-1 leading-relaxed resize-none"
          style={{ background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)' }}
        />
      )}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="text-[11px] font-bold px-3 py-1.5 rounded transition-all"
          style={{
            background: canSubmit
              ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
              : 'var(--panel)',
            color: canSubmit ? 'white' : 'var(--muted)',
            border: canSubmit ? 'none' : '1px solid var(--border)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            flex: 1,
          }}
        >
          Use this strategy
        </button>
        <button
          onClick={onCancel}
          className="text-[11px] font-semibold px-3 py-1.5 rounded"
          style={{
            background: 'var(--panel)',
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
