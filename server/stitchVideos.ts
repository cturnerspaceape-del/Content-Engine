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

interface ClipInput {
  mime: string
  base64: string
  trimStart?: number
  trimEnd?: number
  speed?: number
}

interface StitchBody {
  clips?: ClipInput[]
}

const CACHE_VERSION = 1

function hashB64(b64: string): string {
  return createHash('sha256').update(b64).digest('hex').slice(0, 16)
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

function buildFilterComplex(n: number, speeds: (number | undefined)[]): string {
  const parts: string[] = []
  const concatInputs: string[] = []
  for (let i = 0; i < n; i++) {
    const s = speeds[i]
    if (s && s !== 1) {
      parts.push(`[${i}:v]setpts=PTS/${s}[v${i}]`)
      parts.push(`[${i}:a]atempo=${s}[a${i}]`)
      concatInputs.push(`[v${i}][a${i}]`)
    } else {
      // Pass-through label rename so the concat filter sees a uniform interface
      // for every input (avoids mixing raw [i:v] and labelled [vi] handles).
      parts.push(`[${i}:v]setpts=PTS[v${i}]`)
      parts.push(`[${i}:a]anull[a${i}]`)
      concatInputs.push(`[v${i}][a${i}]`)
    }
  }
  parts.push(`${concatInputs.join('')}concat=n=${n}:v=1:a=1[outv][outa]`)
  return parts.join(';')
}

export async function stitchVideosHandler(req: Request, res: Response): Promise<void> {
  let tmpDir: string | null = null
  try {
    const body = (req.body ?? {}) as StitchBody
    let clips: ClipInput[]
    try {
      clips = validate(body.clips)
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'invalid body' })
      return
    }

    const hash = hashKey({
      v: CACHE_VERSION,
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

    // Ensure the cache directory exists — ffmpeg won't mkdir parents.
    await fs.mkdir(path.dirname(absPath), { recursive: true })

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `stitch-${hash}-`))
    const inputPaths: string[] = []
    for (let i = 0; i < clips.length; i++) {
      const p = path.join(tmpDir, `clip-${i}.mp4`)
      await fs.writeFile(p, Buffer.from(clips[i].base64, 'base64'))
      inputPaths.push(p)
    }

    // Build ffmpeg argv. Per input: optional -ss / -to for trim, then -i path.
    const args: string[] = ['-y', '-hide_banner', '-loglevel', 'error']
    for (let i = 0; i < clips.length; i++) {
      const c = clips[i]
      if (c.trimStart != null) args.push('-ss', String(c.trimStart))
      if (c.trimEnd != null) args.push('-to', String(c.trimEnd))
      args.push('-i', inputPaths[i])
    }
    const filter = buildFilterComplex(
      clips.length,
      clips.map((c) => c.speed),
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
      `[stitch-videos ${reqId}] clips=${clips.length} hash=${hash} starting ffmpeg`,
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
