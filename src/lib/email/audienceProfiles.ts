import type { AudienceType } from './types'

export interface AudienceProfile {
  id: AudienceType
  label: string
  shortDesc: string
  toneGuidance: string
  ctaStyle: string
}

export const AUDIENCE_PROFILES: Record<AudienceType, AudienceProfile> = {
  existing: {
    id: 'existing',
    label: 'Existing Client',
    shortDesc: 'Active relationship',
    toneGuidance:
      'Confident, appreciative, professional. Assume an active relationship. Skip introductions. Lead with value or news. Premium voice — never apologetic.',
    ctaStyle:
      'Direct and action-led. Examples: "Add to your next order", "Restock before you run low", "See what is new".',
  },
  inactive: {
    id: 'inactive',
    label: 'Inactive Client',
    shortDesc: '30–90 days quiet',
    toneGuidance:
      'Warm, empathetic, low-pressure. Assume they have been quiet 30–90 days. Acknowledge time has passed. Re-introduce value without grovelling. No guilt, no urgency-pressure tactics.',
    ctaStyle:
      'Soft and inviting. Examples: "Take a look", "See what has changed", "Still interested?". Optional incentive language ok if the email type calls for it.',
  },
}

export function getAudienceProfile(id: AudienceType): AudienceProfile {
  return AUDIENCE_PROFILES[id]
}
