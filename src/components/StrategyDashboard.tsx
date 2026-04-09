import { useState, useMemo } from 'react'
import { instagramPosts } from '../data/instagramAnalysis'
import {
  getPostsByAccount,
  getFormatDistribution,
  getPillarDistribution,
  getAvgEngagementByFormat,
  getAvgEngagementByPillar,
  getProductVisibilityBuckets,
  getTopPosts,
  formatNumber,
} from '../data/instagramUtils'
import AccountSelector, { type AccountFilter } from './strategy/AccountSelector'
import StatCard from './strategy/StatCard'
import BarChartSection from './strategy/BarChartSection'

interface StrategyDashboardProps {
  onBack: () => void
}

export default function StrategyDashboard({ onBack }: StrategyDashboardProps) {
  const [account, setAccount] = useState<AccountFilter>('both')

  const filteredPosts = useMemo(() => {
    if (account === 'both') return instagramPosts
    return getPostsByAccount(instagramPosts, account)
  }, [account])

  const formatDist = useMemo(() => getFormatDistribution(filteredPosts), [filteredPosts])
  const pillarDist = useMemo(() => getPillarDistribution(filteredPosts), [filteredPosts])
  const engByFormat = useMemo(() => getAvgEngagementByFormat(filteredPosts), [filteredPosts])
  const engByPillar = useMemo(() => getAvgEngagementByPillar(filteredPosts), [filteredPosts])
  const visBuckets = useMemo(() => getProductVisibilityBuckets(filteredPosts), [filteredPosts])
  const topPosts = useMemo(() => getTopPosts(filteredPosts, 10), [filteredPosts])

  const totalPosts = filteredPosts.length
  const avgLikes = Math.round(filteredPosts.reduce((s, p) => s + p.likes, 0) / totalPosts)
  const avgComments = Math.round(filteredPosts.reduce((s, p) => s + p.comments, 0) / totalPosts)
  const avgVisibility = Math.round(filteredPosts.reduce((s, p) => s + p.productVisibility, 0) / totalPosts)

  const maxFormatPct = Math.max(...formatDist.map((d) => d.percentage))
  const maxPillarPct = Math.max(...pillarDist.map((d) => d.percentage))
  const maxVisPct = Math.max(...visBuckets.map((d) => d.percentage))

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div
        className="glass-panel fade-in"
        style={{
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="btn-glow flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
            style={{
              background: 'rgba(59,130,246,.1)',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
            }}
          >
            <span>←</span>
            <span>Back</span>
          </button>

          <h1 className="text-xl font-bold gradient-text">
            Instagram Strategy
          </h1>

          <AccountSelector selected={account} onChange={setAccount} />
        </div>
      </div>

      {/* Dashboard Body */}
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Row 1: Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Posts" value={totalPosts.toString()} subtitle={account === 'both' ? '2 accounts' : account} index={0} />
          <StatCard label="Avg Likes" value={formatNumber(avgLikes)} subtitle="per post" index={1} />
          <StatCard label="Avg Comments" value={formatNumber(avgComments)} subtitle="per post" index={2} />
          <StatCard label="Avg Visibility" value={`${avgVisibility}%`} subtitle="product visibility" index={3} />
        </div>

        {/* Row 2: Format + Pillar Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <BarChartSection
            title="Format Distribution"
            data={formatDist.map((d) => ({
              label: d.label,
              value: d.percentage,
              maxValue: maxFormatPct,
              color: '#a855f7',
            }))}
          />
          <BarChartSection
            title="Content Pillar Distribution"
            data={pillarDist.map((d) => ({
              label: d.label,
              value: d.percentage,
              maxValue: maxPillarPct,
              color: '#3b82f6',
            }))}
          />
        </div>

        {/* Row 3: Engagement Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Engagement by Format */}
          <div className="glass-panel p-6 card-enter">
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--accent)' }}
            >
              Avg Engagement by Format
            </h3>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Format</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Likes</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Comments</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {engByFormat.map((row, i) => (
                  <tr
                    key={row.label}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--panel-2)',
                    }}
                  >
                    <td className="text-sm font-medium py-2.5">{row.label}</td>
                    <td className="text-sm text-right py-2.5" style={{ color: 'var(--muted)' }}>{formatNumber(row.avgLikes)}</td>
                    <td className="text-sm text-right py-2.5" style={{ color: 'var(--muted)' }}>{formatNumber(row.avgComments)}</td>
                    <td className="text-sm text-right font-bold py-2.5" style={{ color: 'var(--accent)' }}>{formatNumber(row.avgTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Engagement by Pillar */}
          <div className="glass-panel p-6 card-enter">
            <h3
              className="text-sm font-bold uppercase tracking-wider mb-4"
              style={{ color: 'var(--accent)' }}
            >
              Avg Engagement by Pillar
            </h3>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Pillar</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Likes</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Comments</th>
                  <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {engByPillar.map((row, i) => (
                  <tr
                    key={row.label}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'var(--panel-2)',
                    }}
                  >
                    <td className="text-sm font-medium py-2.5">{row.label}</td>
                    <td className="text-sm text-right py-2.5" style={{ color: 'var(--muted)' }}>{formatNumber(row.avgLikes)}</td>
                    <td className="text-sm text-right py-2.5" style={{ color: 'var(--muted)' }}>{formatNumber(row.avgComments)}</td>
                    <td className="text-sm text-right font-bold py-2.5" style={{ color: 'var(--accent)' }}>{formatNumber(row.avgTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4: Product Visibility */}
        <BarChartSection
          title="Product Visibility Distribution"
          data={visBuckets.map((d) => ({
            label: d.label,
            value: d.percentage,
            maxValue: maxVisPct,
            color: '#10b981',
          }))}
        />

        {/* Row 5: Top Posts */}
        <div className="glass-panel p-6 card-enter">
          <h3
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--accent)' }}
          >
            Top 10 Posts by Engagement
          </h3>
          <div className="space-y-2">
            {topPosts.map((post, i) => {
              const isPoppi = post.account === '@drinkpoppi'
              const accentColor = isPoppi ? '#a855f7' : '#f59e0b'
              return (
                <div
                  key={`${post.account}-${post.postNumber}`}
                  className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
                  style={{ background: i % 2 === 0 ? 'var(--panel-2)' : 'transparent' }}
                >
                  {/* Rank */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      background: i < 3 ? 'var(--accent)' : 'var(--panel-2)',
                      color: i < 3 ? '#ffffff' : 'var(--muted)',
                      border: i >= 3 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    {i + 1}
                  </div>

                  {/* Account badge */}
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: `${accentColor}20`,
                      color: accentColor,
                    }}
                  >
                    {isPoppi ? 'Poppi' : 'Starface'}
                  </span>

                  {/* Format badge */}
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: 'rgba(59,130,246,.1)',
                      color: 'var(--accent)',
                    }}
                  >
                    {post.format}
                  </span>

                  {/* Pillar */}
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted)' }}>
                    {post.contentPillar}
                  </span>

                  {/* Notes (fills remaining space) */}
                  <span
                    className="text-xs flex-1 min-w-0"
                    style={{
                      color: 'var(--muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {post.notes}
                  </span>

                  {/* Engagement */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                      {formatNumber(post.likes + post.comments)}
                    </span>
                    <span className="text-xs ml-1" style={{ color: 'var(--muted)' }}>
                      total
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
