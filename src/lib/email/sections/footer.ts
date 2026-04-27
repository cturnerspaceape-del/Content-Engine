import type { FooterSectionData } from '../types'
import { escapeHtml, PALETTE } from './util'

export function renderFooter(data: FooterSectionData): string {
  return `
    <tr>
      <td style="padding:28px 32px 36px;border-top:1px solid ${PALETTE.border};font-family:Helvetica,Arial,sans-serif;text-align:center;color:${PALETTE.muted};">
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${PALETTE.accent};margin-bottom:10px;">${escapeHtml(data.brand)}</div>
        <p style="margin:0;font-size:11px;line-height:1.6;">{{COMPANY_ADDRESS}}</p>
        <p style="margin:10px 0 0;font-size:11px;line-height:1.6;">
          <a href="{{UNSUBSCRIBE_URL}}" style="color:${PALETTE.muted};text-decoration:underline;">Unsubscribe</a>
          &nbsp;·&nbsp;
          <a href="{{PREFERENCES_URL}}" style="color:${PALETTE.muted};text-decoration:underline;">Manage preferences</a>
        </p>
      </td>
    </tr>`
}
