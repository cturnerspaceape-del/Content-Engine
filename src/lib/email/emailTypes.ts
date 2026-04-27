import type { EmailType, SectionKind } from './types'

export interface EmailTypeConfig {
  id: EmailType
  label: string
  emoji: string
  shortDesc: string
  defaultSections: SectionKind[]
  // Steers the prompt — what is this email *for*?
  intent: string
}

export const EMAIL_TYPES: EmailTypeConfig[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    emoji: '👋',
    shortDesc: 'Onboarding new retailer/customer',
    defaultSections: ['header', 'hero', 'benefits', 'cta', 'footer'],
    intent:
      'Warmly introduce Space Ape to a new contact. Set expectations. Surface 3 benefits of working with the brand. Drive a low-commitment first action.',
  },
  {
    id: 'education',
    label: 'Education',
    emoji: '📚',
    shortDesc: 'Brand/product knowledge drop',
    defaultSections: ['header', 'hero', 'benefits', 'social_proof', 'cta', 'footer'],
    intent:
      'Teach something useful about live-resin vapes, terpenes, or merchandising. Position Space Ape as the knowledgeable category leader. CTA points to a learn/blog destination.',
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    emoji: '📰',
    shortDesc: 'Monthly roundup',
    defaultSections: ['header', 'hero', 'product', 'social_proof', 'cta', 'footer'],
    intent:
      'Monthly roundup: what dropped, what is performing, what is coming. Mix of product highlights and brand pulse. Multiple soft CTAs is fine.',
  },
  {
    id: 'replenishment',
    label: 'Replenishment',
    emoji: '🔁',
    shortDesc: 'Reorder reminder',
    defaultSections: ['header', 'hero', 'product', 'cta', 'footer'],
    intent:
      'Nudge a reorder. Assume the buyer is moving units and could be running low. Direct, retail-aware language. Strong CTA: place next order.',
  },
  {
    id: 'promo',
    label: 'Promo / Drop',
    emoji: '🎯',
    shortDesc: 'New flavor or limited drop',
    defaultSections: ['header', 'hero', 'offer', 'product', 'cta', 'footer'],
    intent:
      'Announce a drop, restock, or limited offer. Bold poster-style header. Clear deadline or scarcity. One unmistakable CTA.',
  },
  {
    id: 'transactional',
    label: 'Transactional',
    emoji: '🧾',
    shortDesc: 'Order confirmation / system',
    defaultSections: ['header', 'hero', 'product', 'cta', 'footer'],
    intent:
      'Confirm an action (order placed, shipped, received). Calm, factual, helpful. Cross-sell is light or absent.',
  },
  {
    id: 'reengagement',
    label: 'Re-engagement',
    emoji: '🪫',
    shortDesc: 'Pull a quiet contact back',
    defaultSections: ['header', 'hero', 'offer', 'cta', 'footer'],
    intent:
      'Reach a contact who has gone quiet (early stage, not full win-back). Gentle, value-led, no guilt. Make it easy to come back.',
  },
]

export function getEmailTypeConfig(id: EmailType): EmailTypeConfig {
  const cfg = EMAIL_TYPES.find((t) => t.id === id)
  if (!cfg) throw new Error(`Unknown email type: ${id}`)
  return cfg
}
