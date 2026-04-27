import { Resend } from 'resend'
import { requireEnv } from './graph'

// Thin wrapper around the Resend SDK. The Email Lab generates HTML in-app
// (src/lib/email/composeHtml.ts) — this module just delivers it.

interface SendArgs {
  to: string[]
  subject: string
  html: string
  preheader?: string
}

interface SendResult {
  id: string
}

let cachedClient: Resend | null = null

function getClient(): Resend {
  if (cachedClient) return cachedClient
  cachedClient = new Resend(requireEnv('RESEND_API_KEY'))
  return cachedClient
}

function buildFrom(): string {
  const fromEmail = requireEnv('RESEND_FROM_EMAIL')
  const fromName = process.env.RESEND_FROM_NAME?.trim()
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail
}

export async function sendEmail(args: SendArgs): Promise<SendResult> {
  if (args.to.length === 0) throw new Error('At least one recipient is required')
  const client = getClient()
  const { data, error } = await client.emails.send({
    from: buildFrom(),
    to: args.to,
    subject: args.subject,
    html: args.html,
    // Resend supports the preheader through a `headers` field or the body
    // directly. composeHtml() already embeds the preheader as a hidden
    // <div>, so this is metadata only — included for inbox previews on
    // clients that read the X-Preheader header.
    headers: args.preheader ? { 'X-Preheader-Text': args.preheader } : undefined,
  })
  if (error) throw new Error(error.message ?? 'Resend send failed')
  if (!data?.id) throw new Error('Resend did not return a message id')
  return { id: data.id }
}
