import 'dotenv/config'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { buildAppOnlyClient, X_OAUTH_REDIRECT_URI, X_OAUTH_SCOPES } from './x'

// One-shot helper to mint an X (Twitter) refresh token. Run with:
//   tsx server/xAuth.ts
//
// Prereqs (in .env):
//   X_CLIENT_ID, X_CLIENT_SECRET
// Configure the OAuth 2.0 client in the X developer portal with:
//   - Type: OAuth 2.0
//   - App permissions: Read and write
//   - Callback URI: urn:ietf:wg:oauth:2.0:oob

async function main(): Promise<void> {
  const app = buildAppOnlyClient()
  const { url, codeVerifier } = app.generateOAuth2AuthLink(X_OAUTH_REDIRECT_URI, {
    scope: X_OAUTH_SCOPES,
  })

  console.log('\n1. Open this URL in a browser logged in as the X account owner:')
  console.log('\n   ' + url + '\n')
  console.log('2. Approve, then copy the auth code shown on the redirect page.\n')

  const rl = readline.createInterface({ input: stdin, output: stdout })
  const code = (await rl.question('Paste auth code here: ')).trim()
  rl.close()

  if (!code) {
    console.error('No code provided — aborting.')
    process.exit(1)
  }

  const { refreshToken, expiresIn, scope } = await app.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri: X_OAUTH_REDIRECT_URI,
  })

  if (!refreshToken) {
    console.error('No refresh_token returned. Make sure offline.access scope is included.')
    process.exit(1)
  }

  console.log('\n✓ Refresh token (paste into .env as X_REFRESH_TOKEN):\n')
  console.log(refreshToken + '\n')
  console.log(`Access token expires in ${Math.round(expiresIn / 60)} minutes.`)
  console.log(`Scopes granted: ${scope.join(', ')}`)
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error('Auth failed:', message)
  process.exit(1)
})
