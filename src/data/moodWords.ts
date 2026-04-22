// Keyword-based mood extractor. Zero API calls.
// Given a hook/caption/pillar/subcategory, returns 2-3 lowercase mood adjectives
// that Nano Banana can visualize without being derailed by the raw hook language.

import type { ContentPillar } from '../types'

// ─── Keyword dictionary ───
// Case-insensitive substring match. When multiple phrases match, we take the first
// 2-3 unique adjectives in declaration order, so earlier/more specific entries win.

const PHRASE_MOODS: Array<{ match: RegExp; moods: string[] }> = [
  // Time of day
  { match: /\b(morning|dawn|wake|sunrise)\b/i, moods: ['soft', 'dawn-lit', 'calm'] },
  { match: /\b(evening|dusk|sunset|golden hour)\b/i, moods: ['warm', 'golden', 'cinematic'] },
  { match: /\b(night|midnight|late)\b/i, moods: ['moody', 'nocturnal', 'cinematic'] },

  // Weather / setting
  { match: /\b(beach|pool|summer|sun)\b/i, moods: ['bright', 'sun-lit', 'airy'] },
  { match: /\b(rain|storm|cloud|fog|mist)\b/i, moods: ['atmospheric', 'moody', 'soft'] },
  { match: /\b(festival|show|concert|club|crowd)\b/i, moods: ['energetic', 'kinetic', 'electric'] },

  // Product/launch language
  { match: /\b(drop|drops|dropping|launch|release|new)\b/i, moods: ['fresh', 'hype', 'anticipatory'] },
  { match: /\b(restock|restocked|back)\b/i, moods: ['confident', 'returning', 'proud'] },

  // Hardware/craft
  { match: /\b(hardware|design|engineer|spec|detail)\b/i, moods: ['precise', 'crafted', 'premium'] },
  { match: /\b(quality|tested|lab|craft)\b/i, moods: ['premium', 'considered', 'trustworthy'] },
  { match: /\b(made|process|recipe|how it)\b/i, moods: ['artisanal', 'intentional', 'honest'] },

  // Flavor language
  { match: /\b(flavor|terpene|fruit|taste|juicy)\b/i, moods: ['vivid', 'saturated', 'appetizing'] },
  { match: /\b(splash|burst|pop|loud)\b/i, moods: ['energetic', 'dynamic', 'bold'] },

  // Social / community
  { match: /\b(community|review|real|honest|pov)\b/i, moods: ['authentic', 'warm', 'human'] },
  { match: /\b(first|first-time|never|try)\b/i, moods: ['curious', 'discovery', 'fresh'] },
  { match: /\b(shop|shelf|dispensary|retail)\b/i, moods: ['confident', 'proud', 'arrived'] },

  // Brand / founder
  { match: /\b(founder|story|behind|late nights|mission)\b/i, moods: ['intimate', 'candid', 'intentional'] },
  { match: /\b(future|next|ahead|loading)\b/i, moods: ['forward', 'ambitious', 'bold'] },

  // Attitude
  { match: /\b(bet|vibe|mood|energy)\b/i, moods: ['confident', 'effortless', 'cool'] },
  { match: /\b(flex|premium|ultra)\b/i, moods: ['premium', 'confident', 'glossy'] },
  { match: /\b(chaos|unhinged|wild|crazy)\b/i, moods: ['playful', 'bold', 'kinetic'] },
  { match: /\b(funny|meme|relate|joke)\b/i, moods: ['playful', 'cheeky', 'warm'] },
  { match: /\b(calm|quiet|slow|still)\b/i, moods: ['calm', 'quiet', 'meditative'] },
  { match: /\b(clean|simple|minimal|effortless)\b/i, moods: ['clean', 'minimal', 'composed'] },
]

// ─── Pillar fallback ───
// One adjective per pillar, always appended if not already present.
// Guarantees we never return fewer than one mood word.

const PILLAR_MOODS: Record<ContentPillar, string> = {
  'Lifestyle': 'aspirational',
  'Product Centric': 'premium',
  'Entertainment': 'playful',
  'Social Proof': 'authentic',
  'Brand Building': 'confident',
  'Education': 'considered',
}

// ─── Public API ───

export function extractMoodWords(
  hook: string,
  caption: string,
  pillar: string,
  subcategory: string,
): string[] {
  const haystack = `${hook}\n${caption}\n${subcategory}`
  const collected: string[] = []

  for (const entry of PHRASE_MOODS) {
    if (entry.match.test(haystack)) {
      for (const m of entry.moods) {
        if (!collected.includes(m)) collected.push(m)
        if (collected.length >= 3) break
      }
    }
    if (collected.length >= 3) break
  }

  // Pillar fallback so we always have at least one mood.
  const pillarMood = PILLAR_MOODS[pillar as ContentPillar] ?? 'premium'
  if (!collected.includes(pillarMood)) collected.unshift(pillarMood)

  return collected.slice(0, 3)
}
