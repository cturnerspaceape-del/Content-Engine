import { useState } from 'react'
import { usePersistedState } from '../utils/persistedState'
import type { PlatformVariant, TunerPlatform } from '../lib/platformTuners'
import { platformColors } from './PlatformContentItem'

interface MultiPlatformPreviewProps {
  selected: ReadonlyArray<TunerPlatform>
  variants: Partial<Record<TunerPlatform, PlatformVariant>>
  assetUrl?: string
  assetKind?: 'image' | 'video'
  onRetune?: (platform: TunerPlatform) => void
  tabStateKey: string
}

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  Instagram: 'Instagram',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'Shorts',
  Email: 'Email',
}

const PLATFORM_ICONS: Record<TunerPlatform, string> = {
  Instagram: '📷',
  X: '𝕏',
  Threads: '@',
  TikTok: '🎵',
  'YouTube Shorts': '▶',
  Email: '📧',
}

export default function MultiPlatformPreview({
  selected,
  variants,
  assetUrl,
  assetKind,
  onRetune,
  tabStateKey,
}: MultiPlatformPreviewProps) {
  const [activeTab, setActiveTab] = usePersistedState<TunerPlatform>(
    tabStateKey,
    () => selected[0] ?? 'Instagram',
  )

  // If the active tab is no longer in the selection set (user deselected),
  // fall back to the first selected platform.
  const effectiveTab: TunerPlatform | undefined = selected.includes(activeTab)
    ? activeTab
    : selected[0]

  if (!effectiveTab) {
    return (
      <div className="text-center text-sm py-12" style={{ color: 'var(--muted)' }}>
        Pick at least one platform to preview a variant.
      </div>
    )
  }

  const variant = variants[effectiveTab]

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {selected.map((p) => {
          const active = effectiveTab === p
          const accent = platformColors[p] ?? 'var(--accent)'
          return (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className="text-xs font-bold px-4 py-2 rounded-full transition-all"
              style={{
                background: active ? `${accent}22` : 'var(--panel-2)',
                color: active ? accent : 'var(--muted)',
                border: `1px solid ${active ? accent : 'var(--border)'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>{PLATFORM_ICONS[p]}</span>
              <span>{PLATFORM_LABELS[p]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-center">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <PreviewCard
            platform={effectiveTab}
            variant={variant}
            assetUrl={assetUrl}
            assetKind={assetKind}
            onRetune={onRetune ? () => onRetune(effectiveTab) : undefined}
          />
        </div>
      </div>
    </div>
  )
}

interface PreviewCardProps {
  platform: TunerPlatform
  variant?: PlatformVariant
  assetUrl?: string
  assetKind?: 'image' | 'video'
  onRetune?: () => void
}

function PreviewCard({ platform, variant, assetUrl, assetKind, onRetune }: PreviewCardProps) {
  const accent = platformColors[platform] ?? 'var(--accent)'

  if (!variant) {
    return (
      <div
        className="glass-panel p-6 text-center text-sm"
        style={{ color: 'var(--muted)' }}
      >
        No {PLATFORM_LABELS[platform]} variant yet — click Generate.
      </div>
    )
  }

  return (
    <div className="glass-panel p-5" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: accent }}>
          <span style={{ fontSize: 16 }}>{PLATFORM_ICONS[platform]}</span>
          <span>{PLATFORM_LABELS[platform]}</span>
        </div>
        <CharCounter used={variant.caption.length} limit={variant.charLimit} />
      </div>

      {assetUrl && assetKind === 'image' && (
        <img
          src={assetUrl}
          alt=""
          className="w-full rounded-lg mb-3"
          style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
        />
      )}
      {assetUrl && assetKind === 'video' && (
        <video
          src={assetUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full rounded-lg mb-3"
          style={{ aspectRatio: '9 / 16', objectFit: 'cover', background: 'var(--panel-2)' }}
        />
      )}

      {platform === 'Email' ? (
        <EmailFields variant={variant} />
      ) : platform === 'YouTube Shorts' ? (
        <YouTubeFields variant={variant} />
      ) : (
        <DefaultFields variant={variant} />
      )}

      <div className="flex gap-2 mt-4">
        <CopyButton variant={variant} />
        {onRetune && (
          <button
            onClick={onRetune}
            className="text-xs font-semibold px-3 py-2 rounded-lg"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            🎲 Re-tune
          </button>
        )}
      </div>
    </div>
  )
}

function CharCounter({ used, limit }: { used: number; limit: number }) {
  const pct = used / limit
  const color = pct > 1 ? '#ef4444' : pct > 0.9 ? '#f59e0b' : 'var(--muted)'
  return (
    <span className="text-[11px] font-mono" style={{ color }}>
      {used}/{limit}
    </span>
  )
}

function DefaultFields({ variant }: { variant: PlatformVariant }) {
  return (
    <>
      <div
        className="text-sm whitespace-pre-wrap mb-2"
        style={{ color: 'var(--text)', lineHeight: 1.5 }}
      >
        {variant.caption}
      </div>
      {variant.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {variant.hashtags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--panel-2)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

function EmailFields({ variant }: { variant: PlatformVariant }) {
  return (
    <div className="space-y-3">
      <Field label="Subject" value={variant.subject ?? variant.caption} />
      {variant.preheader && <Field label="Preheader" value={variant.preheader} />}
      {variant.bodyHtml && (
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--muted)' }}
          >
            Body
          </div>
          <div
            className="text-sm rounded-lg p-3"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              lineHeight: 1.5,
              border: '1px solid var(--border)',
            }}
            dangerouslySetInnerHTML={{ __html: variant.bodyHtml }}
          />
        </div>
      )}
      {variant.ctaLabel && (
        <div className="flex items-center gap-2 text-xs">
          <span
            className="px-3 py-1.5 rounded-md font-bold"
            style={{ background: '#8b5cf6', color: 'white' }}
          >
            {variant.ctaLabel}
          </span>
          <span style={{ color: 'var(--muted)' }}>→</span>
          <code className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {variant.ctaUrl}
          </code>
        </div>
      )}
    </div>
  )
}

function YouTubeFields({ variant }: { variant: PlatformVariant }) {
  return (
    <div className="space-y-3">
      <Field label="Title (100 char max)" value={variant.title ?? variant.caption} />
      {variant.description && (
        <div>
          <div
            className="text-[10px] font-bold uppercase tracking-wider mb-1"
            style={{ color: 'var(--muted)' }}
          >
            Description
          </div>
          <div
            className="text-sm whitespace-pre-wrap rounded-lg p-3"
            style={{
              background: 'var(--panel-2)',
              color: 'var(--text)',
              lineHeight: 1.5,
              border: '1px solid var(--border)',
            }}
          >
            {variant.description}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-1"
        style={{ color: 'var(--muted)' }}
      >
        {label}
      </div>
      <div className="text-sm" style={{ color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

function CopyButton({ variant }: { variant: PlatformVariant }) {
  const [copied, setCopied] = useState(false)

  const buildPayload = (): string => {
    if (variant.platform === 'Email') {
      return [
        `Subject: ${variant.subject ?? ''}`,
        variant.preheader ? `Preheader: ${variant.preheader}` : '',
        '',
        // Strip HTML tags for plain-text copy.
        (variant.bodyHtml ?? '').replace(/<[^>]+>/g, '').trim(),
        '',
        variant.ctaLabel ? `CTA: ${variant.ctaLabel} → ${variant.ctaUrl ?? ''}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    }
    if (variant.platform === 'YouTube Shorts') {
      return [
        `Title: ${variant.title ?? variant.caption}`,
        '',
        variant.description ?? '',
      ]
        .filter(Boolean)
        .join('\n')
    }
    return [variant.caption, variant.hashtags.join(' ')].filter(Boolean).join('\n\n')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildPayload())
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — silent fail; user can re-select manually
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-1 text-xs font-bold px-3 py-2 rounded-lg transition-all"
      style={{
        background: copied ? '#10b98122' : 'var(--accent)',
        color: copied ? '#10b981' : 'white',
        border: copied ? '1px solid #10b981' : '1px solid transparent',
      }}
    >
      {copied ? '✓ Copied' : '📋 Copy for ' + (variant.platform === 'YouTube Shorts' ? 'Shorts' : variant.platform)}
    </button>
  )
}
