import type { PrintFormat } from '../../types'

export type PrintPieceType = 'poster' | 'trifold-panel' | 'sticker'

export interface PrintPiece {
  imageUrl?: string
  imagePrompt: string
  flavor?: string
  variationSeed?: number
  generatedAt?: string
  pieceType: PrintPieceType
}

// Trifold = 3-up imposition on one 13x19 sheet. Two panels are designed
// (outside flap and inside flap); the PDF composer tiles each panel three
// times across the sheet and rotates the outside row 180° to match the
// source template at `Dispose Of This Section.pdf`.
export interface TrifoldPiece {
  outsidePanel: PrintPiece | null
  insidePanel: PrintPiece | null
}

export interface PrintCampaign {
  activeFormat: PrintFormat
  poster: PrintPiece | null
  trifold: TrifoldPiece | null
  sticker: PrintPiece | null
}

export function isTrifold(p: PrintPiece | TrifoldPiece): p is TrifoldPiece {
  return p !== null && typeof p === 'object' && 'outsidePanel' in p
}
