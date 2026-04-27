import type { Request, Response } from 'express'
import { sendEmail } from './resend'
import { absolutize } from './graph'
import { recordPublishError } from './publishErrorLog'

interface SendBody {
  to?: string[]
  subject?: string
  html?: string
  preheader?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Email clients (Gmail, Apple Mail) require absolute https:// URLs for images.
// composeHtml() emits `src="/generated/email/..."` for images we serve from
// the same Railway origin, so rewrite those to use PUBLIC_BASE_URL before send.
function rewriteRelativeImageSrcs(html: string): string {
  return html.replace(/(src=")(\/[^"]+)(")/g, (_match, p1: string, p2: string, p3: string) => {
    return `${p1}${absolutize(p2)}${p3}`
  })
}

export async function sendEmailHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as SendBody
  const recipients = (body.to ?? []).map((r) => r.trim()).filter((r) => r.length > 0)

  if (recipients.length === 0) {
    res.status(400).json({ ok: false, error: 'At least one recipient is required' })
    return
  }
  const invalid = recipients.filter((r) => !EMAIL_REGEX.test(r))
  if (invalid.length > 0) {
    res.status(400).json({ ok: false, error: `Invalid email address(es): ${invalid.join(', ')}` })
    return
  }
  if (!body.subject || body.subject.trim().length === 0) {
    res.status(400).json({ ok: false, error: 'subject is required' })
    return
  }
  if (!body.html || body.html.trim().length === 0) {
    res.status(400).json({ ok: false, error: 'html is required' })
    return
  }

  try {
    const html = rewriteRelativeImageSrcs(body.html)
    const result = await sendEmail({
      to: recipients,
      subject: body.subject,
      html,
      preheader: body.preheader,
    })
    res.json({ ok: true, id: result.id, recipients })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email] send failed:', message)
    void recordPublishError({ platform: 'email', message })
    res.status(500).json({ ok: false, error: message })
  }
}
