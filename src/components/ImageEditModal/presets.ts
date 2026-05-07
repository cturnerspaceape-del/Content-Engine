export interface PresetChip {
  emoji: string
  label: string
  prompt: string
}

export const PRESETS: ReadonlyArray<PresetChip> = [
  { emoji: '🌞', label: 'Brighter', prompt: 'increase brightness and exposure, lift the shadows slightly' },
  { emoji: '✨', label: 'More vivid', prompt: 'boost color saturation and vibrance, richer tones, more punchy' },
  { emoji: '🎬', label: 'Cinematic', prompt: 'cinematic color grade, slight teal-and-orange split, deeper blacks, filmic contrast' },
  { emoji: '🌫️', label: 'Softer', prompt: 'soften the lighting, reduce contrast, dreamier and more diffuse' },
  { emoji: '📸', label: 'Sharper', prompt: 'sharpen details and texture, crisper edges, more in-focus' },
  { emoji: '🌃', label: 'Night mode', prompt: 'shift to a nighttime scene with neon-leaning lighting, keep subject identical' },
]
