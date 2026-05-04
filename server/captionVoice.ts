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
  // Optional creative direction supplied by the Research button. When present,
  // the LLM is asked to anchor the caption to this angle rather than picking
  // a generic take for the pillar/subcategory.
  researchAngle?: string
  researchNotes?: string
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
- Adult enthusiasts only. Never frame the product as a solution to a condition.`

const VOICE_MODES: Record<VoiceMode, string> = {
  raw: `VOICE: Raw Conner mode. Founder energy, unfiltered, VERY silly and fun.
- This is group-chat-from-a-hyped-founder energy. Goofs, bits, jokes, mock-serious takes, self-aware brand chaos. Confidence is the foundation — silliness is the delivery.
- Emojis welcome and encouraged: 1–4 per caption, used like punchlines or visual beats (🚀 🍊 🤌 💀 😤 🍒 🍇 🛸 🔥 etc.). Pick the right one for the line; don't carpet-bomb.
- Caps for emphasis when the line earns it. Multiple exclamation points are fine. Run-on energy is welcome — let sentences spill when the hype is real.
- Slang ok: dude, fam, bet, lowkey, no joke, straight fire, ayo, ngl. Casual, urgent, founder-on-a-rant.
- Cosmic imagery often: rocket fuel, intergalactic, cosmic, in orbit, from another planet 🛸.
- Sales hype tactics: scarcity, audience appeals, bold claims about hardware and flavor.
- Drop perfect grammar for voice when it's funnier or hits harder. Be willing to make a fool of the brand for the bit.
DO: emojis as punchlines, caps for emphasis, slang, cosmic metaphors, dumb jokes that still hit, founder confidence.
DON'T: read like a brand manager wrote it, hedge every claim, sound polite, use clinical language, emoji-spam every word.`,
  polished: `VOICE: Polished Space Ape mode. Client/dispenser-facing — confident, bold, and still fun.
- Grammatical sentences with personality. Premium doesn't have to mean serious — light jokes and clever turns of phrase are welcome.
- Emojis ok in moderation: 1–3 per caption when they earn the line. Skew product/flavor-relevant (🍊 🍒 🛸 ⚡ ✨ 💎). Skip them entirely when the line lands without one.
- Cosmic metaphors stay ("flavor that goes intergalactic", "cosmic clouds") but framed as product or experience claims.
- Lean into the craft: live-resin extraction, terpene profile, hardware specs (variable voltage, fast-charging, water-resistant), 4G vs 2G positioning.
- Show the difference between "ultra premium" and the rest of the shelf, with confidence and a wink.
DO: clean grammar with personality, well-placed emojis, real product specifics, craft language with a sense of humor.
DON'T: dry brand-deck copy, emoji-spam, slang stacked three deep, run-on chaos.`,
  compliance: `VOICE: Compliance-Safe retail mode. Restrained on effects, but absolutely not boring.
- Grammatical, professional, witty. Focus on flavor, format, and experience — not on guaranteed outcomes.
- Emojis ok in moderation: 0–2 per caption, ideally tied to flavor or product (🍋 🍇 🛸 ✨). Optional, not required.
- Wit, confidence, and a little fun are welcome around flavor, hardware, and brand identity. Just keep effect language hedged.
- Use weasel words around effect claims: "many users describe", "often reported as", "individual experience may vary".
- Educational framing is welcome and should sound like a confident expert with a sense of humor — not a textbook.
DO: weasel words around effects, educational angle delivered with personality, flavor and format facts, occasional emoji.
DON'T: medical phrasing, absolute effect claims, dry textbook tone, slang pile-ups, caps storms.`,
}

// Curated few-shot exemplars per voice × pillar. These are the strongest lines
// from the existing static pools (instagramContentTemplates.ts + X_TEXT_POOL),
// re-purposed as in-context anchors so the LLM has concrete voice DNA to mimic.
const FEW_SHOTS: Record<VoiceMode, Record<string, string[]>> = {
  raw: {
    Lifestyle: [
      "future cool hits DIFFERENT when the flavor's this loud 🛸",
      "we did not chase the vibe. the vibe filed an application. we approved it. ✨",
      "main character energy powered by live resin and questionable decisions 🤌",
      "when the playlist hits AND the pull hits ON THE SAME BEAT 🎧🍊 don't talk to me",
    ],
    Entertainment: [
      "internet wasn't ready but here we are anyway 💀 we apologize for nothing",
      "every hour is friday hour at the space ape office. it's a problem. it's our brand. 🚀",
      "we're legally required to be this unhinged. it's in the deck. 📑",
      "no thoughts. just vibes. just live resin. 🛸 just being kinda weird about it.",
    ],
    'Product Centric': [
      "Tang Exotic 4G just dropped 🍊 sativa hours, all day, every day. zoom in on the hardware while you're here.",
      "you asked. we delivered. now please zoom in on that hardware so we feel validated 🤌",
      "the 2G that's quietly outselling everything else on the shelf. it's not even a fight anymore 💀",
      "water resistant ✅ fast charging ✅ kinda cute ✅ tastes like ACTUAL fruit ✅ — questions? 🚀",
    ],
    'Brand Building': [
      "we didn't start space ape to blend in 🛸 we started it to be the brand on the shelf you can't stop staring at",
      "from a group chat to the best hardware in the game. the group chat is still wild btw 💬💀",
      "built on late nights, bold calls, and one founder who refuses to ship anything mid 🫡",
    ],
    'Social Proof': [
      "the DMs we wake up to are unreal 📩 real ones recognize real ones",
      "we didn't pay for this review and it shows 💀 (in a good way)",
      "proof is in the pull. literally. ☁️ tag a real one.",
    ],
    Education: [
      "live resin vs distillate — let's settle this 🛸 (spoiler: it's not close)",
      "sativa, indica, hybrid — which one are you today? we'll wait 🍋🍇🍒",
      "2G vs 4G is basically 'pocket size' vs 'don't reup for a week' 🚀 pick your fighter",
    ],
  },
  polished: {
    Lifestyle: [
      "Somewhere between golden hour and great flavor there's a whole lifestyle 🌅 — and yeah, we live there now.",
      "Clean, intentional, effortless. That's the Space Ape lifestyle, and we're not exactly gatekeeping it.",
      "When the setting matches the strain and the strain matches the mood — that's the sweet spot. ✨",
    ],
    'Product Centric': [
      "Variable voltage. Water-resistant. Fast charging. Oh, and it tastes like actual fruit 🍊 — try not to flex it immediately.",
      "Ultra premium live resin isn't a marketing line — it's a standard we refuse to lower. ✨",
      "Every Space Ape that ships has been tested, retested, and tested again. The hardware is half the story. 💎",
    ],
    'Brand Building': [
      "We're not here to play it safe. Bold ideas, real quality, and a community that keeps us honest 🛸 — that's the playbook.",
      "Ten-plus years combined experience in cannabis went into every flavor, every device, every detail. We're proud of that.",
      "We didn't start Space Ape to be another brand on the shelf. We started it to be the one you can't stop talking about.",
    ],
    'Social Proof': [
      "Real people. Real pulls. Real reactions. We didn't script this — it just keeps happening. ✨",
      "The best marketing is when a customer won't stop texting their friends about you. This is that energy.",
    ],
    Entertainment: [
      "We were going to post something professional. Then this happened. 💀 Anyway, hi.",
      "Hot take incoming, we stand by it, the comments are going to be wild and we're bringing snacks. 🍿",
    ],
    Education: [
      "Live resin keeps the full terpene profile intact. Distillate strips it out and adds it back artificially. That's the difference you taste — and yeah, you taste it. ✨",
      "Three battery modes: low for flavor chasers, medium for everyday, high for when you mean business. ⚡",
    ],
  },
  compliance: {
    Education: [
      "Live resin starts with flash-frozen flower harvested at peak — nothing gets lost in the process 🛸 — which is why many users describe the flavor as fuller and more true to the strain.",
      "Sativa for the daytime 🍋, indica for the wind-down 🍇, hybrid for in-between 🍒 — pick the one that matches your moment.",
      "Third-party lab testing isn't optional. Every batch gets tested for potency, purity, and consistency before it ships. ✨",
    ],
    'Product Centric': [
      "Water-resistant doesn't mean waterproof — but it does mean your device survives the everyday stuff that ends a lot of pens early. 💧",
      "Variable voltage lets you dial the experience in. Lower for flavor-forward sessions, higher when you want more impact.",
    ],
    Lifestyle: [
      "Premium hardware, flavor-forward live resin, designed for adult enthusiasts who already know what they like. ✨",
    ],
    'Brand Building': [
      "Built by a team that's been in cannabis for over a decade — that knowledge shows up in every flavor and every device. 🛸",
    ],
    'Social Proof': [
      "Customer feedback is the only review that matters. Many users describe Space Ape as smooth, flavor-forward, and easy to come back to.",
    ],
    Entertainment: [
      "A lighter take on what we usually post — flavor and craft are still the point. ✨",
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
  if (input.researchAngle) {
    lines.push('')
    lines.push(`Creative direction (from trend research — anchor the caption to this):`)
    lines.push(`- Angle: ${input.researchAngle}`)
    if (input.researchNotes) lines.push(`- Trend signal: ${input.researchNotes}`)
  }
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
      `RULES: name a real strain or format detail when it serves the line — do not force it. Emojis are welcome (1–4, used like punchlines, never carpet-bombed). The archetype determines the angle: Hot Take = confident opinion, Drop Announce = launch/restock energy, Hook = grabber, Question = open invitation to reply, Shoutout = thanks, Meme Line = group-chat one-liner.`,
    )
  } else {
    lines.push(
      `OUTPUT FORMAT — return only valid JSON with this exact shape (no markdown fences, no commentary):`,
    )
    lines.push(`{`)
    lines.push(`  "hook": "<one short, scroll-stopping line, ~6-14 words; refer to the flavor or strain when it fits the pillar; emojis welcome where they punchline>",`)
    lines.push(`  "caption": "<1-2 sentences MAX. Heavy on emojis (3-6 per caption is great, used as visual punchlines and beats — not carpet-bombed across every word). Light on punctuation — drop commas/periods when the line still reads. all-lowercase often hits harder than sentence case. Short, loud, goofy, silly, hype. Reference the flavor by name when it earns the line. No hashtags inline.>",`)
    lines.push(`  "hashtags": ["#spaceape", "#liveresin", "<3 more pillar-relevant tags, lowercase, no spaces>"]`)
    lines.push(`}`)
    lines.push('')
    lines.push(
      `RULES: 1-2 sentences is the ceiling — if you're writing a third sentence, cut. Hype + silly > polished. Mention the flavor by name when it serves the line; surface strain type or format only when it adds substance. Compliance voice still hedges effect language — for that mode, keep emojis tied to flavor/vibe (🍊 🍋 🛸 ✨), not effect claims.`,
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
