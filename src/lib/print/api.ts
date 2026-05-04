import type { PrintPieceType } from './types'

export interface GeneratePrintImageResponse {
  url: string
  cached: boolean
  hash: string
  flavor: string
}

export async function generatePrintImage(args: {
  pieceType: PrintPieceType
  prompt: string
  flavor?: string
  variationSeed?: number
}): Promise<GeneratePrintImageResponse> {
  const res = await fetch('/api/generate-print-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return (await res.json()) as GeneratePrintImageResponse
}
