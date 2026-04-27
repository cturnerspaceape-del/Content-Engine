// Cross-platform text archetypes. Each archetype is a tone/intent that any
// text-capable platform (X, Threads, Email) can render in its own format.
// The archetype is the *unifying axis*; per-platform tuners apply char limits,
// hashtag policy, and structural fields (e.g. Email subject + body) on top.

export const TEXT_ARCHETYPES = [
  'Hot Take',
  'Drop Announce',
  'Hook',
  'Question',
  'Shoutout',
  'Meme Line',
  'Newsletter',
  'Welcome',
  'Re-engagement',
] as const

export type TextArchetype = (typeof TEXT_ARCHETYPES)[number]

// Some archetypes are short-form only (X/Threads). Others (Newsletter,
// Welcome, Re-engagement) only make sense as long-form Email. The Lab
// uses this to grey out non-applicable platforms in the picker.
export const ARCHETYPE_PLATFORM_COMPAT: Record<TextArchetype, ReadonlyArray<'X' | 'Threads' | 'Email'>> = {
  'Hot Take': ['X', 'Threads', 'Email'],
  'Drop Announce': ['X', 'Threads', 'Email'],
  Hook: ['X', 'Threads', 'Email'],
  Question: ['X', 'Threads'],
  Shoutout: ['X', 'Threads', 'Email'],
  'Meme Line': ['X', 'Threads'],
  Newsletter: ['Email'],
  Welcome: ['Email'],
  'Re-engagement': ['Email'],
}

export function archetypeFromTitle(title: string, fallback: TextArchetype = 'Hot Take'): TextArchetype {
  // Title format: "<Prefix> — <Archetype>" — split on the em-dash.
  const parts = title.split(' — ')
  const tail = parts[1]?.trim()
  if (tail && (TEXT_ARCHETYPES as readonly string[]).includes(tail)) {
    return tail as TextArchetype
  }
  return fallback
}

export function pickDifferentArchetypeIdx(current: number): number {
  if (TEXT_ARCHETYPES.length <= 1) return 0
  let next = Math.floor(Math.random() * TEXT_ARCHETYPES.length)
  while (next === current) next = Math.floor(Math.random() * TEXT_ARCHETYPES.length)
  return next
}
