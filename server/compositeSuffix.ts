// Shared "how to use the picked reference images" instruction appended to
// every image-gen prompt. Three tiers based on what the picker chose:
//   - product ref + (optional) brand ref → strict device anchor + brand weave
//   - brand ref(s) only                  → free composite into the scene
//   - no refs                            → no suffix
//
// The user's intent: when the prompt cues a vape/packaging/Space Ape brand
// scene, weave the brand visual in as the model sees fit. Lets the model
// decide placement (subject, packaging, signage, palette anchor) instead of
// dictating a single role.

export function buildCompositeSuffix(pickedKeys: string[]): string {
  if (pickedKeys.length === 0) return ''

  const hasProductRef = pickedKeys.some((k) => k.startsWith('product/'))
  const hasBrandRef = pickedKeys.some((k) => k.startsWith('brand/') || k.startsWith('inspo/'))

  const productClause =
    'Use the product reference image above as a strict visual anchor for the vape device — match its exact shape, label artwork, color, and graphics. Do not invent a different device.'
  const brandClause =
    'The remaining reference image(s) above are Space Ape brand visuals. Weave them naturally into the scene where they belong: as a vape product on the surface, packaging in-frame, signage in the background, a brand-styled object, or — if the scene has no obvious slot — let them anchor the lighting, palette, and overall styling. You decide the most natural placement.'
  const sceneClause =
    'The prompt above describes the scene to render.'

  if (hasProductRef && hasBrandRef) {
    return `\n\n${sceneClause} ${productClause} ${brandClause}`
  }
  if (hasProductRef) {
    return `\n\n${sceneClause} ${productClause}`
  }
  // Brand-only path — the dominant case after picker rules update.
  return `\n\n${sceneClause} ${brandClause}`
}
