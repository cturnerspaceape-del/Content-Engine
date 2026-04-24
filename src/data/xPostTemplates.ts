import type { ContentItem } from '../types'

export const X_TEXT_SEEDS = [
  'X Post — Hot Take',
  'X Post — Drop Announce',
  'X Post — Hook',
  'X Post — Question',
  'X Post — Shoutout',
  'X Post — Meme Line',
] as const

export type XTextArchetype = (typeof X_TEXT_SEEDS)[number]

const TEXT_POOL: Record<string, string[]> = {
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
  'Hook': [
    "What if vapes were actually… cute?",
    "Not every high needs to make a statement. But your hardware should.",
    "Premium isn't a price point. It's how it feels in your hand.",
    "10 flavors. 1 dress code: looks clean, hits clean.",
    "Some things are worth the upgrade. This is one of them.",
    "If a vape can't stay alive on a pool day, the bar is on the floor.",
  ],
  'Question': [
    "What's the most underrated flavor we carry? Reply with your pick.",
    "Hybrid, sativa, indica — what's in your rotation this week?",
    "Fruity or gas — pick a side. We already know which one wins.",
    "What's the first thing you look at on a new vape: flavor, hardware, or packaging?",
    "If we dropped a new flavor next month — what profile would you actually buy?",
    "Which flavor name needs a sequel?",
  ],
  'Shoutout': [
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

function archetypeFromTitle(title: string): string {
  // Title format: "X Post — <Archetype>"
  const parts = title.split(' — ')
  return parts[1]?.trim() || 'Hot Take'
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateXTextPost(item: ContentItem): ContentItem {
  const archetype = archetypeFromTitle(item.title)
  const pool = TEXT_POOL[archetype] ?? TEXT_POOL['Hot Take']
  const tweet = pickRandom(pool)
  return {
    ...item,
    platform: 'X',
    description: tweet,
    generated: true,
    generatedVisual: {
      hook: tweet,
      caption: tweet,
      hashtags: [],
      pillar: archetype,
      subcategory: archetype,
      // Type-compat placeholder — XPostCard ignores this for the Text tab.
      // Kept at 'Single Image' to avoid widening InstagramFormat across the codebase.
      format: 'Single Image',
    },
  }
}
