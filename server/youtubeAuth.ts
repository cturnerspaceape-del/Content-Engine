import 'dotenv/config'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { exchangeCodeForRefreshToken, getConsentUrl } from './youtube'

// One-shot helper to mint a YouTube refresh token. Run with:
//   tsx server/youtubeAuth.ts
//
// Prereqs (in .env):
//   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
// Configure the OAuth 2.0 client with redirect URI `urn:ietf:wg:oauth:2.0:oob`
// (out-of-band) so Google shows the auth code on a final page for you to copy.

async function main(): Promise<void> {
  const url = getConsentUrl()
  console.log('\n1. Open this URL in a browser logged in as the YouTube channel owner:')
  console.log('\n   ' + url + '\n')
  console.log('2. Approve, copy the auth code shown on the final page.\n')

  const rl = readline.createInterface({ input: stdin, output: stdout })
  const code = (await rl.question('Paste auth code here: ')).trim()
  rl.close()

  if (!code) {
    console.error('No code provided — aborting.')
    process.exit(1)
  }

  const refreshToken = await exchangeCodeForRefreshToken(code)
  console.log('\n✓ Refresh token (paste into .env as YOUTUBE_REFRESH_TOKEN):\n')
  console.log(refreshToken + '\n')
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error('Auth failed:', message)
  process.exit(1)
})
