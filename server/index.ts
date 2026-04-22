import 'dotenv/config'
import express from 'express'
import { generateSingleImageHandler } from './generateSingleImage'

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/generate-single-image', generateSingleImageHandler)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`[api] listening on :${port}`)
})
