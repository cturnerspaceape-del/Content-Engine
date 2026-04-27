export type EmailType =
  | 'welcome'
  | 'education'
  | 'newsletter'
  | 'replenishment'
  | 'promo'
  | 'transactional'
  | 'reengagement'

export type AudienceType = 'existing' | 'inactive'

export type SectionKind =
  | 'header'
  | 'hero'
  | 'offer'
  | 'product'
  | 'benefits'
  | 'social_proof'
  | 'cta'
  | 'footer'

export interface HeaderSectionData {
  brand: string
  tagline?: string
}

export interface HeroSectionData {
  eyebrow?: string
  headline: string
  subhead?: string
  imageUrl?: string
  imagePrompt?: string
  imageError?: string
}

export interface OfferSectionData {
  badge?: string
  title: string
  body: string
  fineprint?: string
}

export interface ProductCellData {
  name: string
  blurb: string
  imageUrl?: string
  imagePrompt?: string
  imageError?: string
}

export interface ProductSectionData {
  title?: string
  cells: ProductCellData[]
}

export interface BenefitsSectionData {
  title?: string
  bullets: { icon?: string; label: string; body: string }[]
}

export interface SocialProofSectionData {
  quote: string
  attribution: string
}

export interface CtaSectionData {
  label: string
  url: string
  supporting?: string
}

export interface FooterSectionData {
  brand: string
}

export type SectionDataMap = {
  header: HeaderSectionData
  hero: HeroSectionData
  offer: OfferSectionData
  product: ProductSectionData
  benefits: BenefitsSectionData
  social_proof: SocialProofSectionData
  cta: CtaSectionData
  footer: FooterSectionData
}

export interface EmailSection<K extends SectionKind = SectionKind> {
  id: string
  kind: K
  data: SectionDataMap[K]
}

export interface GeneratedEmail {
  subject: string
  preheader: string
  sections: EmailSection[]
}

export interface EmailCampaign {
  campaignName: string
  emailType: EmailType
  audienceType: AudienceType
  email: GeneratedEmail | null
  cache: { existing?: GeneratedEmail; inactive?: GeneratedEmail }
}
