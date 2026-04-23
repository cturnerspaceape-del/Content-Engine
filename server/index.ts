import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import { generateSingleImageHandler } from './generateSingleImage'
import { generateCarouselSlideHandler } from './generateCarouselSlide'
import { generateReelHandler } from './generateReel'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Emergency kill switch. Set DISABLE_GENERATION=1 to short-circuit every
// billable route with a 503 before it reaches Gemini or Veo. Useful while
// debugging cost leaks or running the dev stack with no wallet exposure.
if (process.env.DISABLE_GENERATION === '1') {
  const deny = (_req: express.Request, res: express.Response) => {
    res.status(503).json({ error: 'generation disabled (DISABLE_GENERATION=1)' })
  }
  app.post('/api/generate-single-image', deny)
  app.post('/api/generate-carousel-slide', deny)
  app.post('/api/generate-reel', deny)
  console.warn('[api] DISABLE_GENERATION=1 — all generate-* routes return 503')
} else {
  app.post('/api/generate-single-image', generateSingleImageHandler)
  app.post('/api/generate-carousel-slide', generateCarouselSlideHandler)
  app.post('/api/generate-reel', generateReelHandler)
}

if (process.env.NODE_ENV === 'production') {
  const publicDir = path.resolve(process.cwd(), 'public')
  const distDir = path.resolve(process.cwd(), 'dist')
  app.use(express.static(publicDir))
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`[api] listening on :${port}`)
})
