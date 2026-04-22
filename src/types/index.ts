export type Platform = 'TikTok' | 'Blog Post' | 'Facebook' | 'Instagram' | 'X' | 'YouTube Shorts'

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

export interface ContentItem {
  platform: Platform
  emoji: string
  title: string
  description: string
  contentType: string
  generated?: boolean
  logged?: boolean
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

export type ViewState = 'home' | 'calendar' | 'strategy' | 'postlog' | 'sil-lab' | 'carousel-lounge'

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
