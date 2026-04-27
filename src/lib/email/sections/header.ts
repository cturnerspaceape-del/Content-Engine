import type { HeaderSectionData } from '../types'
import { escapeHtml, PALETTE } from './util'

export function renderHeader(data: HeaderSectionData): string {
  return `
    <tr>
      <td style="padding:28px 32px 18px;border-bottom:1px solid ${PALETTE.border};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.accent};">
              ${escapeHtml(data.brand)}
            </td>
            ${
              data.tagline
                ? `<td align="right" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:${PALETTE.muted};">${escapeHtml(data.tagline)}</td>`
                : ''
            }
          </tr>
        </table>
      </td>
    </tr>`
}
