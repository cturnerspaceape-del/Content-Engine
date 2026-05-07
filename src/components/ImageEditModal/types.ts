// Mirrors the server-side types in server/openaiImage.ts. Kept duplicated
// rather than imported across the server/client boundary so the bundler
// doesn't try to pull node-only modules into the React build.

export type ImageSize = '1024x1024' | '1024x1536' | '1536x1024'
export type ImageQuality = 'auto' | 'low' | 'medium' | 'high'
export type ImageBackground = 'auto' | 'opaque' | 'transparent'
export type ImageOutputFormat = 'png' | 'jpeg' | 'webp'
export type ImageInputFidelity = 'low' | 'high'

export interface UserRef {
  mime: string
  base64: string
  // Local data URL kept for thumbnail rendering — not sent to the server.
  previewUrl: string
}

export interface AdvancedSettings {
  quality: ImageQuality
  background: ImageBackground
  fidelity: ImageInputFidelity
  outputFormat: ImageOutputFormat
  outputCompression: number
}

export const DEFAULT_ADVANCED: AdvancedSettings = {
  quality: 'auto',
  background: 'auto',
  fidelity: 'high',
  outputFormat: 'png',
  outputCompression: 90,
}
