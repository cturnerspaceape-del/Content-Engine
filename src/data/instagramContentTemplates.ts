import type { ContentItem, InstagramFormat } from '../types'
import { flavorNames } from '../remotion/flavorThemes'
import { pickShotTemplate } from './shotTemplates'
import { getCarouselArc, pickCarouselArc } from './carouselArcs'

// ─── Space Ape voice: cool, fun, hype, "clean Charlie Sheen", Supreme energy ───
// Hooks, captions, and hashtags picked independently for max variety

const hooks: Record<string, string[]> = {
  'Lifestyle': [
    'Future cool hits different when the flavor\'s this loud',
    'POV: this is what your morning routine was missing',
    'The vibe chose us and we said bet',
    'Main character energy powered by live resin',
    'Somewhere between a lightsaber and a lifestyle',
    'We don\'t chase vibes we set them',
    'The aesthetic wasn\'t planned it just happened',
    'Less noise more flavor more future',
    'This is what it looks like when the vibe is right',
    'Not for everyone and that\'s the whole point',
    'When the playlist and the pull hit at the same time',
    'This is the crossover nobody saw coming',
    'The culture is shifting and we\'re already there',
  ],
  'Product Centric': [
    'You asked. We delivered. Now zoom in on that hardware.',
    'Water resistant. Fast charging. Super cute. Questions?',
    'The 2G that\'s outselling everything in the game',
    'Zoom in. We dare you to find a flaw.',
    'Built different and we have the hardware to prove it',
    'This flavor profile doesn\'t exist anywhere else',
    'Unbox this and try not to flex it immediately',
    'Every angle hits. Every. Single. One.',
    'They tried to replicate this. Couldn\'t.',
    'Ultra premium live resin is not just a tagline',
    'New flavor just dropped and it\'s not what you expected',
    'Variable battery mode explained in 10 seconds',
    'The hardware breakdown nobody asked for but everyone needed',
    'Dropping soon. Set your alarms.',
    'Live resin vs distillate — here\'s why it matters',
  ],
  'Entertainment': [
    'The internet wasn\'t ready but we posted it anyway',
    'Zero regrets maximum chaos let\'s go',
    'Tag your friend who needs this intervention',
    'The algorithm finally did something right',
    'POV: the group chat after we dropped this',
    'We\'re legally required to be this unhinged',
    'This shouldn\'t slap this hard but here we are',
    'Tell us you get it without telling us you get it',
    'The internet didn\'t deserve this but it\'s too late',
    'No thoughts just vibes and live resin',
  ],
  'Social Proof': [
    'Don\'t take our word for it — take theirs',
    'This is what happens when people actually try it',
    'The DMs we wake up to every single morning',
    'We didn\'t pay for this review and it shows',
    'Real ones recognize real ones',
    'POV: hitting a Space Ape for the first time',
    'Our community keeps the receipts',
    'They said what they said and we\'re reposting it',
    'When the review writes itself you just screenshot it',
    'Proof is in the pull. Literally.',
    'POV: seeing Space Ape on the shelf for the first time',
    'Our retail partners keep telling us the same thing',
    'First pull reaction — the face says it all',
  ],
  'Brand Building': [
    'This brand is going places. New state debut loading.',
    'The future of cannabis looks like this',
    'Behind the product there\'s a team that doesn\'t sleep',
    'We didn\'t start this to blend in',
    'In our own lane like playing golf',
    'Why we do things different and won\'t apologize',
    'From a group chat to the best hardware in the game',
    'Built on late nights bold calls and better flavors',
    'We put our name on it because we\'re proud of it',
    'The mission is the same. The scale is different.',
    'Here\'s how we actually test every batch',
    'The founder\'s 2am text that started all of this',
    'From 3rd party lab to your hands — the quality chain',
    '10+ years in cannabis went into this one device',
  ],
  'Education': [
    'Live resin 101 — here\'s what makes it different',
    'Your battery has 3 modes and you\'re only using one',
    'Sativa vs Indica vs Hybrid — the real breakdown',
    'How we go from plant to pull in your pocket',
    'The difference between cheap and ultra premium explained',
    'What 3rd party lab testing actually means for you',
    'Fruity flavor isn\'t random — here\'s how we engineer it',
    'Why water resistant hardware actually matters',
    'The shelf life of live resin — what you need to know',
    '2G vs 4G — which one is right for you',
  ],
}

const captions: Record<string, string[]> = {
  'Lifestyle': [
    'Good light, good energy, and a 2G that just fits. Some moments you don\'t plan — you just let them happen.',
    'No filter needed. The flavor does the talking and the vibe does the rest. This is what we\'re about.',
    'It\'s not about being loud. It\'s about being right. Right flavor, right moment, right energy.',
    'The kind of moment that makes you stop scrolling and think "yeah, I want that." That\'s the whole playbook.',
    'Somewhere between golden hour and great flavor there\'s a whole lifestyle. Welcome to it.',
    'Not everything needs a caption. But since you\'re here — this is the future and it tastes incredible.',
    'Clean, intentional, effortless. That\'s the Space Ape lifestyle and we\'re not gatekeeping it.',
    'When the setting matches the strain and the strain matches the mood. That\'s the sweet spot right there.',
    'We don\'t do basic. We do ultra premium live resin with hardware that looks like it\'s from the future.',
    'The vibe is non-negotiable. The flavor is non-negotiable. Everything else is just details.',
  ],
  'Product Centric': [
    'Every angle. Every detail. The hardware is water resistant, fast charging, and honestly kind of cute. Swipe and see for yourself.',
    'We spent months getting this right. The formula, the hardware, the packaging. This isn\'t a product drop — it\'s a statement.',
    'Your DMs told us everything. This 2G is the one. Restocked and ready. Grab it before it\'s gone again.',
    'Closer. No, closer. When you see the hardware detail up close you understand why we took our time.',
    'We don\'t cut corners. Every Space Ape that ships has been tested, retested, and tested again. That\'s the standard.',
    'The colors weren\'t random. The flavor wasn\'t a guess. Everything you\'re looking at was designed with intention.',
    'First impressions matter. That\'s why the unbox hits as hard as the first pull. Swipe for the full reveal.',
    'There are vapes and then there are vapes you actually show off. This is firmly in the second category.',
    'Battery variable mode. Water resistant. Fast charging. Oh and it tastes like actual fruit. You\'re welcome.',
    'Ultra premium live resin isn\'t marketing. It\'s a standard we refuse to lower. Taste the difference.',
  ],
  'Entertainment': [
    'When the trend fits you don\'t fight it — you own it. We added our spin and honestly we might have peaked.',
    'Our team said "what if we just went for it" and here we are. Zero brand guidelines were harmed. Maybe a few.',
    'You know exactly who this is about. Tag them. Watch the chaos. We\'ll be in the comments.',
    'The algorithm has been suspiciously accurate lately. If this found you, the universe knew you needed it.',
    'We were going to post something professional. Then this happened. Content plan? Never heard of her.',
    'Sometimes you let the brand be unhinged. This is one of those times. Screenshot before we think twice.',
    'This was supposed to be an internal joke. Then someone hit post. It\'s outperforming our actual campaigns.',
    'Drop a comment if you relate. Drop a comment if you don\'t. We need the engagement and we\'re honest about it.',
    'We spent 30 minutes making this and 3 hours debating posting it. It\'s fine. Everything is fine. Enjoy.',
    'Hot take incoming. We stand by it. The comments are going to be wild and we\'re bringing snacks.',
  ],
  'Social Proof': [
    'Real people. Real pulls. Real reactions. We didn\'t script this. We just asked them to be honest and this is what came back.',
    'We could tell you all day but nothing hits like someone else\'s honest reaction. Swipe to the last slide.',
    'Our community does it better than we ever could. Tag us in your posts and you might be next.',
    'The best marketing is when a customer won\'t stop texting their friends about you. This is that energy.',
    'When someone DMs at 2am to say your product changed their whole routine, you screenshot that. This is that screenshot.',
    'We don\'t have to sell you. The people who tried it are doing that for us. Here\'s what they said — unfiltered.',
    'This isn\'t an ad. This is someone who spent their own money and told the internet about it. Best kind of review.',
    'Every time we think we\'ve seen the best customer content, someone raises the bar. This one stopped the whole team.',
    'Five stars but don\'t take our word for it. Swipe through. Real reviews from real people who actually tried it.',
    'Show evidence of us winning? Say less. Here\'s the evidence and it\'s all from you.',
  ],
  'Brand Building': [
    'Behind every product is a team that cares way too much. The late nights, the early mornings, the "one more revision" moments.',
    'Started as a napkin sketch and a group chat. Now it\'s the best hardware in the game. Thank you for growing with us.',
    'We\'re not here to play it safe. Bold ideas, real quality, and a community that keeps us honest. That\'s Space Ape.',
    'The team behind this doesn\'t sleep much. But when the product hits shelves and the feedback rolls in, every late night was worth it.',
    'Here\'s what you don\'t usually see. The prototypes that didn\'t make it. The ones that did. This is how it\'s actually built.',
    'We didn\'t start Space Ape to be another brand on the shelf. We started it to set a new standard. And we\'re not done.',
    'Growth looks different for every brand. For us it\'s not about being everywhere — it\'s about being unforgettable where we show up.',
    'We could take the safe route. We could follow everyone else\'s playbook. But that\'s never been how Space Ape operates.',
    'Ten plus years combined experience in cannabis. The knowledge went into every flavor, every device, every detail.',
    'The community we\'ve built matters more than any product we sell. Sounds wild for a brand to say but we mean it.',
  ],
  'Education': [
    'Live resin starts with flash-frozen flower harvested at peak. That\'s why the flavor hits different — nothing gets lost in the process.',
    'Your Space Ape has three battery modes. Low for flavor chasers, medium for the everyday, high for when you mean business. Now you know.',
    'Sativa for the daytime energy. Indica for the wind-down. Hybrid for the "I want both" crowd. Here\'s how to pick yours.',
    'From cultivation to extraction to your pocket. Every step is tested, tracked, and held to a standard most brands skip.',
    'The difference between cheap hardware and ours? Fast charging, water resistance, variable voltage, and a battery that actually lasts.',
    'Third party lab testing isn\'t optional for us. Every batch gets tested for potency, purity, and consistency before it ships.',
    'Fruity flavor in cannabis isn\'t just marketing. Terpene profiles are carefully selected and preserved through live resin extraction.',
    'Water resistant doesn\'t mean waterproof — but it means your device survives the stuff that kills the competition.',
    'Live resin keeps the full terpene profile intact. Distillate strips it out and adds it back artificially. That\'s the difference you taste.',
    '2G is the most popular vape segment in America and our best seller. 4G is for when you don\'t want to reup as often. Simple.',
  ],
}

const hashtagSets: Record<string, string[][]> = {
  'Lifestyle': [
    ['#spaceape', '#liveresin', '#vibes', '#aesthetic', '#futureofcannabis'],
    ['#spaceape', '#liveresin', '#morningroutine', '#lifestylecontent', '#cannabisculture'],
    ['#spaceape', '#ultrapremium', '#dailyvibe', '#cannabiscommunity', '#liveresinvape'],
    ['#spaceape', '#liveresin', '#goodvibes', '#vapecommunity', '#premiumcannabis'],
    ['#spaceape', '#liveresin', '#moodboard', '#effortlessstyle', '#cannabislifestyle'],
  ],
  'Product Centric': [
    ['#spaceape', '#liveresin', '#newdrop', '#vapehardware', '#ultrapremium'],
    ['#spaceape', '#liveresin', '#productdesign', '#2gvape', '#premiumvape'],
    ['#spaceape', '#liveresin', '#restocked', '#waterresistant', '#futureofcannabis'],
    ['#spaceape', '#liveresin', '#closeup', '#packaging', '#vapecommunity'],
    ['#spaceape', '#liveresin', '#unboxing', '#hardwaredesign', '#cannabisquality'],
  ],
  'Entertainment': [
    ['#spaceape', '#liveresin', '#trending', '#funny', '#vapecommunity'],
    ['#spaceape', '#liveresin', '#relatable', '#cannabismemes', '#viral'],
    ['#spaceape', '#liveresin', '#noregets', '#brandhumor', '#cannabisculture'],
    ['#spaceape', '#liveresin', '#tagafriend', '#comedy', '#futureofcannabis'],
    ['#spaceape', '#liveresin', '#hottake', '#unhinged', '#vapememes'],
  ],
  'Social Proof': [
    ['#spaceape', '#liveresin', '#reviews', '#socialproof', '#realresults'],
    ['#spaceape', '#liveresin', '#customerlove', '#honestreviews', '#vapecommunity'],
    ['#spaceape', '#liveresin', '#ugc', '#community', '#cannabisreviews'],
    ['#spaceape', '#liveresin', '#realtalk', '#customersfirst', '#premiumvape'],
    ['#spaceape', '#liveresin', '#happycustomers', '#proofisinthepull', '#ultrapremium'],
  ],
  'Brand Building': [
    ['#spaceape', '#liveresin', '#brandstory', '#futureofcannabis', '#behindthescenes'],
    ['#spaceape', '#liveresin', '#ourstory', '#cannabisindustry', '#buildingabrand'],
    ['#spaceape', '#liveresin', '#brandvalues', '#ultrapremium', '#missiondriven'],
    ['#spaceape', '#liveresin', '#teamwork', '#cannabisbrand', '#builtdifferent'],
    ['#spaceape', '#liveresin', '#transparency', '#qualityfirst', '#futureofcannabis'],
  ],
  'Education': [
    ['#spaceape', '#liveresin', '#cannabis101', '#liveresin101', '#knowyourvape'],
    ['#spaceape', '#liveresin', '#cannabiseducation', '#strainguide', '#vapetips'],
    ['#spaceape', '#liveresin', '#terpenes', '#liveresineducation', '#vapecommunity'],
    ['#spaceape', '#liveresin', '#hardwaretech', '#vapescience', '#premiumcannabis'],
    ['#spaceape', '#liveresin', '#didyouknow', '#cannabisfacts', '#futureofcannabis'],
  ],
}

// ─── Subcategory-specific overrides (fall back to pillar pool if not defined) ───

const subcategoryHooks: Record<string, string[]> = {
  'New Drop Reveal': [
    'New flavor alert. This one wasn\'t supposed to drop yet.',
    'Dropping in 3... 2... 1...',
    'The flavor you\'ve been requesting is finally here',
    'First look. Unreleased. You\'re seeing this before everyone.',
    'New drop just hit the shelves. Run don\'t walk.',
  ],
  'Hardware Feature': [
    'Let\'s talk about what\'s actually inside this device',
    '3 battery modes. Here\'s when to use each one.',
    'Water resistant test — would you try this?',
    'The charging speed that\'s making other brands nervous',
    'Hardware specs that actually matter explained',
  ],
  'Flavor Breakdown': [
    'Breaking down this flavor profile note by note',
    'The terpene breakdown on this one is wild',
    'Why this flavor hits different than everything else',
    'Fruity flavor engineered to perfection — here\'s how',
    'Flavor wheel: what you\'re tasting and why you love it',
  ],
  'Retail Partner Spotlight': [
    'Shoutout to the dispensary that moves the most Space Ape',
    'Walking into the shop and seeing our wall — different feeling',
    'Our retail partners are the reason you can get this',
    'The shelf presence is speaking for itself',
    'When the budtender recommends Space Ape first',
  ],
  'First Timer Reaction': [
    'Their face after the first pull said everything',
    'We handed someone a Space Ape for the first time',
    'First timer review — completely unscripted',
    'The moment they realized this isn\'t like other vapes',
    'New to Space Ape? This is what you\'re in for',
  ],
  'Founder Story': [
    'The 2am idea that started everything',
    'Most people don\'t know how Space Ape actually started',
    'From a group chat to multi-state — the real story',
    'The founder explains why quality is non-negotiable',
    'Behind every decision there\'s a reason. Here\'s ours.',
  ],
  'Quality Process': [
    'Here\'s exactly what happens before it ships',
    'Every batch gets tested. Here\'s the proof.',
    'The quality chain from plant to pocket',
    'Lab results are public. Here\'s why that matters.',
    'What most brands skip — we double down on',
  ],
  'How It\'s Made': [
    'From flower to your pocket — the full process',
    'Step by step: how ultra premium live resin is made',
    'The part of production nobody shows you',
    'Quality control isn\'t a step — it\'s every step',
    'Here\'s what goes into making something you\'re proud to hit',
  ],
  'Hot Take': [
    'Hot take: most vapes taste like chemicals',
    'Unpopular opinion and we\'re not backing down',
    'We said what we said. Come at us.',
    'This is going to start something in the comments',
    'The take nobody wanted but everybody needed',
  ],
  'Would You Rather': [
    'Would you rather: 2G pocket size or 4G marathon mode?',
    'Sativa morning or Indica evening? Choose wisely.',
    'Fruity flavor or classic strain taste? We know your answer.',
    'One flavor for life or a new one every week?',
    'Water resistant test or just take our word for it?',
  ],
  'Cultural Moment': [
    'When the playlist and the pull hit at the same time',
    'This is the crossover nobody saw coming',
    'The culture is shifting and we\'re already there',
    'Music festival essentials starting with this',
    'The collab between good taste and great flavor',
  ],
}

const subcategoryCaptions: Record<string, string[]> = {
  'New Drop Reveal': [
    'New flavor just entered the rotation. The name alone should tell you something. Available now at select dispensaries.',
    'We don\'t drop often but when we do, it\'s worth the wait. This one has been in development for months. It\'s here.',
    'The flavor R&D team went crazy on this one. First batch is limited. Once it\'s gone it\'s gone until the restock.',
    'Your rotation just got an upgrade. New flavor, same ultra premium live resin, same hardware that doesn\'t quit.',
    'They said we couldn\'t make a flavor this good in a 2G. They were wrong. See for yourself.',
  ],
  'Hardware Feature': [
    'Three battery modes because not every session is the same. Low for flavor, medium for balance, high for impact. You choose.',
    'Water resistant doesn\'t mean waterproof. But it means your device survives what kills the competition. Real-world tested.',
    'Fast charging means less waiting and more vibing. From zero to session-ready faster than you\'d expect.',
    'The battery life on this device is engineered to last. Variable voltage lets you dial in exactly what you want.',
    'Most brands don\'t talk about hardware because theirs isn\'t worth talking about. Ours is a different story.',
  ],
  'Retail Partner Spotlight': [
    'Our dispensary partners don\'t just stock Space Ape — they recommend it. When the budtender cosigns, you know it\'s real.',
    'Walking into a shop and seeing Space Ape on the shelf hits different when you know what went into getting it there.',
    'We work with retailers who care about quality as much as we do. This is a partnership, not just a purchase order.',
    'The best dispensaries in the game carry Space Ape. If yours doesn\'t, ask them why not.',
    'Shelf presence matters. But sell-through is what keeps us coming back. Shoutout to the partners who move product.',
  ],
  'First Timer Reaction': [
    'First-time reactions are our favorite content. Nobody expects the flavor to hit this hard. The face always gives it away.',
    'We love watching people try Space Ape for the first time. The "wait, really?" moment is always worth capturing.',
    'No script. No setup. Just someone trying ultra premium live resin for the first time and reacting honestly.',
    'The best marketing is the face someone makes on their first pull. We don\'t need to say anything else.',
    'Handed a Space Ape to someone who swore they had a favorite. They don\'t anymore.',
  ],
  'Founder Story': [
    'Combined 10+ years in cannabis went into building Space Ape. Every mistake, every win, every late night — it all added up.',
    'This started as a group chat between friends who thought they could build something better. Turns out they were right.',
    'The founder\'s rule: if you wouldn\'t use it yourself, don\'t ship it. That\'s why every product gets personal approval.',
    'From the jump, it was about setting a new standard. Not being another brand on the shelf. That hasn\'t changed.',
    'People ask what keeps us up at night. Ambition. The drive to evolve. The knowledge that we\'re just getting started.',
  ],
  'Quality Process': [
    'Every batch gets third-party lab tested for potency, purity, and consistency. No exceptions. No shortcuts. That\'s the standard.',
    'We source the highest quality partners, hardware, packaging, oil, and labor. "Good enough" doesn\'t exist here.',
    'From cultivation to extraction to packaging — every step is tracked and tested. This is what ultra premium means.',
    'Lab testing isn\'t optional for us. It\'s the foundation everything else is built on. Your trust matters more than our timeline.',
    'Quality is the one value we\'ll never compromise, even if it costs sales. That\'s straight from the founder.',
  ],
  'Hot Take': [
    'We said it. If your vape doesn\'t taste like actual fruit, what are you even doing? Live resin or leave.',
    'Most brands are competing on price. We\'re competing on quality. Different game entirely.',
    'The cannabis industry needs more brands that actually care about what they sell. We\'re trying to be one of them.',
    'If your hardware doesn\'t have variable voltage in 2026, you\'re behind. That\'s not opinion, that\'s just facts.',
    'Unpopular opinion: packaging matters as much as what\'s inside. If the brand doesn\'t care about the outside, imagine the inside.',
  ],
  'Would You Rather': [
    'The eternal debate. We make both sizes for a reason — different vibes call for different moves. What\'s yours?',
    'There\'s no wrong answer here but there might be a more right one. Drop your pick in the comments.',
    'Every session is different. That\'s why we give you options instead of telling you what to like.',
    'We asked the team. It was split 50/50. Now we\'re asking you. Choose your fighter.',
    'Some decisions are hard. This one should be fun. Tell us which side you\'re on.',
  ],
}

// ─── LLM caption fetch ───
//
// Captions are written by /api/generate-caption (Anthropic). This gives every
// post real product awareness — flavor name, strain type, format — and the
// right voice for the pillar. The static pools below remain as a fallback
// when the API is unavailable (no key set, network error, etc.).

interface FetchCaptionInput {
  pillar: string
  subcategory: string
  flavor: string
  researchAngle?: string
  researchNotes?: string
  platform?: 'IG' | 'X' | 'Threads' | 'TikTok' | 'YouTube Shorts'
  archetype?: string
}

interface FetchCaptionResult {
  hook: string
  caption: string
  hashtags: string[]
}

function pillarFallback(pillar: string, subcategory: string): FetchCaptionResult {
  const hookPool = subcategoryHooks[subcategory] || hooks[pillar] || hooks['Lifestyle']
  const captionPool = subcategoryCaptions[subcategory] || captions[pillar] || captions['Lifestyle']
  const hashtagPool = hashtagSets[pillar] || hashtagSets['Lifestyle']
  return {
    hook: hookPool[Math.floor(Math.random() * hookPool.length)],
    caption: captionPool[Math.floor(Math.random() * captionPool.length)],
    hashtags: hashtagPool[Math.floor(Math.random() * hashtagPool.length)],
  }
}

export async function fetchCaption(input: FetchCaptionInput): Promise<FetchCaptionResult> {
  try {
    const resp = await fetch('/api/generate-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pillar: input.pillar,
        subcategory: input.subcategory,
        flavor: input.flavor,
        platform: input.platform || 'IG',
        archetype: input.archetype,
        researchAngle: input.researchAngle,
        researchNotes: input.researchNotes,
      }),
    })
    if (!resp.ok) throw new Error(`/api/generate-caption ${resp.status}`)
    const data = (await resp.json()) as Partial<FetchCaptionResult> & { error?: string }
    if (data.error) throw new Error(data.error)
    if (!data.hook && !data.caption) throw new Error('caption response missing fields')
    // Hashtags: fall back to pillar pool if the LLM returned an empty array on
    // a long-form (IG) post — IG posts read better with a tag set.
    let hashtags = Array.isArray(data.hashtags) ? data.hashtags : []
    if (input.platform !== 'X' && input.platform !== 'Threads' && hashtags.length === 0) {
      hashtags = pillarFallback(input.pillar, input.subcategory).hashtags
    }
    return {
      hook: data.hook ?? data.caption ?? '',
      caption: data.caption ?? data.hook ?? '',
      hashtags,
    }
  } catch (err) {
    console.warn('[fetchCaption] falling back to static pool —', err)
    return pillarFallback(input.pillar, input.subcategory)
  }
}

export function generateContentForPost(item: ContentItem): ContentItem {
  const titleParts = item.title.split(' — ')
  const format = titleParts[0]?.trim() || 'Single Image'
  const pillarSubcat = titleParts[1] || ''
  const pillar = pillarSubcat.split(':')[0]?.trim() || 'Lifestyle'
  const subcategory = pillarSubcat.split(':')[1]?.trim() || ''

  // Subcategory-specific pools first, fall back to pillar
  const hookPool = subcategoryHooks[subcategory] || hooks[pillar] || hooks['Lifestyle']
  const captionPool = subcategoryCaptions[subcategory] || captions[pillar] || captions['Lifestyle']
  const hashtagPool = hashtagSets[pillar] || hashtagSets['Lifestyle']

  const hook = hookPool[Math.floor(Math.random() * hookPool.length)]
  const caption = captionPool[Math.floor(Math.random() * captionPool.length)]
  const selectedHashtags = hashtagPool[Math.floor(Math.random() * hashtagPool.length)]

  const generatedDescription = [
    hook,
    '',
    caption,
    '',
    selectedHashtags.join(' '),
  ].join('\n')

  const flavor = flavorNames[Math.floor(Math.random() * flavorNames.length)]

  // Single Image: pick a visual shot template (recipe) from src/data/shotTemplates.ts.
  // Carousel: keep the legacy numeric layoutTemplate variant system.
  const shotTemplateId = format === 'Single Image'
    ? pickShotTemplate(pillar, subcategory).id
    : undefined
  const layoutTemplate = format === 'Carousel'
    ? Math.floor(Math.random() * 8) + 1
    : undefined
  const slideCount = format === 'Carousel'
    ? Math.floor(Math.random() * 6) + 5
    : undefined

  return {
    ...item,
    description: generatedDescription,
    generated: true,
    generatedVisual: {
      hook,
      caption,
      hashtags: selectedHashtags,
      pillar,
      subcategory,
      format: format as InstagramFormat,
      flavor,
      ...(layoutTemplate !== undefined && { layoutTemplate }),
      ...(shotTemplateId !== undefined && { shotTemplateId }),
      ...(slideCount !== undefined && { slideCount }),
    },
  }
}

// Async LLM-backed variant of generateContentForPost. Used by ImageLab to get
// captions that are flavor- and strain-aware. Falls back to the static pool
// inside fetchCaption when the API is unavailable.
export interface ResearchContext {
  angle?: string
  notes?: string
  // Executable photo brief from the picked seed. Visual-only — only used by
  // generate-single-image / generate-carousel-slide; caption gen ignores it.
  shotBrief?: string
  // Trend URLs picked from the research seed. Server-side, /api/generate-*
  // resolves these to images and uses them as inspo refs.
  sourceUrls?: string[]
  sourceImageUrls?: string[]
  // Carousel-only: per-slide briefs from the selected research result.
  // When present, the carousel arc length AND per-slide prompts come from
  // research, superseding the static carouselArcs.ts template.
  slides?: { brief: string }[]
}

export async function generateContentForPostAsync(
  item: ContentItem,
  research?: ResearchContext,
): Promise<ContentItem> {
  const titleParts = item.title.split(' — ')
  const format = titleParts[0]?.trim() || 'Single Image'
  const pillarSubcat = titleParts[1] || ''
  const pillar = pillarSubcat.split(':')[0]?.trim() || 'Lifestyle'
  const subcategory = pillarSubcat.split(':')[1]?.trim() || ''

  const flavor = flavorNames[Math.floor(Math.random() * flavorNames.length)]
  const { hook, caption, hashtags: selectedHashtags } = await fetchCaption({
    pillar,
    subcategory,
    flavor,
    platform: 'IG',
    researchAngle: research?.angle,
    researchNotes: research?.notes,
  })

  const generatedDescription = [hook, '', caption, '', selectedHashtags.join(' ')].join('\n')

  // Single Image with a research brief flies on the brief alone — no random
  // shot template, since the brief is the authoritative visual recipe.
  const shotTemplateId = format === 'Single Image' && !research?.shotBrief
    ? pickShotTemplate(pillar, subcategory).id
    : undefined
  const layoutTemplate = format === 'Carousel'
    ? Math.floor(Math.random() * 8) + 1
    : undefined
  const slideCount = format === 'Carousel'
    ? Math.floor(Math.random() * 6) + 5
    : undefined

  return {
    ...item,
    description: generatedDescription,
    generated: true,
    generatedVisual: {
      hook,
      caption,
      hashtags: selectedHashtags,
      pillar,
      subcategory,
      format: format as InstagramFormat,
      flavor,
      ...(layoutTemplate !== undefined && { layoutTemplate }),
      ...(shotTemplateId !== undefined && { shotTemplateId }),
      ...(slideCount !== undefined && { slideCount }),
      ...(research?.angle ? { researchAngle: research.angle } : {}),
      ...(research?.notes ? { researchNotes: research.notes } : {}),
      ...(research?.shotBrief ? { researchShotBrief: research.shotBrief } : {}),
      ...(research?.sourceUrls?.length ? { researchSourceUrls: research.sourceUrls } : {}),
      ...(research?.sourceImageUrls?.length
        ? { researchSourceImageUrls: research.sourceImageUrls }
        : {}),
    },
  }
}

// Carousel Lounge variant: produces an AI-image carousel (3–5 slides). The
// presence of `arcId` on generatedVisual tells ContentCard to render with
// CarouselLoungeVisual (per-slide Gemini calls) instead of the Remotion
// template carousel.
export function generateCarouselLoungePost(item: ContentItem, arcId?: string): ContentItem {
  const titleParts = item.title.split(' — ')
  const pillarSubcat = titleParts[1] || ''
  const pillar = pillarSubcat.split(':')[0]?.trim() || 'Product Centric'
  const subcategory = pillarSubcat.split(':')[1]?.trim() || ''

  const hookPool = subcategoryHooks[subcategory] || hooks[pillar] || hooks['Lifestyle']
  const captionPool = subcategoryCaptions[subcategory] || captions[pillar] || captions['Lifestyle']
  const hashtagPool = hashtagSets[pillar] || hashtagSets['Lifestyle']

  const hook = hookPool[Math.floor(Math.random() * hookPool.length)]
  const caption = captionPool[Math.floor(Math.random() * captionPool.length)]
  const selectedHashtags = hashtagPool[Math.floor(Math.random() * hashtagPool.length)]

  const arc = (arcId && getCarouselArc(arcId)) || pickCarouselArc(pillar, subcategory)

  const flavor = flavorNames[Math.floor(Math.random() * flavorNames.length)]
  const carouselSeed = Math.floor(Math.random() * 100_000)

  const generatedDescription = [hook, '', caption, '', selectedHashtags.join(' ')].join('\n')

  return {
    ...item,
    description: generatedDescription,
    generated: true,
    generatedVisual: {
      hook,
      caption,
      hashtags: selectedHashtags,
      pillar,
      subcategory,
      format: 'Carousel' as InstagramFormat,
      flavor,
      slideCount: arc.slides.length,
      arcId: arc.id,
      carouselSeed,
    },
  }
}

export async function generateCarouselLoungePostAsync(
  item: ContentItem,
  arcId?: string,
  research?: ResearchContext,
): Promise<ContentItem> {
  const titleParts = item.title.split(' — ')
  const pillarSubcat = titleParts[1] || ''
  const pillar = pillarSubcat.split(':')[0]?.trim() || 'Product Centric'
  const subcategory = pillarSubcat.split(':')[1]?.trim() || ''

  // Research-driven path: when the selected seed carries per-slide briefs,
  // they define both slide count and per-slide content. Otherwise fall back
  // to the static arc lookup.
  const researchSlides = research?.slides && research.slides.length >= 2
    ? research.slides.slice(0, 7)
    : null
  const arc = (arcId && getCarouselArc(arcId)) || pickCarouselArc(pillar, subcategory)
  const slideCount = researchSlides ? researchSlides.length : arc.slides.length
  const flavor = flavorNames[Math.floor(Math.random() * flavorNames.length)]
  const carouselSeed = Math.floor(Math.random() * 100_000)

  const { hook, caption, hashtags: selectedHashtags } = await fetchCaption({
    pillar,
    subcategory,
    flavor,
    platform: 'IG',
    researchAngle: research?.angle,
    researchNotes: research?.notes,
  })

  const generatedDescription = [hook, '', caption, '', selectedHashtags.join(' ')].join('\n')

  return {
    ...item,
    description: generatedDescription,
    generated: true,
    generatedVisual: {
      hook,
      caption,
      hashtags: selectedHashtags,
      pillar,
      subcategory,
      format: 'Carousel' as InstagramFormat,
      flavor,
      slideCount,
      arcId: arc.id,
      carouselSeed,
      ...(research?.angle ? { researchAngle: research.angle } : {}),
      ...(research?.notes ? { researchNotes: research.notes } : {}),
      ...(research?.shotBrief ? { researchShotBrief: research.shotBrief } : {}),
      ...(research?.sourceUrls?.length ? { researchSourceUrls: research.sourceUrls } : {}),
      ...(research?.sourceImageUrls?.length
        ? { researchSourceImageUrls: research.sourceImageUrls }
        : {}),
      ...(researchSlides ? { researchSlides } : {}),
    },
  }
}

