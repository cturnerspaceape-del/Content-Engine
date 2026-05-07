import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface MaskCanvasHandle {
  // Returns a base64 PNG (no data: prefix) where alpha=0 marks regions to
  // edit and alpha=255 marks regions to preserve. Returns null if the user
  // hasn't painted anything (caller should omit `mask` from the request).
  exportMask: () => string | null
  clear: () => void
  hasStrokes: () => boolean
}

interface MaskCanvasProps {
  // The visible image so we know the natural pixel dimensions to match.
  imageUrl: string
  // Display width/height in CSS pixels — the canvas overlays the same area.
  width: number
  height: number
  enabled: boolean
  tool: 'brush' | 'eraser'
  brushSize: number
  // Drives the cursor halo and the visual indicator that strokes have been made.
  onChange?: (hasStrokes: boolean) => void
}

// Internal canvas dimensions — match the gpt-image edit endpoint's expected
// 1024-edge resolution. Strokes scale to whatever output size the user picks.
const INTERNAL_SIZE = 1024

const MaskCanvas = forwardRef<MaskCanvasHandle, MaskCanvasProps>(function MaskCanvas(
  { imageUrl, width, height, enabled, tool, brushSize, onChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasStrokes, setHasStrokes] = useState(false)

  // Initialize: fill canvas opaque white = "preserve everything". The modal
  // unmounts on apply, so imageUrl only changes on remount in practice — no
  // need to reset hasStrokes here (it starts false and the parent's clear()
  // imperative handle covers the edge case of an in-place imageUrl swap).
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    c.width = INTERNAL_SIZE
    c.height = INTERNAL_SIZE
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE)
  }, [imageUrl])

  useImperativeHandle(
    ref,
    () => ({
      exportMask: () => {
        if (!hasStrokes) return null
        const c = canvasRef.current
        if (!c) return null
        const dataUrl = c.toDataURL('image/png')
        const idx = dataUrl.indexOf(',')
        return idx >= 0 ? dataUrl.slice(idx + 1) : null
      },
      clear: () => {
        const c = canvasRef.current
        if (!c) return
        const ctx = c.getContext('2d')
        if (!ctx) return
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, INTERNAL_SIZE, INTERNAL_SIZE)
        setHasStrokes(false)
        onChange?.(false)
      },
      hasStrokes: () => hasStrokes,
    }),
    [hasStrokes, onChange],
  )

  const cssToCanvas = (clientX: number, clientY: number) => {
    const c = canvasRef.current
    if (!c) return null
    const rect = c.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * INTERNAL_SIZE
    const y = ((clientY - rect.top) / rect.height) * INTERNAL_SIZE
    return { x, y }
  }

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    // Map CSS-px brush size to canvas-px so the stroke width is consistent
    // regardless of how big/small the preview is rendered.
    const scale = INTERNAL_SIZE / Math.max(1, width)
    const lineWidth = Math.max(2, brushSize * scale)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = lineWidth
    if (tool === 'brush') {
      // Punch alpha holes — destination-out with any opaque source erases alpha.
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = 'rgba(0,0,0,1)'
    } else {
      // Eraser fills back to opaque white (preserve).
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#ffffff'
    }
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return
    e.preventDefault()
    const c = canvasRef.current
    if (!c) return
    c.setPointerCapture(e.pointerId)
    drawingRef.current = true
    const pt = cssToCanvas(e.clientX, e.clientY)
    if (!pt) return
    lastPointRef.current = pt
    // Dot at click point so a single tap registers.
    stroke(pt, { x: pt.x + 0.01, y: pt.y + 0.01 })
    if (!hasStrokes) {
      setHasStrokes(true)
      onChange?.(true)
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!enabled || !drawingRef.current) return
    const pt = cssToCanvas(e.clientX, e.clientY)
    const last = lastPointRef.current
    if (!pt || !last) return
    stroke(last, pt)
    lastPointRef.current = pt
  }

  const endStroke = () => {
    drawingRef.current = false
    lastPointRef.current = null
  }

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
      onPointerLeave={endStroke}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        // Soft pink-lilac tint over painted regions so the user can see what
        // they've marked. Pure alpha-mask wouldn't be visible against arbitrary
        // images. mix-blend-mode 'difference' would jitter; opacity is enough.
        opacity: enabled ? 0.55 : 0,
        cursor: enabled
          ? tool === 'brush'
            ? 'crosshair'
            : 'cell'
          : 'default',
        pointerEvents: enabled ? 'auto' : 'none',
        transition: 'opacity 0.15s',
        touchAction: 'none',
      }}
      aria-hidden={!enabled}
      data-width={width}
      data-height={height}
    />
  )
})

export default MaskCanvas
