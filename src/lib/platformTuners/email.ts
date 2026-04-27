import type { PlatformVariant, TunerSource } from './types'
import type { TextArchetype } from '../seeds/textArchetype'

const EMAIL_PRIMARY_LIMIT = 998 // RFC line-length convention; not a hard wall

interface EmailPool {
  subjects: string[]
  preheaders: string[]
  bodyParagraphs: string[]
  ctaLabels: string[]
  ctaUrls: string[]
}

// Archetype-keyed email pools. Seeded from src/data/emailContentTemplates.ts
// but keyed on the cross-platform TextArchetype rather than EmailTypeId.
// Email-only archetypes (Newsletter / Welcome / Re-engagement) plus
// shared archetypes (Hot Take / Drop Announce / Hook / Shoutout) get
// their own email-flavored pools.
const POOLS: Record<TextArchetype, EmailPool> = {
  'Drop Announce': {
    subjects: [
      'it landed.',
      'new drop. live now.',
      "you're early. the drop just dropped.",
      'fresh stock just hit ✨',
      'the wait is over',
      'restocked + something new',
    ],
    preheaders: [
      'first batch is small — get in before it walks.',
      "limited run. once it's gone, it's gone.",
      'fresh terps, fresh hardware, you know the vibe.',
      'shop the drop before the group chat finds out.',
    ],
    bodyParagraphs: [
      "<strong>It's live.</strong> The drop you've been waiting on is now sitting pretty in the shop. Small batch, big flavor.",
      "We don't make drops to just sit there. Get in early — last time these moved in under a week.",
      "Each one is dialed in: terps you can actually taste, hardware that hits clean, and packaging that doesn't apologize for itself.",
      "First-come, first-served. No drop dates, no lottery, no nonsense — just tap the button below.",
    ],
    ctaLabels: ['Shop the drop', 'Get yours', 'Tap in', 'See what dropped'],
    ctaUrls: ['/shop', '/drop', '/new'],
  },
  'Hot Take': {
    subjects: [
      "we're saying it: fruity flavors are the future",
      'a hot take from the team',
      'unpopular opinion (we stand by it)',
      'something we keep arguing about internally',
    ],
    preheaders: [
      'three minutes of strong opinions, gently delivered.',
      "we'd rather be right than agreeable.",
      "the kind of email you forward to one specific friend.",
    ],
    bodyParagraphs: [
      "Real talk: <strong>most of what's on dispensary shelves is the same product in different packaging</strong>. We started Space Ape because that bar was on the floor.",
      "Premium isn't a price point — it's a feeling. The hardware in your hand, the clarity of the terps, the fact that it doesn't die in your bag.",
      "We're not interested in convincing you. We're interested in giving you something you'd recommend without being asked.",
    ],
    ctaLabels: ['See the difference', 'Try Space Ape', 'Read the full take'],
    ctaUrls: ['/shop', '/about', '/blog'],
  },
  Hook: {
    subjects: [
      'a quick read, but a worth-it one',
      'what we kept thinking about this week',
      'the one detail nobody talks about',
    ],
    preheaders: [
      'two minutes of your inbox, one good idea.',
      'small thing. big difference.',
    ],
    bodyParagraphs: [
      "We've been heads-down on something we think you'll care about. Here's the short version.",
      "If you've been on the fence about live resin vs distillate — this is the email that explains why it matters in real, taste-buds-on-the-table terms.",
      "Tap the button if you want the full story. Otherwise, file it away for the next time someone asks.",
    ],
    ctaLabels: ['Read more', 'See the breakdown', 'Get into it'],
    ctaUrls: ['/learn', '/blog', '/'],
  },
  Shoutout: {
    subjects: [
      'shoutout to you',
      "couldn't have done it without you",
      'the people who made this work',
    ],
    preheaders: [
      'a quick thank-you to the list.',
      'this one is just a thanks. no pitch.',
    ],
    bodyParagraphs: [
      "<strong>Real quick:</strong> we wanted to say thanks. The folks on this list are the reason any of this works — drops sell out, restocks land, and the brand keeps building because you keep showing up.",
      "We see the orders, the reposts, the DMs. The people who carry us into their group chats are doing the actual work. We don't take that lightly.",
      "More to come. Same standard. Same gratitude.",
    ],
    ctaLabels: ['Shop now', 'See the new drop', 'Tap in'],
    ctaUrls: ['/shop', '/new', '/'],
  },
  Newsletter: {
    subjects: [
      'this week at Space Ape',
      'the recap',
      "what's good (and what's coming)",
      'small batch, big week',
      'monthly check-in',
    ],
    preheaders: [
      "drops, drops coming, and a couple of things we're excited about.",
      'three things worth your attention this week.',
      "no fluff. just what we shipped, what we're shipping, and what to watch.",
    ],
    bodyParagraphs: [
      "Quick rundown of where we are.",
      "<strong>This week:</strong> we restocked two of the flavors that sold out last drop, plus added one new SKU we've been sitting on since last month.",
      "<strong>Coming up:</strong> a small batch we'll only run once — keep an eye on your inbox in the next 7–10 days. List subscribers get the link first.",
      "<strong>From the team:</strong> we've been heads-down on the next hardware revision. If you've got feedback on the current device, hit reply.",
      "That's it. Short and clean — the way these should be.",
    ],
    ctaLabels: ['Shop now', "See what's new", 'Catch up'],
    ctaUrls: ['/shop', '/new', '/'],
  },
  Welcome: {
    subjects: [
      'welcome to the launchpad 🚀',
      "you're in.",
      "glad you're here.",
      'your code is inside',
    ],
    preheaders: [
      "here's what to expect + a little something for showing up.",
      "code, intro, vibe check — all in one email.",
      "welcome aboard. here's the lay of the land.",
    ],
    bodyParagraphs: [
      "<strong>Welcome to Space Ape.</strong> You're now on the list that gets drops first, restock alerts before the site, and the occasional flavor recommendation we'd actually stake our name on.",
      "Quick context: we're a small team making cannabis hardware and flavors we'd want to use ourselves. No filler, no AI cart art, no influencer math.",
      "Use code <strong>WELCOME15</strong> for 15% off your first order. One-time use, no minimum, expires in 14 days.",
      "Come hang on the socials too — that's where the unfiltered version of us lives.",
    ],
    ctaLabels: ['Start shopping', 'Use my code', 'Browse the shop'],
    ctaUrls: ['/shop', '/welcome', '/'],
  },
  'Re-engagement': {
    subjects: [
      "we noticed you've been quiet",
      "haven't seen you in a minute",
      'still want these emails?',
      'one more before we let you go',
    ],
    preheaders: [
      "no hard feelings — just checking in.",
      "we redesigned the cart and dropped three new flavors since last time.",
      "20% off if you're still interested.",
    ],
    bodyParagraphs: [
      "It's been a minute. Wanted to check in before doing anything dramatic with our list.",
      "Quick update: we shipped a new device, added a few flavors, and tightened up a bunch of the small stuff (better packaging, faster shipping, cleaner site).",
      "Use code <strong>COMEBACK20</strong> for 20% off if you want to give us another shot. Good for the next 7 days.",
      "If email isn't your thing, totally get it. The unsubscribe link at the bottom is real — no guilt, no tricks.",
    ],
    ctaLabels: ['Use my code', 'Come back', 'See what changed'],
    ctaUrls: ['/shop', '/comeback', '/new'],
  },
  // X-only archetypes that don't fit Email tone — fallback to Hot Take pool.
  Question: {
    subjects: ['a question for the list'],
    preheaders: ['hit reply. we read everything.'],
    bodyParagraphs: [
      "Quick one: <strong>what flavor profile would you actually buy next month?</strong> Fruity, gas, dessert, or something we haven't done yet?",
      "Hit reply with your pick. We read every response and the team uses it for the next batch planning meeting.",
    ],
    ctaLabels: ['Reply with your pick', 'Tell us'],
    ctaUrls: ['/shop'],
  },
  'Meme Line': {
    subjects: ['this email exists for one joke'],
    preheaders: ['delete after reading.'],
    bodyParagraphs: [
      "POV: you opened this email at 4:19:59. Coincidence? We think not.",
      "That's the email. The shop is open. Carry on.",
    ],
    ctaLabels: ['Shop anyway', 'OK fine'],
    ctaUrls: ['/shop'],
  },
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  if (n >= arr.length) return [...arr]
  const pool = [...arr]
  const out: T[] = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    out.push(pool.splice(idx, 1)[0])
  }
  return out
}

export function tuneForEmail(source: TunerSource): PlatformVariant {
  const archetype = source.archetype ?? 'Newsletter'
  const pool = POOLS[archetype] ?? POOLS['Newsletter']
  const paragraphCount = 2 + Math.floor(Math.random() * 2) // 2–3 paragraphs
  const paragraphs = pickN(pool.bodyParagraphs, paragraphCount)
  const bodyHtml = paragraphs.map((p) => `<p>${p}</p>`).join('\n')
  const subject = pickOne(pool.subjects)
  const preheader = pickOne(pool.preheaders)
  return {
    platform: 'Email',
    caption: subject, // primary user-visible text mirrors subject line
    hashtags: [],
    charLimit: EMAIL_PRIMARY_LIMIT,
    subject,
    preheader,
    bodyHtml,
    ctaLabel: pickOne(pool.ctaLabels),
    ctaUrl: pickOne(pool.ctaUrls),
  }
}
