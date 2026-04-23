import { AbsoluteFill, Img } from 'remotion'
import type { SingleImageProps } from '../types'
import { getFlavorTheme } from '../flavorThemes'

// Pure renderer. Takes a pre-fetched imageUrl and displays it. Fetching +
// persistence live in src/components/SingleImageVisual.tsx so the Remotion
// composition has no side-effects (important: video export must be deterministic
// and must never hit the API a second time).
export default function SingleImage(props: SingleImageProps) {
  const { flavor, imageUrl } = props
  const theme = getFlavorTheme(flavor)

  return (
    <AbsoluteFill style={{ background: theme.backgroundColor }}>
      {imageUrl ? (
        <Img src={imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Placeholder theme={theme} />
      )}
    </AbsoluteFill>
  )
}

function Placeholder({ theme }: { theme: ReturnType<typeof getFlavorTheme> }) {
  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 18,
        opacity: 0.6,
      }}
    >
      No image
    </AbsoluteFill>
  )
}
