import 'dotenv/config'
import path from 'node:path'
import express from 'express'
import { generateSingleImageHandler } from './generateSingleImage'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/generate-single-image', generateSingleImageHandler)

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
