export type SpaceApeFlavor =
  // 2G Live Resin
  | 'Amped Apple'
  | 'Blue Frenzy'
  | 'Dragon Drip'
  | 'Lemon Cherry Slam'
  | 'Lime Zest'
  | 'Midnight Cherry Pop'
  | 'Nebula Grape Groove'
  | 'Raspberry Rebel'
  | 'Oryon Lemonade'
  | 'Razzle Dazzle'
  // 4G Live Resin
  | 'Blue Zlushie'
  | 'Electric Apple'
  | 'Tang Exotic'
  | 'Black Cherry Candy'
  | 'Dragon Fruit Lychee'
  | 'Grape Galaxy'
  | 'Raspberry Zaza'
  | 'Razzmatazz'
  | 'Key Lime Melon'
  | 'Orange Crush'

export interface FlavorTheme {
  primaryColor: string
  backgroundColor: string
  accentColor: string
  textColor: string
  strainType: 'Sativa' | 'Hybrid' | 'Indica' | ''
  productImages: string[] // filenames in public/products/
}

export interface SingleImageProps {
  flavor: SpaceApeFlavor
  hook: string
  caption: string
  hashtags: string[]
  pillar: string
  subcategory: string
  shotTemplateId?: string // from src/data/shotTemplates.ts — server picks one if omitted
  variationSeed?: number  // when set, bypasses cache and forces a new Gemini call
}

export interface CarouselProps {
  flavor: SpaceApeFlavor
  hook: string
  caption: string
  hashtags: string[]
  pillar: string
  subcategory: string
  layoutTemplate: number // 1-8
  slideCount: number     // 5-10
}

export interface ReelProps {
  flavor: SpaceApeFlavor
  hook: string
  caption: string
  hashtags: string[]
  pillar: string
  subcategory: string
  layoutTemplate: number // 1-6
}
