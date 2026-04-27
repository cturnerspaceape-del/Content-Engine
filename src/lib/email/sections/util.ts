export function escapeHtml(input: unknown): string {
  if (input == null) return ''
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const PALETTE = {
  bg: '#0b0b0c',
  panel: '#161618',
  panelAlt: '#1f2024',
  border: '#2a2b30',
  accent: '#f59e0b',
  accentSoft: '#d97706',
  text: '#e5e7eb',
  muted: '#94a3b8',
  divider: '#27282d',
}
