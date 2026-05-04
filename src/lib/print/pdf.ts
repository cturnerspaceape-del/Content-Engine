import { PDFDocument, PDFImage, PDFPage, degrees } from 'pdf-lib'
import type { PrintCampaign, PrintPiece, TrifoldPiece } from './types'

// All measurements in PDF points (72 pt = 1 inch).
const IN = 72
const SHEET_W = 13 * IN
const SHEET_H = 19 * IN
const PANEL_W = 6.33 * IN
const PANEL_H = 11 * IN
const STICKER = 3 * IN
const STICKER_GAP = 0.25 * IN
const STICKER_MARGIN = 0.5 * IN

export async function downloadPrintPdf(c: PrintCampaign): Promise<void> {
  const { bytes, filename } = await composePrintPdf(c)
  triggerDownload(bytes, filename)
}

export async function composePrintPdf(
  c: PrintCampaign,
): Promise<{ bytes: Uint8Array; filename: string }> {
  if (c.activeFormat === 'Poster') {
    if (!c.poster?.imageUrl) throw new Error('No poster art generated yet')
    return { bytes: await composePosterPdf(c.poster), filename: stamp('poster') }
  }
  if (c.activeFormat === 'Sticker') {
    if (!c.sticker?.imageUrl) throw new Error('No sticker art generated yet')
    return { bytes: await composeStickerSheetPdf(c.sticker), filename: stamp('stickers') }
  }
  if (c.activeFormat === 'Trifold') {
    if (!c.trifold?.outsidePanel?.imageUrl || !c.trifold?.insidePanel?.imageUrl) {
      throw new Error('Both trifold panels must be generated first')
    }
    return { bytes: await composeTrifoldPdf(c.trifold), filename: stamp('trifold') }
  }
  throw new Error(`Unknown print format: ${c.activeFormat}`)
}

async function composePosterPdf(piece: PrintPiece): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([SHEET_W, SHEET_H])
  const img = await embedPiece(doc, piece)
  page.drawImage(img, { x: 0, y: 0, width: SHEET_W, height: SHEET_H })
  return doc.save()
}

async function composeStickerSheetPdf(piece: PrintPiece): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([SHEET_W, SHEET_H])
  const img = await embedPiece(doc, piece)

  const cellW = STICKER + STICKER_GAP
  const cellH = STICKER + STICKER_GAP
  const cols = Math.floor((SHEET_W - 2 * STICKER_MARGIN + STICKER_GAP) / cellW)
  const rows = Math.floor((SHEET_H - 2 * STICKER_MARGIN + STICKER_GAP) / cellH)
  const usedW = cols * cellW - STICKER_GAP
  const usedH = rows * cellH - STICKER_GAP
  const startX = (SHEET_W - usedW) / 2
  const startY = (SHEET_H - usedH) / 2

  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * cellW
      // PDF y-axis grows upward; lay top-down for readability.
      const y = SHEET_H - startY - STICKER - r * cellH
      page.drawImage(img, { x, y, width: STICKER, height: STICKER })
      drawCutMarks(page, x, y, STICKER, STICKER)
    }
  }
  return doc.save()
}

// Trifold imposition: 3 panels across the long edge of a 19×13 landscape sheet.
// Page 1 = outside row (rotated 180° to match the source `Dispose Of This
// Section.pdf` template — ready for tumble-edge duplex with the inside row).
// Page 2 = inside row, upright. Each panel is 6.33×11; 3 panels = 18.99in wide
// fits the 19in sheet; 11in tall fits inside the 13in sheet height with ~1in
// margins top/bottom.
async function composeTrifoldPdf(piece: TrifoldPiece): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const sheetW = 19 * IN
  const sheetH = 13 * IN
  const sideMargin = (sheetW - 3 * PANEL_W) / 2
  const topMargin = (sheetH - PANEL_H) / 2

  const outside = await embedPiece(doc, piece.outsidePanel!)
  const inside = await embedPiece(doc, piece.insidePanel!)

  const outsidePage = doc.addPage([sheetW, sheetH])
  for (let i = 0; i < 3; i++) {
    const x = sideMargin + i * PANEL_W
    drawPanelRotated180(outsidePage, outside, x, topMargin, PANEL_W, PANEL_H)
  }
  drawPanelGuides(outsidePage, sideMargin, topMargin, PANEL_W, PANEL_H, 3)

  const insidePage = doc.addPage([sheetW, sheetH])
  for (let i = 0; i < 3; i++) {
    const x = sideMargin + i * PANEL_W
    insidePage.drawImage(inside, { x, y: topMargin, width: PANEL_W, height: PANEL_H })
  }
  drawPanelGuides(insidePage, sideMargin, topMargin, PANEL_W, PANEL_H, 3)

  return doc.save()
}

// Drawing a rotated image in pdf-lib: rotate 180° around the bottom-left of
// the desired bbox, then translate by (+w, +h) so the rotated image lands in
// place. pdf-lib's drawImage rotation pivots about (x, y), so the trick is to
// pass (x + w, y + h) as the position.
function drawPanelRotated180(
  page: PDFPage,
  img: PDFImage,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  page.drawImage(img, {
    x: x + w,
    y: y + h,
    width: w,
    height: h,
    rotate: degrees(180),
  })
}

function drawPanelGuides(
  page: PDFPage,
  startX: number,
  startY: number,
  w: number,
  h: number,
  count: number,
): void {
  const cutLen = 0.25 * IN
  // Cut marks at each interior gutter (between panels).
  for (let i = 1; i < count; i++) {
    const x = startX + i * w
    page.drawLine({
      start: { x, y: startY - cutLen },
      end: { x, y: startY },
      thickness: 0.5,
    })
    page.drawLine({
      start: { x, y: startY + h },
      end: { x, y: startY + h + cutLen },
      thickness: 0.5,
    })
  }
}

function drawCutMarks(page: PDFPage, x: number, y: number, w: number, h: number): void {
  const len = 0.1 * IN
  const t = 0.4
  // Four corner marks.
  page.drawLine({ start: { x: x - len, y }, end: { x, y }, thickness: t })
  page.drawLine({ start: { x, y: y - len }, end: { x, y }, thickness: t })
  page.drawLine({ start: { x: x + w, y }, end: { x: x + w + len, y }, thickness: t })
  page.drawLine({ start: { x: x + w, y: y - len }, end: { x: x + w, y }, thickness: t })
  page.drawLine({ start: { x: x - len, y: y + h }, end: { x, y: y + h }, thickness: t })
  page.drawLine({ start: { x, y: y + h }, end: { x, y: y + h + len }, thickness: t })
  page.drawLine({ start: { x: x + w, y: y + h }, end: { x: x + w + len, y: y + h }, thickness: t })
  page.drawLine({ start: { x: x + w, y: y + h }, end: { x: x + w, y: y + h + len }, thickness: t })
}

async function embedPiece(doc: PDFDocument, piece: PrintPiece): Promise<PDFImage> {
  if (!piece.imageUrl) throw new Error(`Piece has no imageUrl: ${piece.pieceType}`)
  const res = await fetch(piece.imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch ${piece.imageUrl}: HTTP ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())
  // Server endpoint always emits PNG (writePng), so PNG is the only path we
  // need to support today.
  return doc.embedPng(buf)
}

function stamp(prefix: string): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `space-ape-${prefix}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.pdf`
}

function triggerDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
