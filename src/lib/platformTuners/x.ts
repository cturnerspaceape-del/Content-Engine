import type { PlatformVariant, TunerSource } from './types'
import { truncateTo, stripHashtags } from './types'
import type { TextArchetype } from '../seeds/textArchetype'

const X_CHAR_LIMIT = 280
// When we attach an image, X reserves ~25 chars for the URL; cap accordingly.
const X_IMAGE_CAPTION_LIMIT = 255

// Archetype-keyed text pool — moved here from src/data/xPostTemplates.ts so
// the tuner owns its own voice. Used when the upstream source is purely
// text (no IG-style caption to truncate).
const X_TEXT_POOL: Record<TextArchetype, string[]> = {
  'Hot Take': [
    "Fruity flavors are the future, and I'm done being polite about it.",
    "The hardware is the product. Everyone else is selling juice in a lighter.",
    "If your vape can't survive a beach day, it's not really premium.",
    "Cheap vapes cost you twice. Once at checkout, once when it breaks.",
    "Nobody made premium cannabis vapes cool. That gap is why we exist.",
    "Water-resistant isn't a feature — it's a baseline. Most brands haven't caught up.",
    "Live resin is a promise. Half the brands on the shelf are breaking it.",
    "The 2G form factor isn't a trend. It's the new standard.",
  ],
  'Drop Announce': [
    "Razzle Dazzle drops Friday. If you know, you know.",
    "New state, new shelves. We're live. Go find us.",
    "Amped Apple — back in stock. Restock didn't last last time. Move fast.",
    "4G Orange Crush just hit. Ten states. Hardware you'll actually want to carry.",
    "Midnight Cherry Pop is live. Don't sleep on this one.",
    "Nebula Grape Groove is back. Limited run. You've been warned.",
  ],
  Hook: [
    "What if vapes were actually… cute?",
    "Not every high needs to make a statement. But your hardware should.",
    "Premium isn't a price point. It's how it feels in your hand.",
    "10 flavors. 1 dress code: looks clean, hits clean.",
    "Some things are worth the upgrade. This is one of them.",
    "If a vape can't stay alive on a pool day, the bar is on the floor.",
  ],
  Question: [
    "What's the most underrated flavor we carry? Reply with your pick.",
    "Hybrid, sativa, indica — what's in your rotation this week?",
    "Fruity or gas — pick a side. We already know which one wins.",
    "What's the first thing you look at on a new vape: flavor, hardware, or packaging?",
    "If we dropped a new flavor next month — what profile would you actually buy?",
    "Which flavor name needs a sequel?",
  ],
  Shoutout: [
    "Shouting out every dispensary that stocked us in Q1. You know who you are.",
    "Budtenders are the real MVPs. Quiet recommendations move more product than any ad.",
    "To the folks who posted us on their story without us asking — that's the stuff that builds a brand.",
    "Homie discount energy goes a long way. Keep eating.",
    "The small-batch dispensaries carrying us before it was easy — we remember.",
  ],
  'Meme Line': [
    "Me looking at my Amped Apple at 4:19:59 →",
    "POV: you just realized the vape actually charges fast.",
    "Nobody: / Me explaining why fruity flavors are the best: *21 minute TED talk*",
    "My 2G when I said I'd 'just take a small hit': 🏃‍♂️💨",
    "Tell me it's Friday without telling me it's Friday. I'll start:",
    "That moment the cap clicks into place and it just feels right.",
  ],
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function tuneForX(source: TunerSource): PlatformVariant {
  const limit = source.format === 'image' ? X_IMAGE_CAPTION_LIMIT : X_CHAR_LIMIT

  let caption: string
  if (source.format === 'text') {
    const archetype = source.archetype ?? 'Hot Take'
    const pool = X_TEXT_POOL[archetype]
    const useArchetype = pool && pool.length > 0 ? archetype : 'Hot Take'
    caption = pickRandom(X_TEXT_POOL[useArchetype])
  } else {
    // Adapt the upstream IG-style caption: strip hashtags, truncate.
    const base = source.baseCaption ?? source.baseHook ?? ''
    caption = truncateTo(stripHashtags(base), limit)
  }

  return {
    platform: 'X',
    caption,
    hashtags: [],
    charLimit: limit,
  }
}
