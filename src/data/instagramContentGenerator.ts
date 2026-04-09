import type { DayContent, DayOfWeek } from '../types'
import { instagramPosts } from './instagramAnalysis'
import {
  getFormatDistribution,
  getPillarDistribution,
} from './instagramUtils'

// Analyze the database to extract patterns
const formatDist = getFormatDistribution(instagramPosts)
const pillarDist = getPillarDistribution(instagramPosts)

// Build weighted pools from real data
const formatPool = formatDist.flatMap((f) =>
  Array(f.count).fill(f.label)
) as string[]

const pillarPool = pillarDist.flatMap((p) =>
  Array(p.count).fill(p.label)
) as string[]

const subcatsByPillar: Record<string, string[]> = {}
for (const post of instagramPosts) {
  if (!subcatsByPillar[post.contentPillar]) subcatsByPillar[post.contentPillar] = []
  if (!subcatsByPillar[post.contentPillar].includes(post.subcategory)) {
    subcatsByPillar[post.contentPillar].push(post.subcategory)
  }
}

// Add Bodega Boyz-inspired subcategories + Education pillar
const extraSubcats: Record<string, string[]> = {
  'Product Centric': ['New Drop Reveal', 'Hardware Feature', 'Flavor Breakdown'],
  'Lifestyle': ['Cultural Moment', 'Day In The Life'],
  'Entertainment': ['Hot Take', 'Would You Rather'],
  'Social Proof': ['Retail Partner Spotlight', 'First Timer Reaction'],
  'Brand Building': ['Founder Story', 'Quality Process', 'How It\'s Made'],
  'Education': ['Strain Education', 'Hardware Explainer', 'Live Resin Process', 'Dosing Guide'],
}
for (const [pillar, subcats] of Object.entries(extraSubcats)) {
  if (!subcatsByPillar[pillar]) subcatsByPillar[pillar] = []
  for (const s of subcats) {
    if (!subcatsByPillar[pillar].includes(s)) subcatsByPillar[pillar].push(s)
  }
}

// Format-pillar affinity weights — favor formats that historically perform well per pillar
const formatAffinityPool: Record<string, string[]> = {
  'Product Centric': [...Array(60).fill('Carousel'), ...Array(35).fill('Reel'), ...Array(5).fill('Single Image')],
  'Entertainment': [...Array(30).fill('Carousel'), ...Array(65).fill('Reel'), ...Array(5).fill('Single Image')],
  'Brand Building': [...Array(55).fill('Carousel'), ...Array(40).fill('Reel'), ...Array(5).fill('Single Image')],
  'Lifestyle': [...Array(45).fill('Carousel'), ...Array(50).fill('Reel'), ...Array(5).fill('Single Image')],
  'Social Proof': [...Array(45).fill('Carousel'), ...Array(50).fill('Reel'), ...Array(5).fill('Single Image')],
  'Education': [...Array(70).fill('Carousel'), ...Array(25).fill('Reel'), ...Array(5).fill('Single Image')],
}

// Add Education to pillar pool (~10% weight)
const educationEntries = Array(11).fill('Education')
const expandedPillarPool = [...pillarPool, ...educationEntries]

// Seeded pseudo-random for consistent output per day
function seededPick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

function hashDay(day: string, offset: number): number {
  // Include current ISO week number so content varies week-to-week
  const now = new Date()
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  let h = 0
  const key = day + weekNum
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return Math.abs(h + offset * 7919)
}

// Casual checklist instructions per format (4 items max for compact cards)
const formatChecklists: Record<string, string[][]> = {
  'Carousel': [
    ['5–10 slides, first slide = bold hook', 'Last slide = clear CTA', 'Minimal text per slide', 'Consistent color palette'],
    ['Tell a story across slides', 'Mix photos and text slides', 'End with a question or CTA', 'Design for saves'],
    ['Open with a hot take', 'One idea per slide', 'Use brand fonts/colors', 'Keep it under 10 slides'],
    ['Start with "stop scrolling" energy', 'Teach something per swipe', 'Alternate image + text', 'Close with a next step'],
  ],
  'Reel': [
    ['Hook in the first 1.5 seconds', 'Keep it under 30 seconds', 'Trending or upbeat audio', 'Text overlays for silent viewers'],
    ['Start with movement or action', 'Quick cuts every 2–3 seconds', 'Show product in use naturally', 'Match vibe to the audio'],
    ['Open with a bold statement', 'Jump cuts to keep pace', 'Good natural lighting', 'Encourage saves in caption'],
    ['Lead with the most visual moment', 'Smooth transitions', 'Subtitles throughout', 'End on something unexpected'],
  ],
  'Single Image': [
    ['One strong scroll-stopping visual', 'Clean composition, no clutter', 'Use brand colors in the shot', 'Longer caption to drive engagement'],
    ['Bold, simple, eye-catching', 'Product front and center', 'Pair with storytelling caption', 'Good lighting is key'],
    ['Billboard energy — one clear message', 'High contrast or vivid colors', 'Image does the talking', 'End caption with a CTA'],
  ],
}

// Education-specific checklists (added to format checklists dynamically)
const educationChecklists: Record<string, string[][]> = {
  'Carousel': [
    ['Slide 1 = question or myth', 'Break down the answer visually', 'End with a surprising fact', 'Design for saves and shares'],
    ['Start with what most people get wrong', 'One fact per slide', 'Use simple visuals', 'End with "now you know"'],
  ],
  'Reel': [
    ['Start with "most people don\'t know..."', 'Quick educational breakdown', 'Visual demo if possible', 'End with a mind-blown moment'],
    ['Open with a bold claim', 'Back it up in 15 seconds', 'Show don\'t tell', 'Save-worthy ending'],
  ],
  'Single Image': [
    ['One clear educational message', 'Infographic-style layout', 'Brand colors throughout', 'Caption does the deep dive'],
  ],
}

// Pillar-specific tone/vibe lines — Space Ape voice
const pillarVibes: Record<string, string[]> = {
  'Lifestyle': ['Vibe is everything — product is part of the scene not the whole scene', 'Future cool like seeing a lightsaber but make it a lifestyle', 'Fruity flavor forward, effortless energy'],
  'Product Centric': ['Zoom in on that hardware — it speaks for itself', 'Water resistant, fast charging, super cute — flex the specs', 'Show what makes this the best 2G in the game'],
  'Entertainment': ['No limit on boldness — if it\'s funny post it', 'Be the homie not the brand — talk like a group chat', 'Unhinged is on brand — clean Charlie Sheen energy'],
  'Social Proof': ['Show evidence of us winning — let the people talk', 'Proof is in the pull — real reactions only', 'The community does our marketing better than we do'],
  'Brand Building': ['Future of cannabis energy — we\'re going places', 'In our own lane like playing golf — nobody else is doing this', 'Built on quality that doesn\'t compromise — ever'],
  'Education': ['Teach them something they\'ll save and share', 'Make it cool to learn about cannabis', 'Be the homie who actually explains things'],
}

function buildDescription(format: string, pillar: string, seed: number): string {
  const baseChecklists = pillar === 'Education'
    ? (educationChecklists[format] || educationChecklists['Carousel'])
    : (formatChecklists[format] || formatChecklists['Carousel'])
  const checklist = seededPick(baseChecklists, seed)
  const vibes = pillarVibes[pillar] || pillarVibes['Lifestyle']
  const vibe = seededPick(vibes, seed + 5)

  // Replace last checklist item with the pillar vibe for variety
  const items = [...checklist]
  items[items.length - 1] = vibe
  return items.map((item) => `• ${item}`).join('\n')
}

const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const dayThemes: Record<DayOfWeek, string> = {
  Monday: 'Fresh Start',
  Tuesday: 'Engage & Educate',
  Wednesday: 'Mid-Week Push',
  Thursday: 'Throwback / Proof',
  Friday: 'Fun & Relatable',
  Saturday: 'Showcase',
  Sunday: 'Reflect & Plan',
}

function buildPost(seed: number) {
  // Pick pillar first (from expanded pool including Education), then use format-pillar affinity
  const pillar = seededPick(expandedPillarPool, seed + 3)
  const affinityPool = formatAffinityPool[pillar] || formatPool
  const format = seededPick(affinityPool, seed)
  const subcats = subcatsByPillar[pillar] || ['General']
  const subcategory = seededPick(subcats, seed + 7)

  return {
    platform: 'Instagram' as const,
    emoji: '📸',
    title: `${format} — ${pillar}: ${subcategory}`,
    description: buildDescription(format, pillar, seed + 11),
    contentType: format,
  }
}

// Each day gets 2 Instagram posts
export function generateWeeklyInstagramContent(): DayContent[] {
  return days.map((day) => {
    const items = [
      buildPost(hashDay(day, 0)),
      buildPost(hashDay(day, 1)),
    ]
    return { day, theme: dayThemes[day], items }
  })
}

export const weeklyInstagramContent = generateWeeklyInstagramContent()

// Generate a single random Instagram post (for shuffle/regenerate)
export function generateRandomPost() {
  return buildPost(Math.floor(Math.random() * 1000000))
}
