// Cross-platform text archetypes. Each archetype is a tone/intent that
// X and Threads can render in their own format. Per-platform tuners
// apply char limits and hashtag policy on top.

export const TEXT_ARCHETYPES = [
  'Hot Take',
  'Drop Announce',
  'Hook',
  'Question',
  'Shoutout',
  'Meme Line',
] as const

export type TextArchetype = (typeof TEXT_ARCHETYPES)[number]

// All current archetypes are X + Threads compatible. Kept as a record
// (rather than dropping it) so the Lab's picker logic doesn't need to
// special-case "no constraint" — and so adding a future archetype with
// platform restrictions stays backward-compatible.
export const ARCHETYPE_PLATFORM_COMPAT: Record<TextArchetype, ReadonlyArray<'X' | 'Threads'>> = {
  'Hot Take': ['X', 'Threads'],
  'Drop Announce': ['X', 'Threads'],
  Hook: ['X', 'Threads'],
  Question: ['X', 'Threads'],
  Shoutout: ['X', 'Threads'],
  'Meme Line': ['X', 'Threads'],
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
