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
      { role: 'before', brief: 'scene without the product — neutral, slightly desaturated, a room or table that feels incomplete.' },
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
