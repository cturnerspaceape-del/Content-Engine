export const formatColors: Record<string, string> = {
  'Carousel': '#a855f7',
  'Reel': '#ec4899',
  'Single Image': '#3b82f6',
}

// Gradient pairs for mock visuals
export const gradientSets = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
]

export function pickGradient(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return gradientSets[Math.abs(h) % gradientSets.length]
}
