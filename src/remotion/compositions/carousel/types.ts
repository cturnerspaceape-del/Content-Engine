import type { FlavorTheme } from '../../types'

export const FRAMES_PER_SLIDE = 45

export type SlideRole = 'hook' | 'content' | 'flavor' | 'cta'

export interface SlideContent {
  role: SlideRole
  text: string
  secondary?: string
}

export interface TemplateProps {
  theme: FlavorTheme
  flavor: string
  hook: string
  caption: string
  images: string[]
  slideIndex: number
  slideProgress: number
  totalSlides: number
  frame: number
  subcategory: string
  arc: SlideContent[]
  slideContent: SlideContent
}
