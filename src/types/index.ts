export type Platform = 'TikTok' | 'Blog Post' | 'Facebook' | 'Instagram' | 'X' | 'YouTube Shorts'

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export type PostDestination = 'feed' | 'story'

export interface PostedToInstagram {
  mediaId: string
  permalink?: string
  destination: PostDestination
  postedAt: string
}

export interface PostedToFacebook {
  postId: string
  permalink?: string
  postedAt: string
}

export interface ContentItem {
  platform: Platform
  emoji: string
  title: string
  description: string
  contentType: string
  generated?: boolean
  logged?: boolean
  postedToInstagram?: PostedToInstagram
  postedToFacebook?: PostedToFacebook
  // IG is primary; if the optional cross-post to FB fails we surface it here
  // without blocking IG success. Cleared on retry.
  facebookError?: string
  postError?: string
  generatedVisual?: {
    hook: string
    caption: string
    hashtags: string[]
    pillar: string
    subcategory: string
    format: InstagramFormat
    flavor?: string
    layoutTemplate?: number // Carousel 1-8, Reel 1-6. Unused for Single Image.
    shotTemplateId?: string // Single Image only — see src/data/shotTemplates.ts
    slideCount?: number
    arcId?: string // Carousel Lounge only — presence switches Carousel rendering to AI-image slides
    carouselSeed?: number // shared anchor across all slides of one Lounge carousel
    reelArcId?: string // Reel Lounge only — presence switches Reel rendering to AI-video
    reelSeed?: number // Veo seed for reel determinism + Reroll diversity
    durationSeconds?: number // Reel Lounge only — per-arc clip length
    // Persisted generation results. Presence of a URL or error is terminal —
    // the visual component will not re-fetch on mount once either is set.
    // A Reroll click clears the URL + error (and bumps the *VariationSeed) so
    // exactly one fresh fetch fires.
    imageUrl?: string
    imageError?: string
    imageVariationSeed?: number
    slideUrls?: (string | null)[]
    slideErrors?: (string | null)[]
    slideVariationSeeds?: (number | undefined)[]
    reelUrl?: string
    reelError?: string
    reelVariationSeed?: number
  }
}

export interface LoggedPost extends ContentItem {
  day: string
  loggedAt: string
  performance?: { likes?: number; comments?: number }
}

export interface DayContent {
  day: DayOfWeek
  theme: string
  items: ContentItem[]
}

export type ViewState =
  | 'home'
  | 'calendar'
  | 'strategy'
  | 'postlog'
  | 'sil-lab'
  | 'carousel-lounge'
  | 'reel-lounge'

export type InstagramFormat = 'Carousel' | 'Reel' | 'Single Image'

export type ContentPillar =
  | 'Lifestyle'
  | 'Product Centric'
  | 'Entertainment'
  | 'Social Proof'
  | 'Brand Building'
  | 'Education'

export interface InstagramPost {
  account: string
  postNumber: number
  postDate: string
  format: InstagramFormat
  contentPillar: ContentPillar
  subcategory: string
  productVisibility: number
  likes: number
  comments: number
  notes: string
}
