// Brand-voice prompt builder for Space Ape captions across IG, Carousel, Reel,
// and X/Threads text posts. Centralizes the founder voice + product catalog +
// compliance rules so every caption is on-tone and on-product.

export type VoiceMode = 'raw' | 'polished' | 'compliance'
export type StrainType = 'Sativa' | 'Indica' | 'Hybrid' | ''
export type ProductFormat = '2G' | '4G'
export type CaptionPlatform = 'IG' | 'X' | 'Threads' | 'TikTok' | 'YouTube Shorts'

export interface BuildCaptionInput {
  pillar: string
  subcategory: string
  flavor: string
  strainType: StrainType
  format: ProductFormat
  flavorNotes?: string[]
  platform: CaptionPlatform
  archetype?: string // X/Threads text-only posts
}

const BRAND_BIBLE = `SPACE APE — BRAND BIBLE (caption voice).

Tagline: "Premium Cannabis, Zero Compromises."

What we are: a premium cannabis live-resin disposable vape brand. Our flagship Live Series ships in two formats — the 4G (4-gram) for connoisseurs who don't want to reup, and the 2G (2-gram) which is the most popular vape segment in America and our best seller. Every device is live-resin (flash-frozen flower preserves the full terpene profile — that's why the flavor hits where distillate-plus-additives can't).

Audience: connoisseurs, tastemakers, risk-takers — adult enthusiasts who already know cannabis and want hardware and flavor that match their taste. Not patients, not first-timers shopping for relief.

Brand identity to lean into: editorial still-life meets playful-pop sticker energy (think Starface / Glossier / Fenty — never a dispensary menu). Confident, youthful, high-saturation, clean. Cosmic / intergalactic imagery is in the DNA — flavor profiles "go intergalactic," sessions are "cosmic," the brand "rewrites the vape game."

Reach for these phrases freely: cosmic, intergalactic, vibe, experience, elevate, smooth, flavor-forward, full-spectrum, entourage effect, ultra premium, live resin, terpene profile, hardware, fast-charging, water-resistant, variable voltage. The product is the focal point of every caption — the strain name and format earn their place.`

const COMPLIANCE_RULES = `COMPLIANCE — non-negotiable, applies in every voice mode:
- Never claim medical benefits. No "treats anxiety", "helps with pain", "cures", "good for sleep/insomnia", "medical".
- No absolute effect language. "Better high" → "better experience". "Will make you ___" → "many users describe ___ as ___" or "often reported as ___".
- "Uplifting / relaxing / energizing" must be hedged when used as an effect ("often reported as uplifting", "many users describe it as relaxing"). Used as flavor/mood adjectives ("uplifting vibe", "relaxed shoot") it's fine.
- No THC percentages — they vary by batch.
- Adult enthusiasts only. Never frame the product as a solution to a condition.
- Never include emojis (the labs surface to multiple platforms with their own typographic conventions).`

const VOICE_MODES: Record<VoiceMode, string> = {
  raw: `VOICE: Raw Conner mode. Founder energy, unfiltered.
- Caps for emphasis when the line earns it. Multiple exclamation points are fine.
- Slang ok: dude, fam, bet, lowkey, no joke, straight fire. Casual, urgent, founder-on-a-rant.
- Run-on energy is welcome — let sentences spill when the hype is real.
- Cosmic imagery often: rocket fuel, intergalactic, cosmic, in orbit, from another planet.
- Sales hype tactics: scarcity ("low stock"), audience appeals ("for the ones who get it"), bold claims about hardware and flavor.
- Drop perfect grammar for voice when it's funnier or hits harder.
DO: caps for emphasis, slang, cosmic metaphors, scarcity beats, founder confidence.
DON'T: read like a brand manager wrote it, hedge every claim, sound polite, use clinical language.`,
  polished: `VOICE: Polished Space Ape mode. Client / dispenser-facing but still bold.
- Grammatical sentences. Confident, bold, cosmic — but readable to a budtender or a retail buyer.
- Cosmic metaphors stay ("flavor that goes intergalactic", "cosmic clouds") but framed as product or experience claims.
- Lean into the craft: live-resin extraction, terpene profile, hardware specs (variable voltage, fast-charging, water-resistant), 4G vs 2G positioning.
- Show the difference between "ultra premium" and the rest of the shelf. Show why a connoisseur would care.
DO: clean grammar, cosmic-but-clear metaphors, real product specifics, craft language.
DON'T: emojis, excessive caps, slang stacked three deep, run-on chaos.`,
  compliance: `VOICE: Compliance-Safe retail mode. Restrained but never boring.
- Grammatical, professional. Focus on flavor, format, and experience — not on guaranteed outcomes.
- Use weasel words around effect claims: "many users describe", "often reported as", "individual experience may vary".
- Educational framing is welcome: how live resin differs from distillate, what a sativa/indica/hybrid actually means in terms of energy/wind-down/balance, what 4G vs 2G is for.
- Adult enthusiasts only. Lead with flavor and experience, not effect.
DO: weasel words around effects, educational angle, flavor and format facts.
DON'T: medical phrasing, absolute effect claims, hype slang, caps storms.`,
}

// Curated few-shot exemplars per voice × pillar. These are the strongest lines
// from the existing static pools (instagramContentTemplates.ts + X_TEXT_POOL),
// re-purposed as in-context anchors so the LLM has concrete voice DNA to mimic.
const FEW_SHOTS: Record<VoiceMode, Record<string, string[]>> = {
  raw: {
    Lifestyle: [
      "Future cool hits different when the flavor's this loud.",
      "We don't chase vibes we set them.",
      "This is the crossover nobody saw coming.",
      "When the playlist and the pull hit at the same time.",
    ],
    Entertainment: [
      "The internet wasn't ready but we posted it anyway.",
      "Zero regrets maximum chaos let's go.",
      "We're legally required to be this unhinged.",
      "No thoughts just vibes and live resin.",
    ],
    'Product Centric': [
      "You asked. We delivered. Now zoom in on that hardware.",
      "The 2G that's outselling everything in the game.",
      "Built different and we have the hardware to prove it.",
    ],
    'Brand Building': [
      "We didn't start this to blend in.",
      "From a group chat to the best hardware in the game.",
      "Built on late nights bold calls and better flavors.",
    ],
    'Social Proof': [
      "Real ones recognize real ones.",
      "The DMs we wake up to every single morning.",
      "Proof is in the pull. Literally.",
    ],
    Education: [
      "Live resin vs distillate — here's why it matters.",
      "Sativa vs Indica vs Hybrid — the real breakdown.",
      "2G vs 4G — which one is right for you.",
    ],
  },
  polished: {
    Lifestyle: [
      "Somewhere between golden hour and great flavor there's a whole lifestyle. Welcome to it.",
      "Clean, intentional, effortless. That's the Space Ape lifestyle and we're not gatekeeping it.",
      "When the setting matches the strain and the strain matches the mood. That's the sweet spot right there.",
    ],
    'Product Centric': [
      "Battery variable mode. Water resistant. Fast charging. And it tastes like actual fruit.",
      "Ultra premium live resin isn't marketing. It's a standard we refuse to lower.",
      "We don't cut corners. Every Space Ape that ships has been tested, retested, and tested again.",
    ],
    'Brand Building': [
      "We're not here to play it safe. Bold ideas, real quality, and a community that keeps us honest.",
      "Ten plus years combined experience in cannabis. The knowledge went into every flavor, every device, every detail.",
      "We didn't start Space Ape to be another brand on the shelf. We started it to set a new standard.",
    ],
    'Social Proof': [
      "Real people. Real pulls. Real reactions. We didn't script this.",
      "The best marketing is when a customer won't stop texting their friends about you. This is that energy.",
    ],
    Entertainment: [
      "We were going to post something professional. Then this happened.",
      "Hot take incoming. We stand by it.",
    ],
    Education: [
      "Live resin keeps the full terpene profile intact. Distillate strips it out and adds it back artificially. That's the difference you taste.",
      "Three battery modes — low for flavor chasers, medium for everyday, high for when you mean business.",
    ],
  },
  compliance: {
    Education: [
      "Live resin starts with flash-frozen flower harvested at peak — nothing gets lost in the process. That's why many users describe the flavor as fuller and more true to the strain.",
      "Sativa for the daytime, indica for the wind-down, hybrid for in-between — pick the one that matches your moment.",
      "Third-party lab testing isn't optional. Every batch gets tested for potency, purity, and consistency before it ships.",
    ],
    'Product Centric': [
      "Water-resistant doesn't mean waterproof — but it means your device survives the everyday stuff that ends a lot of pens early.",
      "Variable voltage lets you dial the experience in. Lower for flavor-forward sessions, higher when you want more impact.",
    ],
    Lifestyle: [
      "Premium hardware, flavor-forward live resin, designed for adult enthusiasts who already know what they like.",
    ],
    'Brand Building': [
      "Built by a team that's been in cannabis for over a decade — that knowledge shows up in every flavor and every device.",
    ],
    'Social Proof': [
      "Customer feedback is the only review that matters. Many users describe Space Ape as smooth, flavor-forward, and easy to come back to.",
    ],
    Entertainment: [
      "A lighter take on what we usually post — flavor and craft are still the point.",
    ],
  },
}

export function pickVoiceMode(pillar: string, platform: CaptionPlatform): VoiceMode {
  if (platform === 'X' || platform === 'Threads') return 'raw'
  if (pillar === 'Education') return 'compliance'
  if (pillar === 'Lifestyle' || pillar === 'Entertainment') return 'raw'
  return 'polished'
}

function shotsForPillar(mode: VoiceMode, pillar: string): string[] {
  const bucket = FEW_SHOTS[mode]
  return bucket[pillar] ?? bucket['Lifestyle'] ?? Object.values(bucket)[0] ?? []
}

interface BuildOutput {
  systemBlocks: Array<{ type: 'text'; text: string; cache_control?: { type: 'ephemeral' } }>
  userMessage: string
  voiceMode: VoiceMode
}

export function buildCaptionMessages(input: BuildCaptionInput): BuildOutput {
  const voiceMode = pickVoiceMode(input.pillar, input.platform)
  const exemplars = shotsForPillar(voiceMode, input.pillar)

  // The static system block — brand bible + voice mode + compliance + few-shots —
  // is identical across calls in the same session. Mark it as ephemeral cache
  // so subsequent calls in a 5-min window read from the prompt cache.
  const staticSystem = [
    BRAND_BIBLE,
    VOICE_MODES[voiceMode],
    COMPLIANCE_RULES,
    `EXEMPLARS (voice DNA — match the rhythm and confidence, do not repeat the words):\n${exemplars.map((s) => `- ${s}`).join('\n')}`,
  ].join('\n\n')

  // Dynamic per-request user message — the actual product + intent.
  const lines: string[] = []
  lines.push(`Generate one social caption set for the following post.`)
  lines.push('')
  lines.push(`Pillar: ${input.pillar}`)
  if (input.subcategory) lines.push(`Subcategory: ${input.subcategory}`)
  lines.push(`Platform: ${input.platform}`)
  if (input.archetype) lines.push(`Archetype (X/Threads only): ${input.archetype}`)
  lines.push('')
  lines.push(`Product on screen:`)
  lines.push(`- Flavor: Space Ape ${input.flavor}`)
  if (input.strainType) lines.push(`- Strain type: ${input.strainType}`)
  lines.push(`- Format: ${input.format} Live Series disposable`)
  if (input.flavorNotes && input.flavorNotes.length > 0) {
    lines.push(`- Flavor notes: ${input.flavorNotes.join(', ')}`)
  }
  lines.push('')

  if (input.platform === 'X' || input.platform === 'Threads') {
    lines.push(
      `OUTPUT FORMAT — return only valid JSON with this exact shape (no markdown fences, no commentary):`,
    )
    lines.push(`{`)
    lines.push(`  "hook": "<the caption itself — a single line, on-archetype, on-voice; max ${input.platform === 'X' ? 240 : 480} chars; do not include hashtags inline>",`)
    lines.push(`  "caption": "<same value as hook — repeated for downstream compatibility>",`)
    lines.push(`  "hashtags": []`)
    lines.push(`}`)
    lines.push('')
    lines.push(
      `RULES: name a real strain or format detail when it serves the line — do not force it. The archetype determines the angle: Hot Take = confident opinion, Drop Announce = launch/restock energy, Hook = grabber, Question = open invitation to reply, Shoutout = thanks, Meme Line = group-chat one-liner.`,
    )
  } else {
    lines.push(
      `OUTPUT FORMAT — return only valid JSON with this exact shape (no markdown fences, no commentary):`,
    )
    lines.push(`{`)
    lines.push(`  "hook": "<one short, scroll-stopping line, ~6-14 words; refer to the flavor or strain when it fits the pillar>",`)
    lines.push(`  "caption": "<2-4 sentences in the voice above. Reference the flavor by name where it earns the line. Mention strain type or format when it adds substance — never as filler. No emojis. No hashtags inline.>",`)
    lines.push(`  "hashtags": ["#spaceape", "#liveresin", "<3 more pillar-relevant tags, lowercase, no spaces>"]`)
    lines.push(`}`)
    lines.push('')
    lines.push(
      `RULES: the caption MUST sound product-aware (mention the flavor by name, and surface the strain type or format when it serves the message — especially for Product Centric, Education, and 'New Drop Reveal' or 'Flavor Breakdown' subcategories). Do not stuff every product fact into one caption — pick what earns its place.`,
    )
  }

  return {
    systemBlocks: [
      { type: 'text', text: staticSystem, cache_control: { type: 'ephemeral' } },
    ],
    userMessage: lines.join('\n'),
    voiceMode,
  }
}

// Banned-phrase scanner. Returns the matched phrase if found, null otherwise.
const BANNED_PATTERNS: RegExp[] = [
  /\btreats?\s+(anxiety|pain|insomnia|depression|stress)\b/i,
  /\bcures?\b/i,
  /\bmedical\s+(benefit|use|grade|cannabis)\b/i,
  /\bbetter\s+high\b/i,
  /\bguaranteed\s+(high|effect|relief)\b/i,
  /\bhelps?\s+with\s+(anxiety|pain|insomnia|depression)\b/i,
  /\b\d{1,2}(?:\.\d+)?%\s*thc\b/i,
]

export function safetyLint(text: string): string | null {
  for (const pat of BANNED_PATTERNS) {
    const m = text.match(pat)
    if (m) return m[0]
  }
  return null
}
