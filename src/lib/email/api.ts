import type { GeneratedEmail, EmailType, AudienceType } from './types'
import { getEmailTypeConfig } from './emailTypes'
import { getAudienceProfile } from './audienceProfiles'

export interface GenerateEmailResponse {
  cached: boolean
  hash: string
  email: GeneratedEmail
}

export async function generateEmail(args: {
  emailType: EmailType
  audience: AudienceType
  flavorHint?: string
  campaignNote?: string
  variationSeed?: number
}): Promise<GenerateEmailResponse> {
  const cfg = getEmailTypeConfig(args.emailType)
  const audience = getAudienceProfile(args.audience)
  const res = await fetch('/api/generate-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emailType: cfg.id,
      emailTypeLabel: cfg.label,
      emailTypeIntent: cfg.intent,
      audience: audience.id,
      audienceLabel: audience.label,
      audienceTone: audience.toneGuidance,
      audienceCtaStyle: audience.ctaStyle,
      defaultSections: cfg.defaultSections,
      flavorHint: args.flavorHint,
      campaignNote: args.campaignNote,
      variationSeed: args.variationSeed,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return (await res.json()) as GenerateEmailResponse
}

export interface GenerateEmailImageResponse {
  url: string
  cached: boolean
  hash: string
  flavor: string
}

export async function generateEmailImage(args: {
  slot: 'hero' | 'product'
  prompt: string
  flavor?: string
  variationSeed?: number
}): Promise<GenerateEmailImageResponse> {
  const res = await fetch('/api/generate-email-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return (await res.json()) as GenerateEmailImageResponse
}
