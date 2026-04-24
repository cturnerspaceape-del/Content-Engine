import type { EmailItem, EmailTypeId } from '../types'

export interface EmailType {
  id: EmailTypeId
  label: string
  description: string
}

export const EMAIL_TYPES: readonly EmailType[] = [
  {
    id: 'drop-announce',
    label: 'Drop Announce',
    description: 'New drop is live — announce it to the list.',
  },
  {
    id: 'flavor-spotlight',
    label: 'Flavor Spotlight',
    description: 'Zoom in on a single flavor and the vibe around it.',
  },
  {
    id: 'welcome',
    label: 'Welcome',
    description: "First touch after sign-up — set the tone, drop a code.",
  },
  {
    id: 'newsletter',
    label: 'Newsletter / Recap',
    description: 'Weekly or monthly check-in — drops, drops coming, the vibe.',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Teach something useful — strain, hardware, or how-to.',
  },
  {
    id: 're-engagement',
    label: 'Re-engagement',
    description: "Win back subscribers who haven't opened in a while.",
  },
  {
    id: 'limited-drop',
    label: 'Limited Drop / FOMO',
    description: 'Time-boxed drop or restock — urgency-forward.',
  },
] as const

interface EmailPool {
  subjects: string[]
  preheaders: string[]
  bodyParagraphs: string[]
  ctaLabels: string[]
  ctaUrls: string[]
}

const POOLS: Record<EmailTypeId, EmailPool> = {
  'drop-announce': {
    subjects: [
      'it landed.',
      'new drop. live now.',
      "you're early. the drop just dropped.",
      'fresh stock just hit ✨',
      'the wait is over',
      'restocked + something new',
      'open me first.',
      "don't sleep on this one",
      'this one moves fast',
      'the drop you asked for',
    ],
    preheaders: [
      'first batch is small — get in before it walks.',
      "limited run. once it's gone, it's gone.",
      'fresh terps, fresh hardware, you know the vibe.',
      'we made it. you wanted it. it lives in the shop now.',
      'shop the drop before the group chat finds out.',
      'three new flavors and a restock you missed last time.',
      'tap in — link inside.',
      'small batch. big flavor. usual chaos.',
    ],
    bodyParagraphs: [
      "<strong>It's live.</strong> The drop you've been waiting on is now sitting pretty in the shop. Small batch, big flavor, and the kind of glass we'd put on our own coffee table.",
      "We don't make drops to just sit there. Get in early — last time these moved in under a week and we don't restock right away.",
      "Each one is dialed in: terps you can actually taste, hardware that hits clean, and packaging that doesn't apologize for itself. This is what we mean when we say <strong>Space Ape</strong>.",
      "If you've been on the fence, this is the one to grab. We picked the flavors based on what y'all kept asking for in the DMs.",
      "First-come, first-served. No drop dates, no lottery, no nonsense — just tap the button below and it's yours.",
    ],
    ctaLabels: ['Shop the drop', 'Get yours', 'Tap in', 'See what dropped', 'Lock it in'],
    ctaUrls: ['/shop', '/drop', '/new'],
  },
  'flavor-spotlight': {
    subjects: [
      'meet your new favorite',
      'the one that keeps selling out',
      'flavor of the week',
      "we couldn't keep this one quiet",
      'a love letter to one flavor',
      'this terp profile is unreal',
      "you've been sleeping on this one",
    ],
    preheaders: [
      'one flavor. one full breakdown. one click to shop.',
      "we're obsessed and we think you will be too.",
      'the terps, the vibe, the why — all in one email.',
      'small detour into a flavor that deserves the spotlight.',
      'why this one keeps showing up in the group chat.',
    ],
    bodyParagraphs: [
      "Some flavors are just <strong>built different</strong>. This is one of them.",
      "On the front: bright, citrusy, almost unfair. Mid-palate it pivots into something rounder — gas, a little earth, the kind of finish that lingers without overstaying.",
      "Pairs with: golden hour, the back of an Uber, that one playlist you keep on repeat. Doesn't pair with: 9am Mondays.",
      "We dialed this one in over three rounds. The cart hits clean, the terps hold up, and the high is exactly the lane we wanted — present without being heavy.",
      "If you've been curious, this is the rec. If you've already tried it — restock window is open.",
    ],
    ctaLabels: ['Try it', 'Shop the flavor', 'See it', 'Add to cart'],
    ctaUrls: ['/flavors', '/shop', '/spotlight'],
  },
  welcome: {
    subjects: [
      'welcome to the launchpad 🚀',
      "you're in.",
      "glad you're here.",
      "let's get you set up",
      'your code is inside',
      'first email, important one',
    ],
    preheaders: [
      "here's what to expect + a little something for showing up.",
      "code, intro, vibe check — all in one email.",
      "welcome aboard. here's the lay of the land.",
      "you signed up. we noticed. here's a thank-you.",
    ],
    bodyParagraphs: [
      "<strong>Welcome to Space Ape.</strong> You're now on the list that gets drops first, restock alerts before the site, and the occasional flavor recommendation we'd actually stake our name on.",
      "Quick context: we're a small team making cannabis hardware and flavors we'd want to use ourselves. No filler, no AI cart art, no influencer math — just the stuff we'd put on our own shelf.",
      "Use code <strong>WELCOME15</strong> for 15% off your first order. One-time use, no minimum, expires in 14 days.",
      "Come hang on the socials too — that's where the unfiltered version of us lives.",
    ],
    ctaLabels: ['Start shopping', 'Use my code', 'Browse the shop', 'See what we make'],
    ctaUrls: ['/shop', '/welcome', '/'],
  },
  newsletter: {
    subjects: [
      'this week at Space Ape',
      'the recap',
      "what's good (and what's coming)",
      'small batch, big week',
      'monthly check-in',
      'the round-up',
    ],
    preheaders: [
      "drops, drops coming, and a couple of things we're excited about.",
      'three things worth your attention this week.',
      "no fluff. just what we shipped, what we're shipping, and what to watch.",
      'a quick read for the people who actually open these.',
    ],
    bodyParagraphs: [
      "Quick rundown of where we are.",
      "<strong>This week:</strong> we restocked two of the flavors that sold out last drop, plus added one new SKU we've been sitting on since last month.",
      "<strong>Coming up:</strong> a small batch we'll only run once — keep an eye on your inbox in the next 7–10 days. List subscribers get the link first.",
      "<strong>From the team:</strong> we've been heads-down on the next hardware revision. If you've got feedback on the current device, hit reply — we read everything.",
      "That's it. Short and clean — the way these should be.",
    ],
    ctaLabels: ['Shop now', "See what's new", 'Catch up'],
    ctaUrls: ['/shop', '/new', '/'],
  },
  education: {
    subjects: [
      "know what you're using",
      'a quick read on terps',
      'how to get the cleanest pull',
      "let's talk hardware",
      "the difference between live resin and rosin (and why it matters)",
      'storage 101',
    ],
    preheaders: [
      "two minutes of reading that'll make every session better.",
      "stuff we wish someone had told us earlier.",
      "the part of the product we don't put on the label.",
      "small detail, big difference in your sessions.",
    ],
    bodyParagraphs: [
      "We get this question a lot, so we put it in writing.",
      "The short version: <strong>flavor isn't just terps</strong>. It's terps, the temperature you hit at, the freshness of the cart, and how the hardware delivers it. Skip any one of those and the others can't carry the load.",
      "What you can control: keep it stored upright, out of direct sun, and at room temp. Heat is the enemy — a hot car will mute even the best terp profile in a week.",
      "What we control on our end: small batches, sealed packaging, and a fill date you can actually read on the box. No mystery stock sitting in a warehouse since last summer.",
      "If you want the long version, we put a full breakdown on the site. Otherwise, this is enough to make every session noticeably better.",
    ],
    ctaLabels: ['Read the full guide', 'Learn more', 'See our care tips'],
    ctaUrls: ['/learn', '/guide', '/care'],
  },
  're-engagement': {
    subjects: [
      "we noticed you've been quiet",
      "haven't seen you in a minute",
      'still want these emails?',
      "miss us? we've got news",
      'one more before we let you go',
      'last call (kinda)',
    ],
    preheaders: [
      "no hard feelings — just checking in.",
      "we redesigned the cart and dropped three new flavors since last time.",
      "if it's not for you anymore, no problem. but read this first.",
      "20% off if you're still interested. otherwise, we'll bow out.",
    ],
    bodyParagraphs: [
      "It's been a minute. Wanted to check in before doing anything dramatic with our list.",
      "Quick update: we shipped a new device, added a few flavors, and tightened up a bunch of the small stuff (better packaging, faster shipping, cleaner site).",
      "Use code <strong>COMEBACK20</strong> for 20% off if you want to give us another shot. Good for the next 7 days.",
      "If email isn't your thing, totally get it. The unsubscribe link at the bottom is real — no guilt, no tricks. Otherwise, we'll keep showing up in your inbox once in a while with the good stuff.",
    ],
    ctaLabels: ['Use my code', 'Come back', 'See what changed'],
    ctaUrls: ['/shop', '/comeback', '/new'],
  },
  'limited-drop': {
    subjects: [
      "24 hours. that's it.",
      'small batch. small window.',
      "blink and it's gone",
      'this one ends tomorrow',
      'limited run — link inside',
      'restock window is open',
    ],
    preheaders: [
      "once we hit the cap, this drop is closed for good.",
      "no restock plan. no rain check. just this.",
      "small batch, sharp window, easy decision.",
      'we made fewer than usual on purpose. heads up.',
    ],
    bodyParagraphs: [
      "<strong>Heads up.</strong> We made a small batch of this, and we're only running it for the next 24 hours.",
      "When the timer hits zero — or stock hits zero, whichever comes first — the drop closes and we don't bring it back.",
      "Why a window? Because we'd rather make less of something we love than make more of something we don't. That's the whole pitch.",
      "If you've been waiting for the right moment to grab one, this is it. Tap the button before the inbox crowd beats you to it.",
    ],
    ctaLabels: ['Lock it in', 'Shop the drop', 'Get one before it closes', 'Tap in'],
    ctaUrls: ['/drop', '/limited', '/shop'],
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

export function makeEmailSeed(type: EmailType): EmailItem {
  return {
    typeId: type.id,
    title: `Email — ${type.label}`,
    description: type.description,
    generated: false,
  }
}

export function generateEmailContent(item: EmailItem): EmailItem {
  const pool = POOLS[item.typeId]
  if (!pool) return item
  const paragraphCount = 2 + Math.floor(Math.random() * 2) // 2 or 3 paragraphs
  const paragraphs = pickN(pool.bodyParagraphs, paragraphCount)
  const bodyHtml = paragraphs.map((p) => `<p>${p}</p>`).join('\n')
  return {
    ...item,
    generated: true,
    content: {
      subject: pickOne(pool.subjects),
      preheader: pickOne(pool.preheaders),
      bodyHtml,
      ctaLabel: pickOne(pool.ctaLabels),
      ctaUrl: pickOne(pool.ctaUrls),
    },
  }
}
