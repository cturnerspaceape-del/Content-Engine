import type { BenefitsSectionData } from '../types'
import { escapeHtml, PALETTE } from './util'

export function renderBenefits(data: BenefitsSectionData): string {
  const cells = data.bullets
    .map(
      (b) => `
      <td class="benefit-cell" valign="top" width="33%" style="padding:0 12px;font-family:Helvetica,Arial,sans-serif;text-align:center;">
        ${b.icon ? `<div style="font-size:28px;margin-bottom:10px;">${escapeHtml(b.icon)}</div>` : ''}
        <div style="font-size:14px;font-weight:700;color:${PALETTE.text};margin-bottom:6px;">${escapeHtml(b.label)}</div>
        <p style="margin:0;font-size:12px;line-height:1.5;color:${PALETTE.muted};">${escapeHtml(b.body)}</p>
      </td>`,
    )
    .join('')

  return `
    <tr>
      <td style="padding:32px 20px 4px;">
        ${
          data.title
            ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:${PALETTE.muted};text-align:center;margin-bottom:24px;">${escapeHtml(data.title)}</div>`
            : ''
        }
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr class="benefits-row">${cells}</tr>
        </table>
      </td>
    </tr>`
}
