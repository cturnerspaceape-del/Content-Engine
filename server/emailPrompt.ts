// Composes the prompt fed into Gemini to generate a fully structured
// lifecycle email (subject + preheader + ordered sections). Mirrors the
// structure of buildPrompt() for image generation: brand bible up front,
// then context-specific guidance, then a hard JSON shape contract.

interface BuildEmailPromptInput {
  emailType: string
  emailTypeLabel: string
  emailTypeIntent: string
  audience: 'existing' | 'inactive'
  audienceLabel: string
  audienceTone: string
  audienceCtaStyle: string
  defaultSections: readonly string[]
  flavorHint?: string
  campaignNote?: string
  flavorCatalog?: ReadonlyArray<{
    name: string
    strainType: string
    format: string
    flavorNotes?: readonly string[]
  }>
}

const BRAND_BIBLE = `Space Ape is a premium cannabis live-resin vape brand selling primarily through B2B retail (dispensaries / smoke shops). Email is the formal, professional channel — read like a measured note from a premium brand to a retail buyer who runs a real business. Confident and direct without slang. Complete sentences, sentence case, conventional grammar. Concise and scannable. No emojis in body copy (icons in benefit bullets are ok by design). Never apologetic, never bro-y, never youthful-social-copy energy. Never invent product specs, prices, or claims that don't exist. No third-party brand mentions. No social-media slang ("vibe", "drop the link", "y'all", etc.) — save that for the IG/X/Threads channels.`

export function buildEmailPrompt(input: BuildEmailPromptInput): string {
  const sections: string[] = []

  sections.push(
    `GOAL: Write a complete lifecycle marketing email for Space Ape. Email type: ${input.emailTypeLabel} (${input.emailType}). Audience: ${input.audienceLabel} (${input.audience}).`,
  )

  sections.push(`BRAND BIBLE:\n${BRAND_BIBLE}`)

  sections.push(`EMAIL TYPE INTENT:\n${input.emailTypeIntent}`)

  sections.push(`AUDIENCE TONE:\n${input.audienceTone}`)
  sections.push(`AUDIENCE CTA STYLE:\n${input.audienceCtaStyle}`)

  if (input.flavorCatalog && input.flavorCatalog.length > 0) {
    const catalogLines = input.flavorCatalog
      .map((f) => {
        const notes = f.flavorNotes && f.flavorNotes.length > 0 ? ` — ${f.flavorNotes.join(', ')}` : ''
        return `- ${f.name} — ${f.strainType}, ${f.format}${notes}`
      })
      .join('\n')
    sections.push(
      `PRODUCT CATALOG (the ONLY strain/flavor names you may reference — copy names verbatim, case-sensitive):\n${catalogLines}`,
    )
  }

  if (input.flavorHint) {
    sections.push(
      `FEATURED FLAVOR HINT: ${input.flavorHint} — feature this flavor only if it matches a name in the PRODUCT CATALOG; otherwise ignore the hint and choose a catalog flavor that fits the email type.`,
    )
  }
  if (input.campaignNote) sections.push(`CAMPAIGN NOTE FROM USER:\n${input.campaignNote}`)

  sections.push(
    `REQUIRED SECTION ORDER (use exactly these section kinds in this order; do not add or omit):\n${input.defaultSections.join(' → ')}`,
  )

  sections.push(`OUTPUT FORMAT — return STRICT JSON, no prose, matching this TypeScript shape:

{
  "subject": string,           // <= 60 chars, sentence case, professional and direct (no all-lowercase, no caps storms, no emojis)
  "preheader": string,         // 35-90 chars, complements the subject (don't repeat it)
  "sections": Array<{
    "kind": "header" | "hero" | "offer" | "product" | "benefits" | "social_proof" | "cta" | "footer",
    "data": object             // shape depends on kind, see below
  }>
}

SECTION DATA SHAPES:
- header:        { "brand": "Space Ape", "tagline"?: string }   // tagline is short, e.g. "Live resin, full bloom"
- hero:          { "eyebrow"?: string, "headline": string, "subhead"?: string, "imagePrompt": string }
                  // headline is short and bold (3-7 words). imagePrompt is a 1-sentence visual brief
                  // for a Space Ape hero shot — describe scene/mood/flavor cues but DO NOT include
                  // text-to-render. The image renderer will produce a brand-accurate photoreal still.
- offer:         { "badge"?: string, "title": string, "body": string, "fineprint"?: string }
- product:       { "title"?: string, "cells": Array<{ "name": string, "blurb": string, "imagePrompt": string }> }
                  // 1-3 cells. Each blurb is 1 short sentence. imagePrompt 1 sentence.
- benefits:      { "title"?: string, "bullets": Array<{ "icon"?: string, "label": string, "body": string }> }
                  // exactly 3 bullets. icon is a single emoji. label is 2-4 words. body is 1 short sentence.
- social_proof:  { "quote": string, "attribution": string }     // quote 1-2 sentences. attribution = retailer name + city OR similar.
- cta:           { "label": string, "url": string, "supporting"?: string }
                  // label is 2-4 words, ALL CAPS not required. url use https://spaceape.com or a relevant path.
- footer:        { "brand": "Space Ape" }                       // legal/unsub injected separately at render time

HARD CONSTRAINTS:
  - Return ONLY the JSON object. No markdown fences, no commentary.
  - No invented prices, percentages off, or specific dates unless the user supplies them.
  - Any strain or flavor name appearing anywhere in the email (subject, preheader, hero, offer, product cells, social_proof quote — anywhere) MUST be copied verbatim from the PRODUCT CATALOG above. Do not invent, abbreviate, or rephrase strain names. If you can't fit a real strain name, omit the reference rather than fabricate one.
  - No third-party brand mentions.
  - Match the audience tone exactly — "existing" reads confident; "inactive" reads warm and low-pressure.
  - No slang, no caps for emphasis, no exclamation points outside of the offer line. Treat the reader as a professional retail buyer.
  - Image prompts MUST describe visuals only (composition, lighting, mood, flavor color cues). Never request text/words/logos in the image.
  - Keep all copy concise and scannable. Long paragraphs lose readers.`)

  return sections.join('\n\n')
}
