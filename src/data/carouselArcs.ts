import type { ContentPillar } from '../types'

export interface SlideSpec {
  role: string
  brief: string
  shotTemplateId?: string
}

export interface CarouselArc {
  id: string
  name: string
  pillarAffinity: ContentPillar[]
  slides: SlideSpec[]
}

export const CAROUSEL_ARCS: CarouselArc[] = [
  {
    id: 'drop-story',
    name: 'Drop Story',
    pillarAffinity: ['Product Centric', 'Brand Building'],
    slides: [
      { role: 'hero', brief: 'clean product hero on a seamless backdrop; confident pop-editorial energy, the announcement shot.' },
      { role: 'lifestyle-pickup', brief: 'product being picked up by a hand in a lived-in setting; candid, warm, tactile.' },
      { role: 'macro-detail', brief: 'extreme close-up on a printed label detail or highlight; moody rim lighting, editorial stillness.' },
      { role: 'cta-scene', brief: 'product placed in an aspirational "out in the world" moment; wide, atmospheric, implies a night out.' },
    ],
  },
  {
    id: 'flavor-breakdown',
    name: 'Flavor Breakdown',
    pillarAffinity: ['Education', 'Product Centric'],
    slides: [
      { role: 'hero', brief: 'product hero with a splash of flavor palette spilling out of frame; bold, vibrant, editorial still-life.' },
      { role: 'ingredient-1', brief: 'hero shot of the primary fruit or botanical ingredient in its raw form; glossy macro photography.' },
      { role: 'ingredient-2', brief: 'secondary terpene note — an herb, spice, or flower — captured like a food magazine cover.' },
      { role: 'ingredient-3', brief: 'tertiary note or finish — a sweet, earthy, or citrus touch — bathed in warm key light.' },
      { role: 'final-reveal', brief: 'product returns to center; ingredients arranged around it like a contact sheet.' },
    ],
  },
  {
    id: 'day-in-the-life',
    name: 'Day in the Life',
    pillarAffinity: ['Lifestyle'],
    slides: [
      { role: 'morning', brief: 'morning scene: product on a kitchen counter with coffee, soft window light, slow start to the day.' },
      { role: 'afternoon', brief: 'afternoon scene: product tucked in a jacket pocket or on a studio desk, golden ambient tone.' },
      { role: 'evening', brief: 'evening scene: product on a bar top or balcony railing at magic hour, warm amber light.' },
      { role: 'after-hours', brief: 'late-night scene: product glowing against neon or candlelight, cinematic, intimate.' },
    ],
  },
  {
    id: 'before-after',
    name: 'Before & After',
    pillarAffinity: ['Entertainment', 'Social Proof'],
    slides: [
      { role: 'before', brief: 'product placed quietly on a neutral, slightly desaturated table or surface — energy dialed-down, palette muted; reads as the "before" state but the product is the visible anchor in the frame.' },
      { role: 'transforming', brief: 'scene mid-transformation — product introduced into the frame, light and color shifting toward saturated.' },
      { role: 'after', brief: 'scene fully "on" — product centered, palette fully alive, environment feels elevated and intentional.' },
    ],
  },
  {
    id: 'product-features',
    name: 'Product Features',
    pillarAffinity: ['Product Centric', 'Education'],
    slides: [
      { role: 'hero', brief: 'catalog-grade product hero, seamless backdrop, pristine lighting.' },
      { role: 'feature-1', brief: 'macro on the mouthpiece or top of the device; clean geometry, specular highlights.' },
      { role: 'feature-2', brief: 'macro on the body / label / colorway; confident crop, editorial still-life.' },
      { role: 'feature-3', brief: 'macro on the bottom or charging surface; studio-grade photoreal product rendering.' },
      { role: 'lifestyle-wide', brief: 'wide lifestyle beauty shot; product in a curated scene without losing focus.' },
    ],
  },
  {
    id: 'strain-mood-board',
    name: 'Strain Mood Board',
    pillarAffinity: ['Brand Building', 'Lifestyle'],
    slides: [
      { role: 'palette', brief: 'an abstract color-field shot that sets the palette for the post; fabric folds or painted paper in the flavor hues.' },
      { role: 'texture', brief: 'a textural close-up — smoke curl, liquid ripple, petal, fiber — evoking the strain\'s mouthfeel.' },
      { role: 'environment', brief: 'an empty environment that fits the strain\'s vibe — studio, garden, bedroom — lit with intent.' },
      { role: 'product-hero', brief: 'the product arrives, sitting cleanly at the center of the mood board universe.' },
    ],
  },
  {
    id: 'campaign-teaser',
    name: 'Campaign Teaser',
    pillarAffinity: ['Product Centric', 'Brand Building'],
    slides: [
      { role: 'teaser-shadow', brief: 'product as silhouette or in heavy shadow — teasing the shape without giving it away; negative space, moody key light.' },
      { role: 'hero-reveal', brief: 'product steps into full light — clean hero on a seamless backdrop, confident pop-editorial energy.' },
      { role: 'macro-surface', brief: 'extreme close-up on the wrap material or printed label texture; specular highlights, editorial stillness.' },
      { role: 'lifestyle-scene', brief: 'product in a tactile human moment — held, placed on a surface, beside a drink; candid, warm, lived-in.' },
      { role: 'color-study', brief: 'an abstract palette shot that rhymes with the wrap — painted paper, fabric folds, or liquid in the flavor hues.' },
      { role: 'final-anchor', brief: 'a final wide hero with the product dead-center, palette fully alive, designed to feel like the campaign\'s lock-up frame.' },
    ],
  },
  {
    id: 'day-to-night',
    name: 'Day to Night',
    pillarAffinity: ['Lifestyle', 'Brand Building'],
    slides: [
      { role: 'dawn', brief: 'product on a quiet counter at dawn — curtains, a bed edge, blue-hour cool light, desaturated; the day hasn\'t started but the product is already there as the focal point.' },
      { role: 'morning-ritual', brief: 'product enters the morning — beside coffee, a notebook, morning light cutting across a table.' },
      { role: 'midday', brief: 'bright commercial moment — product in direct noon light on a clean surface; crisp shadows, high saturation.' },
      { role: 'golden-hour', brief: 'product bathed in warm late-afternoon light — amber tones, cinematic, lived-in room or rooftop.' },
      { role: 'neon-moment', brief: 'product against neon or city-window reflection at early night — electric accent color, editorial mood.' },
      { role: 'intimate-close', brief: 'tight tabletop close-up — candlelight, glassware, product nestled in; intimate, tactile.' },
      { role: 'signoff', brief: 'wide aspirational final scene — product in the palm of the night, palette fully alive, feels like the closing frame of a short film.' },
    ],
  },
  {
    id: 'full-story-arc',
    name: 'Full Story Arc',
    pillarAffinity: ['Brand Building', 'Product Centric'],
    slides: [
      { role: 'opener-environment', brief: 'wide establishing shot of a room, window, or surface with the product placed in-frame as the anchor — clean composition, atmospheric, sets up the rest of the arc.' },
      { role: 'hero-entry', brief: 'product introduced into the scene — clean hero crop, the first moment the viewer sees it clearly.' },
      { role: 'feature-spotlight-1', brief: 'macro on the mouthpiece or top detail of the device; clean geometry and specular highlights.' },
      { role: 'feature-spotlight-2', brief: 'macro on the body / label / colorway; confident editorial crop.' },
      { role: 'material-detail', brief: 'extreme close-up on wrap texture, printed ink, or finish; tactile and premium.' },
      { role: 'in-context', brief: 'product placed in a real-world lifestyle context — hand, pocket, countertop, bar top; candid energy.' },
      { role: 'transformation-scene', brief: 'a wider scene that implies the moment the product unlocks — a party, a quiet room going warm, a friend laughing; atmospheric, suggestive.' },
      { role: 'signoff-hero', brief: 'closing hero — product centered, palette fully resolved, feels like the final frame and the brand lock-up in one.' },
    ],
  },
]

const BY_ID = new Map(CAROUSEL_ARCS.map((arc) => [arc.id, arc]))

export function getCarouselArc(id: string): CarouselArc | undefined {
  return BY_ID.get(id)
}

export function pickCarouselArc(pillar: string, _subcategory: string): CarouselArc {
  const preferred = CAROUSEL_ARCS.filter((arc) =>
    arc.pillarAffinity.includes(pillar as ContentPillar),
  )
  const pool = preferred.length > 0 ? preferred : CAROUSEL_ARCS
  return pool[Math.floor(Math.random() * pool.length)]
}
