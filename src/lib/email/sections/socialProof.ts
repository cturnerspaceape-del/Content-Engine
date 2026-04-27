import type { SocialProofSectionData } from '../types'
import { escapeHtml, PALETTE } from './util'

export function renderSocialProof(data: SocialProofSectionData): string {
  return `
    <tr>
      <td style="padding:32px 32px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PALETTE.panel};border:1px solid ${PALETTE.border};border-radius:18px;">
          <tr>
            <td style="padding:28px 28px 24px;font-family:Helvetica,Arial,sans-serif;text-align:center;">
              <div style="font-size:32px;color:${PALETTE.accent};line-height:1;margin-bottom:8px;">&ldquo;</div>
              <p style="margin:0;font-size:17px;line-height:1.5;color:${PALETTE.text};font-style:italic;">${escapeHtml(data.quote)}</p>
              <div style="margin-top:14px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.muted};">${escapeHtml(data.attribution)}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}
