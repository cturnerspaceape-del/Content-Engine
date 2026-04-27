import type { CtaSectionData } from '../types'
import { escapeHtml, PALETTE } from './util'

export function renderCta(data: CtaSectionData): string {
  return `
    <tr>
      <td style="padding:32px 32px 36px;font-family:Helvetica,Arial,sans-serif;text-align:center;">
        <a href="${escapeHtml(data.url)}" class="cta-button" style="display:inline-block;background:${PALETTE.accent};color:${PALETTE.bg};font-size:15px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;padding:16px 32px;border-radius:999px;mso-padding-alt:0;">${escapeHtml(data.label)}</a>
        ${
          data.supporting
            ? `<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:${PALETTE.muted};">${escapeHtml(data.supporting)}</p>`
            : ''
        }
      </td>
    </tr>`
}
