import { generateEmailImage } from './api'
import type {
  EmailSection,
  GeneratedEmail,
  HeroSectionData,
  ProductSectionData,
} from './types'

// After Gemini returns subject + sections (with imagePrompt slots but no
// imageUrl), fan out parallel image generation calls and patch the URLs in.
export async function hydrateImages(
  email: GeneratedEmail,
  flavor?: string,
): Promise<GeneratedEmail> {
  const tasks: Array<Promise<void>> = []
  const next: GeneratedEmail = {
    ...email,
    sections: email.sections.map(
      (s) => ({ ...s, data: { ...(s.data as object) } } as EmailSection),
    ),
  }

  for (const section of next.sections) {
    if (section.kind === 'hero') {
      const data = section.data as HeroSectionData
      const prompt = data.imagePrompt
      if (prompt && !data.imageUrl) {
        tasks.push(
          generateEmailImage({ slot: 'hero', prompt, flavor })
            .then((r) => {
              data.imageUrl = r.url
            })
            .catch((err) => {
              data.imageError = err instanceof Error ? err.message : String(err)
            }),
        )
      }
    }
    if (section.kind === 'product') {
      const data = section.data as ProductSectionData
      data.cells = data.cells.map((cell) => ({ ...cell }))
      for (const cell of data.cells) {
        const prompt = cell.imagePrompt
        if (prompt && !cell.imageUrl) {
          tasks.push(
            generateEmailImage({ slot: 'product', prompt, flavor })
              .then((r) => {
                cell.imageUrl = r.url
              })
              .catch((err) => {
                cell.imageError = err instanceof Error ? err.message : String(err)
              }),
          )
        }
      }
    }
  }

  await Promise.all(tasks)
  return next
}
