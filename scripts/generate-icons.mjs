import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('public/favicon.svg')

async function makeIcon(size, outPath, padding = 0.18, maskable = false) {
  const inner = Math.round(size * (1 - padding * 2))
  const rendered = await sharp(svg).resize(inner, inner, { fit: 'contain' }).png().toBuffer()
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: maskable ? '#3b82f6' : '#f0f2f5',
    },
  })
    .composite([{ input: rendered, gravity: 'center' }])
    .png()
    .toFile(outPath)
}

await makeIcon(180, 'public/apple-touch-icon.png')
await makeIcon(192, 'public/icon-192.png')
await makeIcon(512, 'public/icon-512.png')
await makeIcon(512, 'public/icon-512-maskable.png', 0.22, true)
console.log('Icons generated.')
