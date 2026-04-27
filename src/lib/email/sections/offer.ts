import type { OfferSectionData } from '../types'
import { escapeHtml, PALETTE } from './util'

export function renderOffer(data: OfferSectionData): string {
  return `
    <tr>
      <td style="padding:28px 32px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PALETTE.panel};border:1px solid ${PALETTE.accent};border-radius:18px;">
          <tr>
            <td style="padding:28px 28px 26px;font-family:Helvetica,Arial,sans-serif;text-align:center;">
              ${
                data.badge
                  ? `<div style="display:inline-block;background:${PALETTE.accent};color:${PALETTE.bg};font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;padding:6px 12px;border-radius:999px;margin-bottom:14px;">${escapeHtml(data.badge)}</div>`
                  : ''
              }
              <div style="font-size:24px;font-weight:800;color:${PALETTE.text};line-height:1.2;">${escapeHtml(data.title)}</div>
              <p style="margin:10px 0 0;font-size:15px;line-height:1.55;color:${PALETTE.muted};">${escapeHtml(data.body)}</p>
              ${
                data.fineprint
                  ? `<p style="margin:14px 0 0;font-size:11px;line-height:1.5;color:${PALETTE.muted};opacity:0.7;">${escapeHtml(data.fineprint)}</p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}
