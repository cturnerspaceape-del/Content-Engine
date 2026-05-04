export function escapeHtml(input: unknown): string {
  if (input == null) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Palette mirrors thespaceape.com light surfaces with the brand blue
// (#0D7FF7) as the primary accent and cosmic indigo as the body ink.
export const PALETTE = {
  bg: '#F7F8F8',
  panel: '#FFFFFF',
  panelAlt: '#EEF4FF',
  border: '#D8E2EE',
  accent: '#0D7FF7',
  accentSoft: '#0A5FBF',
  text: '#1E1B4B',
  muted: '#6B7280',
  divider: '#E5EAF2',
  onAccent: '#FFFFFF',
}
