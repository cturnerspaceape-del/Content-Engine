import type { InstagramPost } from '../types'

export interface DistributionItem {
  label: string
  count: number
  percentage: number
}

export interface EngagementItem {
  label: string
  avgLikes: number
  avgComments: number
  avgTotal: number
}

export function getPostsByAccount(posts: InstagramPost[], account: string): InstagramPost[] {
  return posts.filter((p) => p.account === account)
}

export function getFormatDistribution(posts: InstagramPost[]): DistributionItem[] {
  const counts: Record<string, number> = {}
  for (const p of posts) {
    counts[p.format] = (counts[p.format] || 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percentage: Math.round((count / posts.length) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export function getPillarDistribution(posts: InstagramPost[]): DistributionItem[] {
  const counts: Record<string, number> = {}
  for (const p of posts) {
    counts[p.contentPillar] = (counts[p.contentPillar] || 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percentage: Math.round((count / posts.length) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export function getAvgEngagementByFormat(posts: InstagramPost[]): EngagementItem[] {
  const groups: Record<string, InstagramPost[]> = {}
  for (const p of posts) {
    if (!groups[p.format]) groups[p.format] = []
    groups[p.format].push(p)
  }
  return Object.entries(groups)
    .map(([label, items]) => {
      const avgLikes = Math.round(items.reduce((s, p) => s + p.likes, 0) / items.length)
      const avgComments = Math.round(items.reduce((s, p) => s + p.comments, 0) / items.length)
      return { label, avgLikes, avgComments, avgTotal: avgLikes + avgComments }
    })
    .sort((a, b) => b.avgTotal - a.avgTotal)
}

export function getAvgEngagementByPillar(posts: InstagramPost[]): EngagementItem[] {
  const groups: Record<string, InstagramPost[]> = {}
  for (const p of posts) {
    if (!groups[p.contentPillar]) groups[p.contentPillar] = []
    groups[p.contentPillar].push(p)
  }
  return Object.entries(groups)
    .map(([label, items]) => {
      const avgLikes = Math.round(items.reduce((s, p) => s + p.likes, 0) / items.length)
      const avgComments = Math.round(items.reduce((s, p) => s + p.comments, 0) / items.length)
      return { label, avgLikes, avgComments, avgTotal: avgLikes + avgComments }
    })
    .sort((a, b) => b.avgTotal - a.avgTotal)
}

export function getProductVisibilityBuckets(posts: InstagramPost[]): DistributionItem[] {
  const buckets = [
    { label: '0–25%', min: 0, max: 25, count: 0 },
    { label: '26–50%', min: 26, max: 50, count: 0 },
    { label: '51–75%', min: 51, max: 75, count: 0 },
    { label: '76–100%', min: 76, max: 100, count: 0 },
  ]
  for (const p of posts) {
    const bucket = buckets.find((b) => p.productVisibility >= b.min && p.productVisibility <= b.max)
    if (bucket) bucket.count++
  }
  return buckets.map((b) => ({
    label: b.label,
    count: b.count,
    percentage: Math.round((b.count / posts.length) * 100),
  }))
}

export function getTopPosts(posts: InstagramPost[], limit: number = 10): InstagramPost[] {
  return [...posts]
    .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
    .slice(0, limit)
}

export function getSubcategoryBreakdown(posts: InstagramPost[]): DistributionItem[] {
  const counts: Record<string, number> = {}
  for (const p of posts) {
    counts[p.subcategory] = (counts[p.subcategory] || 0) + 1
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count, percentage: Math.round((count / posts.length) * 100) }))
    .sort((a, b) => b.count - a.count)
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}
