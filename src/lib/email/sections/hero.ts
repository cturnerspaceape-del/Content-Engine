import type { HeroSectionData } from '../types'
import { escapeHtml, PALETTE } from './util'

export function renderHero(data: HeroSectionData): string {
  const imageBlock = data.imageUrl
    ? `<img src="${escapeHtml(data.imageUrl)}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;" />`
    : `<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,${PALETTE.panel},${PALETTE.panelAlt});display:flex;align-items:center;justify-content:center;color:${PALETTE.muted};font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;">${
        data.imageError ? '⚠️ image error' : '◌ image pending'
      }</div>`

  return `
    <tr>
      <td style="padding:0;">
        ${imageBlock}
      </td>
    </tr>
    <tr>
      <td style="padding:32px 32px 8px;font-family:Helvetica,Arial,sans-serif;text-align:center;">
        ${
          data.eyebrow
            ? `<div style="font-size:11px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:${PALETTE.accent};margin-bottom:14px;">${escapeHtml(data.eyebrow)}</div>`
            : ''
        }
        <h1 style="margin:0;font-size:36px;line-height:1.1;font-weight:800;color:${PALETTE.text};letter-spacing:-0.01em;">${escapeHtml(data.headline)}</h1>
        ${
          data.subhead
            ? `<p style="margin:18px 0 0;font-size:16px;line-height:1.5;color:${PALETTE.muted};">${escapeHtml(data.subhead)}</p>`
            : ''
        }
      </td>
    </tr>`
}
