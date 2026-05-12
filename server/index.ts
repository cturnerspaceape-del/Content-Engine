import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import { generateSingleImageHandler } from './generateSingleImage'
import { generateCarouselSlideHandler } from './generateCarouselSlide'
import { generateEmailHandler } from './generateEmail'
import { generateEmailImageHandler } from './generateEmailImage'
import { generatePrintImageHandler } from './generatePrintImage'
import { generateCaptionHandler } from './generateCaption'
import { researchTrendsHandler } from './researchTrends'
import { editImageHandler } from './editImage'
import { generateVeoHandler } from './generateVeo'
import { stitchVideosHandler } from './stitchVideos'
import { publishToInstagramHandler, getInstagramAccountHandler } from './instagramHandler'
import { getInstagramDebugHandler } from './instagramDebugHandler'
import { publishToFacebookHandler, getFacebookAccountHandler } from './facebookHandler'
import { publishToThreadsHandler, getThreadsAccountHandler } from './threadsHandler'
import { startThreadsTokenRefresh } from './threadsRefresh'
import { sendEmailHandler } from './emailSendHandler'
import { publishToXHandler, getXAccountHandler } from './xHandler'

const app = express()
// 200mb so /api/stitch-videos can accept up to 7 base64-encoded mp4 clips in a
// single JSON body (worst case ~10mb raw × 7 ≈ 94mb base64). The smaller image
// routes (edit-image, etc.) sit comfortably under this ceiling.
app.use(express.json({ limit: '200mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

// Emergency kill switch. Set DISABLE_GENERATION=1 to short-circuit every
// billable route with a 503 before it reaches the image/caption providers.
// Useful while debugging cost leaks or running the dev stack with no wallet
// exposure.
if (process.env.DISABLE_GENERATION === '1') {
  const deny = (_req: express.Request, res: express.Response) => {
    res.status(503).json({ error: 'generation disabled (DISABLE_GENERATION=1)' })
  }
  app.post('/api/generate-single-image', deny)
  app.post('/api/generate-carousel-slide', deny)
  app.post('/api/generate-email', deny)
  app.post('/api/generate-email-image', deny)
  app.post('/api/generate-print-image', deny)
  app.post('/api/generate-caption', deny)
  app.post('/api/research-trends', deny)
  app.post('/api/edit-image', deny)
  app.post('/api/generate-veo', deny)
  app.post('/api/stitch-videos', deny)
  console.warn('[api] DISABLE_GENERATION=1 — all generate-* routes return 503')
} else {
  app.post('/api/generate-single-image', generateSingleImageHandler)
  app.post('/api/generate-carousel-slide', generateCarouselSlideHandler)
  app.post('/api/generate-email', generateEmailHandler)
  app.post('/api/generate-email-image', generateEmailImageHandler)
  app.post('/api/generate-print-image', generatePrintImageHandler)
  app.post('/api/generate-caption', generateCaptionHandler)
  app.post('/api/research-trends', researchTrendsHandler)
  app.post('/api/edit-image', editImageHandler)
  app.post('/api/generate-veo', generateVeoHandler)
  app.post('/api/stitch-videos', stitchVideosHandler)
}

// Instagram publishing — always enabled (the kill-switch covers cost-accruing
// generation; publishing an already-made asset is free).
app.post('/api/instagram/publish', publishToInstagramHandler)
app.get('/api/instagram/account', getInstagramAccountHandler)
app.get('/api/instagram/debug', getInstagramDebugHandler)
app.post('/api/facebook/publish', publishToFacebookHandler)
app.get('/api/facebook/account', getFacebookAccountHandler)
app.post('/api/threads/publish', publishToThreadsHandler)
app.get('/api/threads/account', getThreadsAccountHandler)
app.post('/api/email/send', sendEmailHandler)
app.post('/api/x/publish', publishToXHandler)
app.get('/api/x/account', getXAccountHandler)

if (process.env.NODE_ENV === 'production') {
  const publicDir = path.resolve(process.cwd(), 'public')
  const distDir = path.resolve(process.cwd(), 'dist')
  app.use(express.static(publicDir))
  app.use(express.static(distDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

startThreadsTokenRefresh()

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`[api] listening on :${port}`)
})
