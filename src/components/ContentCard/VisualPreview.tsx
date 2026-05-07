import { Thumbnail } from '@remotion/player'
import type { ContentItem } from '../../types'
import { Carousel } from '../../remotion/compositions'
import type { CarouselProps } from '../../remotion/types'
import SingleImageVisual from '../SingleImageVisual'
import CarouselLoungeVisual from '../CarouselLoungeVisual'
import { MockVisual } from './MockVisual'
import { CarouselNav } from './CarouselNav'

// Cast component to satisfy Thumbnail LooseComponentType constraint
const CarouselComponent = Carousel as unknown as React.FC<Record<string, unknown>>

type VisualPatch = Partial<NonNullable<ContentItem['generatedVisual']>>

interface VisualPreviewProps {
  item: ContentItem
  format: string
  pillar: string
  accentColor: string
  slideCount: number
  currentSlide: number
  onSlideChange: (next: number) => void
  applyPatch: (patch: VisualPatch) => void
}

export function VisualPreview({
  item,
  format,
  pillar,
  accentColor,
  slideCount,
  currentSlide,
  onSlideChange,
  applyPatch,
}: VisualPreviewProps) {
  const isGenerated = item.generated
  if (!isGenerated) return null
  if (!item.generatedVisual) return <MockVisual format={format} pillar={pillar} accentColor={accentColor} />

  if (format === 'Single Image') {
    return (
      <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1' }}>
        <SingleImageVisual
          flavor={(item.generatedVisual.flavor || 'Amped Apple') as React.ComponentProps<typeof SingleImageVisual>['flavor']}
          hook={item.generatedVisual.hook}
          caption={item.generatedVisual.caption}
          hashtags={item.generatedVisual.hashtags}
          pillar={item.generatedVisual.pillar}
          subcategory={item.generatedVisual.subcategory}
          {...(item.generatedVisual.shotTemplateId ? { shotTemplateId: item.generatedVisual.shotTemplateId } : {})}
          {...(typeof item.generatedVisual.imageVariationSeed === 'number'
            ? { variationSeed: item.generatedVisual.imageVariationSeed }
            : {})}
          {...(item.generatedVisual.researchAngle ? { researchAngle: item.generatedVisual.researchAngle } : {})}
          {...(item.generatedVisual.researchNotes ? { researchNotes: item.generatedVisual.researchNotes } : {})}
          {...(item.generatedVisual.researchSourceUrls?.length
            ? { researchSourceUrls: item.generatedVisual.researchSourceUrls }
            : {})}
          {...(item.generatedVisual.researchSourceImageUrls?.length
            ? { researchSourceImageUrls: item.generatedVisual.researchSourceImageUrls }
            : {})}
          {...(item.generatedVisual.imageUrl ? { imageUrl: item.generatedVisual.imageUrl } : {})}
          {...(item.generatedVisual.imageError ? { imageError: item.generatedVisual.imageError } : {})}
          onResult={(url, error) => {
            applyPatch({
              imageUrl: url ?? undefined,
              imageError: error ?? undefined,
            })
          }}
        />
      </div>
    )
  }

  if (format === 'Carousel') {
    if (item.generatedVisual.arcId) {
      return (
        <div className="mb-3">
          <CarouselLoungeVisual
            flavor={(item.generatedVisual.flavor || 'Amped Apple') as CarouselProps['flavor']}
            hook={item.generatedVisual.hook}
            caption={item.generatedVisual.caption}
            pillar={item.generatedVisual.pillar}
            subcategory={item.generatedVisual.subcategory}
            arcId={item.generatedVisual.arcId}
            slideCount={slideCount}
            carouselSeed={item.generatedVisual.carouselSeed ?? 0}
            {...(item.generatedVisual.researchAngle ? { researchAngle: item.generatedVisual.researchAngle } : {})}
            {...(item.generatedVisual.researchNotes ? { researchNotes: item.generatedVisual.researchNotes } : {})}
            {...(item.generatedVisual.researchShotBrief
              ? { researchShotBrief: item.generatedVisual.researchShotBrief }
              : {})}
            {...(item.generatedVisual.researchSlides?.length
              ? { researchSlides: item.generatedVisual.researchSlides }
              : {})}
            {...(item.generatedVisual.researchSourceUrls?.length
              ? { researchSourceUrls: item.generatedVisual.researchSourceUrls }
              : {})}
            {...(item.generatedVisual.researchSourceImageUrls?.length
              ? { researchSourceImageUrls: item.generatedVisual.researchSourceImageUrls }
              : {})}
            {...(item.generatedVisual.slideUrls ? { slideUrls: item.generatedVisual.slideUrls } : {})}
            {...(item.generatedVisual.slideErrors ? { slideErrors: item.generatedVisual.slideErrors } : {})}
            {...(item.generatedVisual.slideVariationSeeds
              ? { slideVariationSeeds: item.generatedVisual.slideVariationSeeds }
              : {})}
            onSlideResult={(i, url, error, vseed) => {
              const prevUrls = item.generatedVisual?.slideUrls ?? Array(slideCount).fill(null)
              const prevErrors = item.generatedVisual?.slideErrors ?? Array(slideCount).fill(null)
              const prevSeeds = item.generatedVisual?.slideVariationSeeds ?? Array(slideCount).fill(undefined)
              const nextUrls = prevUrls.slice()
              const nextErrors = prevErrors.slice()
              const nextSeeds = prevSeeds.slice()
              nextUrls[i] = url
              nextErrors[i] = error
              nextSeeds[i] = vseed
              applyPatch({
                slideUrls: nextUrls,
                slideErrors: nextErrors,
                slideVariationSeeds: nextSeeds,
              })
            }}
          />
        </div>
      )
    }
    return (
      <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1/1', position: 'relative' }}>
        <Thumbnail
          component={CarouselComponent}
          compositionWidth={1080}
          compositionHeight={1080}
          durationInFrames={slideCount * 45}
          fps={30}
          frameToDisplay={Math.min(currentSlide * 45 + 30, slideCount * 45 - 1)}
          style={{ width: '100%', height: '100%' }}
          inputProps={{
            flavor: (item.generatedVisual.flavor || 'Amped Apple') as CarouselProps['flavor'],
            hook: item.generatedVisual.hook,
            caption: item.generatedVisual.caption,
            hashtags: item.generatedVisual.hashtags,
            pillar: item.generatedVisual.pillar,
            subcategory: item.generatedVisual.subcategory,
            layoutTemplate: item.generatedVisual.layoutTemplate || 1,
            slideCount: slideCount,
          }}
        />
        <CarouselNav
          current={currentSlide}
          total={slideCount}
          onPrev={() => onSlideChange(Math.max(0, currentSlide - 1))}
          onNext={() => onSlideChange(Math.min(slideCount - 1, currentSlide + 1))}
        />
      </div>
    )
  }

  return <MockVisual format={format} pillar={pillar} accentColor={accentColor} />
}
