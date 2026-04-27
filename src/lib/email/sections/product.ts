import type { ProductSectionData, ProductCellData } from '../types'
import { escapeHtml, PALETTE } from './util'

function renderCell(cell: ProductCellData): string {
  const img = cell.imageUrl
    ? `<img src="${escapeHtml(cell.imageUrl)}" width="252" alt="" style="display:block;width:100%;max-width:252px;height:auto;border-radius:14px;" />`
    : `<div style="width:100%;aspect-ratio:1/1;background:${PALETTE.panel};border-radius:14px;display:flex;align-items:center;justify-content:center;color:${PALETTE.muted};font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">${cell.imageError ? '⚠️' : '◌'}</div>`

  return `
    <td class="product-cell" valign="top" width="50%" style="padding:0 8px;font-family:Helvetica,Arial,sans-serif;">
      ${img}
      <div style="margin-top:14px;font-size:15px;font-weight:700;color:${PALETTE.text};">${escapeHtml(cell.name)}</div>
      <p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:${PALETTE.muted};">${escapeHtml(cell.blurb)}</p>
    </td>`
}

export function renderProduct(data: ProductSectionData): string {
  const cells = data.cells.length === 0 ? '' : data.cells.map(renderCell).join('')
  // Render in pairs to keep two-up rows on desktop and stack on mobile via CSS class.
  const rows: string[] = []
  for (let i = 0; i < data.cells.length; i += 2) {
    const pair = [data.cells[i], data.cells[i + 1]].filter(Boolean) as ProductCellData[]
    rows.push(
      `<tr class="product-row">${pair.map(renderCell).join('')}${pair.length === 1 ? '<td width="50%"></td>' : ''}</tr>`,
    )
  }

  return `
    <tr>
      <td style="padding:28px 24px 4px;">
        ${
          data.title
            ? `<div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;color:${PALETTE.muted};text-align:center;margin-bottom:18px;">${escapeHtml(data.title)}</div>`
            : ''
        }
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${cells ? rows.join('') : ''}
        </table>
      </td>
    </tr>`
}
