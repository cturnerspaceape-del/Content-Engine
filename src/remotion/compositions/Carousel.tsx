import { useCurrentFrame } from 'remotion'
import { getFlavorTheme } from '../flavorThemes'
import type { CarouselProps } from '../types'
import { seedFromText } from '../components/shared'
import { FRAMES_PER_SLIDE, type SlideContent } from './carousel/types'
import { SlideStack } from './carousel/SlideStack'
import { MagazineSpread } from './carousel/MagazineSpread'
import { BoldTypography } from './carousel/BoldTypography'
import { NeonGlow } from './carousel/NeonGlow'
import { PhotoSet } from './carousel/PhotoSet'
import { StudioSlides } from './carousel/StudioSlides'
import { GlassJournal } from './carousel/GlassJournal'
import { RetroVision } from './carousel/RetroVision'

export type { SlideContent } from './carousel/types'

const CTA_POOL = [
  'Follow @SpaceApe for the weird stuff',
  'You scrolled this far. Might as well follow.',
  '@SpaceApe — you know what to do',
  'Follow us before we get famous',
  "That's all. Go hit follow.",
  'Follow @SpaceApe. We post bangers only.',
  'Tap follow. We\'ll wait.',
  'End of carousel. Start of obsession.',
]

export function buildSlideArc(hook: string, caption: string, flavor: string, strainType: string): SlideContent[] {
  // Defensive: callers may pass undefined for caption/hook when reading
  // partially-saved persisted state. Coerce to '' so .split / seedFromText
  // don't throw and the arc just renders without those slides.
  const safeHook = hook ?? ''
  const safeCaption = caption ?? ''
  const seed = seedFromText(safeHook)
  const sentences = safeCaption.split(/[.!?]+/).filter(s => s.trim().length > 15)
  const usable = sentences.slice(0, 4)
  const arc: SlideContent[] = []

  arc.push({ role: 'hook', text: safeHook })

  if (usable.length <= 2) {
    usable.forEach(s => arc.push({ role: 'content', text: s.trim() }))
    arc.push({ role: 'flavor', text: flavor, secondary: strainType || 'Live Resin' })
  } else {
    arc.push({ role: 'content', text: usable[0].trim() })
    arc.push({ role: 'content', text: usable[1].trim() })
    arc.push({ role: 'flavor', text: flavor, secondary: strainType || 'Live Resin' })
    for (let i = 2; i < usable.length; i++) {
      arc.push({ role: 'content', text: usable[i].trim() })
    }
  }

  if (seed % 5 === 0) {
    arc.push({ role: 'cta', text: CTA_POOL[seed % CTA_POOL.length] })
  }

  return arc
}

export default function Carousel({ flavor, hook, caption, hashtags, pillar, subcategory, layoutTemplate, slideCount }: CarouselProps) {
  const frame = useCurrentFrame()
  const theme = getFlavorTheme(flavor)
  const images = theme.productImages
  const arc = buildSlideArc(hook, caption, flavor, theme.strainType || '')

  const slideIndex = Math.min(Math.floor(frame / FRAMES_PER_SLIDE), arc.length - 1)
  const slideProgress = (frame - slideIndex * FRAMES_PER_SLIDE) / FRAMES_PER_SLIDE

  const props = { theme, flavor, hook, caption, images, slideIndex, slideProgress, totalSlides: arc.length, frame, subcategory, arc, slideContent: arc[slideIndex] }

  switch (layoutTemplate) {
    case 1: return <SlideStack {...props} />
    case 2: return <MagazineSpread {...props} />
    case 3: return <BoldTypography {...props} />
    case 4: return <NeonGlow {...props} />
    case 5: return <PhotoSet {...props} />
    case 6: return <StudioSlides {...props} />
    case 7: return <GlassJournal {...props} />
    case 8: return <RetroVision {...props} />
    default: return <SlideStack {...props} />
  }
}
