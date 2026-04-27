import { useState } from 'react'
import type { PlatformVariant, TunerPlatform } from '../lib/platformTuners'
import { platformColors } from './PlatformContentItem'

interface MultiPlatformPreviewProps {
  selected: ReadonlyArray<TunerPlatform>
  variants: Partial<Record<TunerPlatform, PlatformVariant>>
  assetUrl?: string
  assetKind?: 'image' | 'video'
  // Per-platform render override. When provided for the first selected
  // platform, the custom node renders instead of the built-in PreviewCard.
  // Used by ImageLab/ReelLab/CarouselLab to keep the existing IG ContentCard
  // (with its publish flow) inside the IG/FB tab.
  customRender?: Partial<Record<TunerPlatform, () => React.ReactNode>>
}

const PLATFORM_LABELS: Record<TunerPlatform, string> = {
  'IG/FB': 'IG/FB',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'Shorts',
}

const PLATFORM_ICONS: Record<TunerPlatform, string> = {
  'IG/FB': '📷',
  X: '𝕏',
  Threads: '@',
  TikTok: '🎵',
  'YouTube Shorts': '▶',
}

const PLATFORM_COLOR_KEY: Record<TunerPlatform, string> = {
  'IG/FB': 'Instagram',
  X: 'X',
  Threads: 'Threads',
  TikTok: 'TikTok',
  'YouTube Shorts': 'YouTube Shorts',
}

export default function MultiPlatformPreview({
  selected,
  variants,
  assetUrl,
  assetKind,
  customRender,
}: MultiPlatformPreviewProps) {
  // Single-slot preview: render only the first selected platform. The
  // remaining selected platforms still get tuned in the background by the
  // parent lab (so the unified Post button can copy their captions to
  // clipboard) — they just don't get a separate stacked card here.
  const primary = selected[0]

  if (!primary) {
    return (
      <div className="text-center text-sm py-12" style={{ color: 'var(--muted)' }}>
        Pick at least one platform to preview a variant.
      </div>
    )
  }

  const custom = customRender?.[primary]
  const variant = variants[primary]

  return (
    <div className="flex justify-center">
      <div style={{ width: '100%', maxWidth: 480 }}>
        {custom ? (
          custom()
        ) : (
          <PreviewCard
            platform={primary}
            variant={variant}
            assetUrl={assetUrl}
            assetKind={assetKind}
          />
        )}
      </div>
    </div>
  )
}

interface PreviewCardProps {
  platform: TunerPlatform
  variant?: PlatformVariant
  assetUrl?: string
  assetKind?: 'image' | 'video'
}

function PreviewCard({ platform, variant, assetUrl, assetKind }: PreviewCardProps) {
  const accent = platformColors[PLATFORM_COLOR_KEY[platform]] ?? 'var(--accent)'

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

      {platform === 'YouTube Shorts' ? (
        <YouTubeFields variant={variant} />
      ) : (
        <DefaultFields variant={variant} />
      )}

      <div className="flex gap-2 mt-4">
        <CopyButton variant={variant} />
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
      {copied
        ? '✓ Copied'
        : '📋 Copy for ' +
          (variant.platform === 'YouTube Shorts' ? 'Shorts' : variant.platform)}
    </button>
  )
}
