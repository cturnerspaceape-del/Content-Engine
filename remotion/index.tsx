import { Composition } from 'remotion'
import { SingleImage, Carousel, Reel } from '../src/remotion/compositions'
import type { SingleImageProps, CarouselProps, ReelProps } from '../src/remotion/types'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<SingleImageProps>
        id="SingleImage"
        component={SingleImage}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          flavor: 'Amped Apple',
          hook: 'This is the vibe and we\'re not sorry about it',
          caption: 'Some days it\'s about the little things. Good light, good energy, and something that just fits.',
          hashtags: ['#spaceape', '#liveresin', '#premium', '#vibes'],
          pillar: 'Lifestyle',
          subcategory: 'Vibes',
          layoutTemplate: 2,
        }}
      />
      <Composition<CarouselProps>
        id="Carousel"
        component={Carousel}
        durationInFrames={315}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          flavor: 'Amped Apple',
          hook: 'Stop what you\'re doing and look at this',
          caption: 'Every angle. Every detail. This is what it looks like when you obsess over getting it right.',
          hashtags: ['#spaceape', '#carousel', '#premium'],
          pillar: 'Product Centric',
          subcategory: 'Product Shots',
          layoutTemplate: 1,
          slideCount: 7,
        }}
      />
      <Composition<ReelProps>
        id="Reel"
        component={Reel}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          flavor: 'Blue Frenzy',
          hook: 'Nobody asked for this but everyone needed it',
          caption: 'When the trend fits, you don\'t fight it — you own it.',
          hashtags: ['#spaceape', '#reel', '#trending'],
          pillar: 'Entertainment',
          subcategory: 'Trends',
          layoutTemplate: 1,
        }}
      />
    </>
  )
}
