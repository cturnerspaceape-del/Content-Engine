export type Platform =
  | 'TikTok'
  | 'Blog Post'
  | 'Facebook'
  | 'Instagram'
  | 'X'
  | 'Threads'
  | 'YouTube Shorts'
  | 'Email'
  | 'Print'

export type PrintFormat = 'Poster' | 'Trifold' | 'Sticker'

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

export interface PostedToThreads {
  mediaId: string
  permalink?: string
  postedAt: string
}

export interface PostedToYouTube {
  videoId: string
  permalink: string
  postedAt: string
}

export interface PostedToX {
  tweetId: string
  permalink: string
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
  postedToThreads?: PostedToThreads
  postedToYouTube?: PostedToYouTube
  postedToX?: PostedToX
  // IG is primary; if the optional cross-post to FB fails we surface it here
  // without blocking IG success. Cleared on retry.
  facebookError?: string
  threadsError?: string
  youtubeError?: string
  xError?: string
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
    // Trend signal that produced this content. Threaded down to the image
    // model so visuals anchor to the picked research angle instead of the
    // generic Space Ape mood pool.
    researchAngle?: string
    researchNotes?: string
    // Executable photo brief from the picked seed — replaces the generic
    // shot template body in the Gemini prompt's SHOT BRIEF section.
    researchShotBrief?: string
    // URLs from the picked research seed. The server resolves these to
    // actual trend imagery and feeds it to Gemini as inspo refs in place
    // of the static manifest pool.
    researchSourceUrls?: string[]
    researchSourceImageUrls?: string[]
    // Carousel Lounge only — research-driven per-slide briefs. When present,
    // CarouselLoungeVisual uses `researchSlides.length` as the slide count
    // and `researchSlides[i].brief` as that slide's image prompt, replacing
    // the static carouselArcs.ts template.
    researchSlides?: { brief: string }[]
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
  | 'scheduler'
  | 'day-detail'
  | 'postlog'
  | 'image-lab'
  | 'reel-lab'
  | 'text-post-lab'
  | 'carousel-lab'
  | 'email-lab'
  | 'print-lab'

export type ScheduleStatus = 'pending' | 'posted' | 'failed'

export interface ScheduledPost {
  id: string
  date: string // YYYY-MM-DD (local)
  time: string // HH:mm 24h
  platform: Platform
  format?: string
  idea?: string
  // Generated content snapshot. Format determines which payload is populated.
  // IG (Image/Reel/Carousel) and similar visual posts use `item` (ContentItem).
  // Email posts use `email` (GeneratedEmail). Text-only posts use `textVariants`.
  item?: ContentItem
  email?: import('../lib/email/types').GeneratedEmail
  textVariants?: Record<string, { caption: string; hashtags?: string[] }>
  // Print pieces — `format` field on ScheduledPost determines the shape.
  // Poster/Sticker = single-image PrintPiece; Trifold = TrifoldPiece (2 panels).
  print?: import('../lib/print/types').PrintPiece | import('../lib/print/types').TrifoldPiece
  status?: ScheduleStatus
  postedAt?: string
  postError?: string
  createdAt: string
}

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
