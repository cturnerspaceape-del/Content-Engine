import type { Request, Response } from 'express'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cachePath, exists, hashKey } from './cache'

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe'

const MIN_CLIPS = 2
const MAX_CLIPS = 7
const MIN_SPEED = 0.5
const MAX_SPEED = 2.0
const MAX_FADE_SECONDS = 5

type FadeCurve = 'linear' | 'smooth' | 'fast'

// Curve → multiplier on the nominal fade duration. The fade always ends at the
// stitched output's last frame; the start is pushed earlier (smooth) or later
// (fast) so the same slider value produces visibly different "feels".
const CURVE_MULT: Record<FadeCurve, number> = {
  linear: 1.0,
  smooth: 1.4,
  fast: 0.6,
}

interface ClipInput {
  mime: string
  base64: string
  trimStart?: number
  trimEnd?: number
  speed?: number
}

interface FadeOut {
  seconds: number
  color: string // ffmpeg-compatible color spec (named or `0xRRGGBB`)
  curve: FadeCurve
}

interface StitchBody {
  clips?: ClipInput[]
  // Smart Match Cut: drops one duplicate frame from the start of every clip
  // after the first. Default true.
  smartCut?: boolean
  // Fade out: applied at the tail of the stitched output. 0 / omitted = off.
  fadeOutSeconds?: number
  fadeOutColor?: string
  fadeOutCurve?: FadeCurve
}

const CACHE_VERSION = 4 // uniform target W/H/fps + setsar

const HEX_RE = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

function hashB64(b64: string): string {
  return createHash('sha256').update(b64).digest('hex').slice(0, 16)
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function runCommand(
  cmd: string,
  args: string[],
  opts: { label: string } = { label: cmd },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => {
      stdout += d.toString()
    })
    child.stderr.on('data', (d) => {
      stderr += d.toString()
    })
    child.on('error', (err) => {
      reject(new Error(`${opts.label} spawn failed: ${err.message}`))
    })
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        const tail = stderr.split('\n').slice(-12).join('\n')
        reject(new Error(`${opts.label} exited ${code}\n${tail}`))
      }
    })
  })
}

async function probeDimensions(
  absPath: string,
): Promise<{ width: number; height: number } | null> {
  try {
    const { stdout } = await runCommand(
      FFPROBE,
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height',
        '-of',
        'csv=p=0:s=x',
        absPath,
      ],
      { label: 'ffprobe-dims' },
    )
    const [wStr, hStr] = stdout.trim().split('x')
    const width = parseInt(wStr, 10)
    const height = parseInt(hStr, 10)
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return { width, height }
    }
  } catch {
    // fall through
  }
  return null
}

async function probeFps(absPath: string): Promise<number> {
  try {
    const { stdout } = await runCommand(
      FFPROBE,
      [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=r_frame_rate',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        absPath,
      ],
      { label: 'ffprobe-fps' },
    )
    const raw = stdout.trim()
    const [num, den] = raw.split('/').map(Number)
    if (Number.isFinite(num) && Number.isFinite(den) && den > 0) {
      const fps = num / den
      if (fps > 0 && fps < 240) return fps
    }
  } catch {
    // fall through to default
  }
  return 24 // Veo default
}

async function probeDurationSeconds(absPath: string): Promise<number | null> {
  try {
    const { stdout } = await runCommand(
      FFPROBE,
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        absPath,
      ],
      { label: 'ffprobe' },
    )
    const n = parseFloat(stdout.trim())
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

function validate(clips: ClipInput[] | undefined): ClipInput[] {
  if (!Array.isArray(clips)) throw new Error('clips must be an array')
  if (clips.length < MIN_CLIPS || clips.length > MAX_CLIPS) {
    throw new Error(`clips must contain ${MIN_CLIPS}–${MAX_CLIPS} items`)
  }
  return clips.map((c, i) => {
    if (typeof c?.base64 !== 'string' || !c.base64) {
      throw new Error(`clip[${i}].base64 is required`)
    }
    const mime = typeof c.mime === 'string' && c.mime.startsWith('video/') ? c.mime : 'video/mp4'
    const trimStart =
      typeof c.trimStart === 'number' && c.trimStart > 0 && Number.isFinite(c.trimStart)
        ? c.trimStart
        : undefined
    const trimEnd =
      typeof c.trimEnd === 'number' && c.trimEnd > 0 && Number.isFinite(c.trimEnd)
        ? c.trimEnd
        : undefined
    if (trimStart != null && trimEnd != null && trimEnd <= trimStart) {
      throw new Error(`clip[${i}] trimEnd must be greater than trimStart`)
    }
    let speed: number | undefined =
      typeof c.speed === 'number' && Number.isFinite(c.speed) ? c.speed : undefined
    if (speed != null) {
      if (speed < MIN_SPEED || speed > MAX_SPEED) {
        throw new Error(`clip[${i}] speed must be between ${MIN_SPEED} and ${MAX_SPEED}`)
      }
      if (speed === 1) speed = undefined
    }
    return { mime, base64: c.base64, trimStart, trimEnd, speed }
  })
}

function validateFade(body: StitchBody): FadeOut | null {
  const raw = body.fadeOutSeconds
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null
  const seconds = clamp(raw, 0, MAX_FADE_SECONDS)
  if (seconds === 0) return null

  // Color: 'black' | 'white' | '#RRGGBB' | '#RRGGBBAA'. Convert hex form to
  // ffmpeg's preferred `0xRRGGBB[AA]` syntax.
  let color: string = 'black'
  const rawColor = body.fadeOutColor
  if (typeof rawColor === 'string' && rawColor.trim()) {
    const trimmed = rawColor.trim().toLowerCase()
    if (trimmed === 'black' || trimmed === 'white') {
      color = trimmed
    } else if (HEX_RE.test(trimmed)) {
      color = '0x' + trimmed.replace(/^#/, '')
    } else {
      throw new Error(
        `fadeOutColor must be 'black', 'white', or a #RRGGBB/#RRGGBBAA hex (got '${rawColor}')`,
      )
    }
  }

  const curve: FadeCurve =
    body.fadeOutCurve === 'smooth' || body.fadeOutCurve === 'fast'
      ? body.fadeOutCurve
      : 'linear'

  return { seconds, color, curve }
}

function computeClipOutputSeconds(
  clip: ClipInput,
  rawDuration: number | null,
  headOffset: number,
): number {
  const start = (clip.trimStart ?? 0) + headOffset
  const end = clip.trimEnd ?? rawDuration ?? 0
  const trimmed = Math.max(0, end - start)
  const speed = clip.speed ?? 1
  return trimmed / speed
}

function buildFilterComplex(
  n: number,
  speeds: (number | undefined)[],
  target: { width: number; height: number; fps: number },
  fade: { start: number; duration: number; color: string } | null,
): string {
  const parts: string[] = []
  const concatInputs: string[] = []
  // Normalize every input to the same (width, height, SAR, fps, pixel format)
  // before concat — ffmpeg's concat filter rejects mismatched streams with
  // "Input link parameters do not match the corresponding output link".
  // scale=...:force_original_aspect_ratio=decrease + pad letterboxes any clip
  // whose aspect differs from the target.
  const { width: W, height: H, fps } = target
  const videoNormalize =
    `scale=${W}:${H}:force_original_aspect_ratio=decrease:flags=lanczos,` +
    `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=black,` +
    `setsar=1,fps=${fps},format=yuv420p`
  for (let i = 0; i < n; i++) {
    const s = speeds[i]
    if (s && s !== 1) {
      parts.push(`[${i}:v]${videoNormalize},setpts=PTS/${s}[v${i}]`)
      parts.push(`[${i}:a]aresample=async=1,atempo=${s}[a${i}]`)
    } else {
      parts.push(`[${i}:v]${videoNormalize},setpts=PTS[v${i}]`)
      parts.push(`[${i}:a]aresample=async=1[a${i}]`)
    }
    concatInputs.push(`[v${i}][a${i}]`)
  }
  if (fade) {
    parts.push(`${concatInputs.join('')}concat=n=${n}:v=1:a=1[outv0][outa0]`)
    parts.push(
      `[outv0]fade=t=out:st=${fade.start.toFixed(4)}:d=${fade.duration.toFixed(4)}:color=${fade.color}[outv]`,
    )
    parts.push(
      `[outa0]afade=t=out:st=${fade.start.toFixed(4)}:d=${fade.duration.toFixed(4)}[outa]`,
    )
  } else {
    parts.push(`${concatInputs.join('')}concat=n=${n}:v=1:a=1[outv][outa]`)
  }
  return parts.join(';')
}

export async function stitchVideosHandler(req: Request, res: Response): Promise<void> {
  let tmpDir: string | null = null
  try {
    const body = (req.body ?? {}) as StitchBody
    let clips: ClipInput[]
    let fadeReq: FadeOut | null
    try {
      clips = validate(body.clips)
      fadeReq = validateFade(body)
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'invalid body' })
      return
    }

    const smartCut = body.smartCut !== false

    const hash = hashKey({
      v: CACHE_VERSION,
      smartCut,
      fade: fadeReq, // null when off
      parts: clips.map((c) => ({
        b: hashB64(c.base64),
        s: c.trimStart ?? 0,
        e: c.trimEnd ?? null,
        sp: c.speed ?? 1,
      })),
    })

    const { absPath, publicUrl } = cachePath(hash, 'veo-stitched')
    if (await exists(absPath)) {
      const durationSeconds = await probeDurationSeconds(absPath)
      console.log(`[stitch-videos] cache-hit hash=${hash}`)
      res.json({
        url: publicUrl,
        cached: true,
        hash,
        clipCount: clips.length,
        durationSeconds,
      })
      return
    }

    await fs.mkdir(path.dirname(absPath), { recursive: true })

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `stitch-${hash}-`))
    const inputPaths: string[] = []
    for (let i = 0; i < clips.length; i++) {
      const p = path.join(tmpDir, `clip-${i}.mp4`)
      await fs.writeFile(p, Buffer.from(clips[i].base64, 'base64'))
      inputPaths.push(p)
    }

    // Probe fps + duration + dimensions for each input in parallel — needed
    // for Smart Match Cut offset, total stitched duration, and to pick a
    // uniform target resolution so the concat filter doesn't reject mismatched
    // streams.
    const probes = await Promise.all(
      inputPaths.map(async (p) => ({
        fps: await probeFps(p),
        duration: await probeDurationSeconds(p),
        dims: await probeDimensions(p),
      })),
    )

    // Target = max width × max height across inputs (preserves the quality of
    // any 1080p clips; up-scales smaller ones to match). Fallback 720×1280 if
    // every probe failed (unlikely but defensive). Target fps = max across
    // inputs so the concat doesn't drop frames from a higher-fps source.
    const targetWidth = Math.max(
      ...probes.map((p) => p.dims?.width ?? 720),
    )
    const targetHeight = Math.max(
      ...probes.map((p) => p.dims?.height ?? 1280),
    )
    const targetFps = Math.max(...probes.map((p) => p.fps))

    const headOffsets: number[] = new Array(clips.length).fill(0)
    if (smartCut && clips.length > 1) {
      for (let i = 1; i < clips.length; i++) {
        headOffsets[i] = 1 / probes[i].fps
      }
    }

    const perClipOutSecs = clips.map((c, i) =>
      computeClipOutputSeconds(c, probes[i].duration, headOffsets[i]),
    )
    const totalOutSecs = perClipOutSecs.reduce((acc, n) => acc + n, 0)

    // Build the optional fade timing. Server clamp: never longer than the last
    // clip's output seconds (so the fade can't bleed into the previous clip)
    // and never longer than total - 0.05s.
    let fadeTiming: { start: number; duration: number; color: string } | null = null
    if (fadeReq) {
      const lastClipOutSecs = perClipOutSecs[perClipOutSecs.length - 1] ?? 0
      const cappedSeconds = clamp(
        fadeReq.seconds,
        0,
        Math.max(0.05, Math.min(lastClipOutSecs, totalOutSecs - 0.05)),
      )
      if (cappedSeconds > 0) {
        const mult = CURVE_MULT[fadeReq.curve]
        const desiredD = cappedSeconds * mult
        // Hold the end-of-fade at totalOutSecs; shift the start.
        const duration = Math.min(desiredD, totalOutSecs - 0.05)
        const start = Math.max(0, totalOutSecs - duration)
        fadeTiming = { start, duration, color: fadeReq.color }
      }
    }

    const args: string[] = ['-y', '-hide_banner', '-loglevel', 'error']
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      const effectiveStart = (c.trimStart ?? 0) + headOffsets[i]
      if (effectiveStart > 0) args.push('-ss', effectiveStart.toFixed(4))
      if (c.trimEnd != null) args.push('-to', String(c.trimEnd))
      args.push('-i', inputPaths[i])
    }
    const filter = buildFilterComplex(
      clips.length,
      clips.map((c) => c.speed),
      { width: targetWidth, height: targetHeight, fps: targetFps },
      fadeTiming,
    )
    args.push(
      '-filter_complex',
      filter,
      '-map',
      '[outv]',
      '-map',
      '[outa]',
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      '20',
      '-c:a',
      'aac',
      '-movflags',
      '+faststart',
      absPath,
    )

    const reqId = Math.random().toString(36).slice(2, 8)
    const t0 = Date.now()
    console.log(
      `[stitch-videos ${reqId}] clips=${clips.length} target=${targetWidth}x${targetHeight}@${targetFps.toFixed(2)}fps fade=${
        fadeTiming
          ? `${fadeTiming.duration.toFixed(2)}s@${fadeTiming.start.toFixed(2)} color=${fadeTiming.color}`
          : 'off'
      } hash=${hash} starting ffmpeg`,
    )

    await runCommand(FFMPEG, args, { label: 'ffmpeg' })

    const durationSeconds = await probeDurationSeconds(absPath)
    const total = Date.now() - t0
    console.log(
      `[stitch-videos ${reqId}] done duration=${durationSeconds}s elapsed=${total}ms`,
    )

    res.json({
      url: publicUrl,
      cached: false,
      hash,
      clipCount: clips.length,
      durationSeconds,
    })
  } catch (err) {
    console.error('[stitch-videos]', err)
    const message = err instanceof Error ? err.message : 'stitch failed'
    res.status(500).json({ error: message })
  } finally {
    if (tmpDir) {
      fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}
