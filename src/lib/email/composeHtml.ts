import type { GeneratedEmail, EmailSection } from './types'
import { renderHeader } from './sections/header'
import { renderHero } from './sections/hero'
import { renderOffer } from './sections/offer'
import { renderProduct } from './sections/product'
import { renderBenefits } from './sections/benefits'
import { renderSocialProof } from './sections/socialProof'
import { renderCta } from './sections/cta'
import { renderFooter } from './sections/footer'
import { PALETTE, escapeHtml } from './sections/util'

function renderSection(section: EmailSection): string {
  switch (section.kind) {
    case 'header':
      return renderHeader(section.data as Parameters<typeof renderHeader>[0])
    case 'hero':
      return renderHero(section.data as Parameters<typeof renderHero>[0])
    case 'offer':
      return renderOffer(section.data as Parameters<typeof renderOffer>[0])
    case 'product':
      return renderProduct(section.data as Parameters<typeof renderProduct>[0])
    case 'benefits':
      return renderBenefits(section.data as Parameters<typeof renderBenefits>[0])
    case 'social_proof':
      return renderSocialProof(section.data as Parameters<typeof renderSocialProof>[0])
    case 'cta':
      return renderCta(section.data as Parameters<typeof renderCta>[0])
    case 'footer':
      return renderFooter(section.data as Parameters<typeof renderFooter>[0])
  }
}

const STYLE_BLOCK = `
  body { margin:0; padding:0; background:${PALETTE.bg}; }
  table { border-collapse:collapse; }
  img { -ms-interpolation-mode:bicubic; }
  a { color:${PALETTE.accent}; }
  @media (max-width:600px) {
    .email-shell { width:100% !important; }
    .product-row { display:block !important; width:100% !important; }
    .product-cell { display:block !important; width:100% !important; padding:0 0 24px !important; }
    .benefits-row { display:block !important; width:100% !important; }
    .benefit-cell { display:block !important; width:100% !important; padding:0 0 28px !important; }
    .cta-button { display:block !important; width:auto !important; padding:18px 24px !important; }
    h1 { font-size:30px !important; }
  }
`

export function composeHtml(email: GeneratedEmail): string {
  const sections = email.sections.map(renderSection).join('')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(email.subject)}</title>
  <style>${STYLE_BLOCK}</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;color:${PALETTE.bg};">${escapeHtml(email.preheader)}</div>
  <table role="presentation" align="center" width="600" cellpadding="0" cellspacing="0" border="0" class="email-shell" style="width:600px;max-width:600px;background:${PALETTE.bg};color:${PALETTE.text};">
    ${sections}
  </table>
</body>
</html>`
}
