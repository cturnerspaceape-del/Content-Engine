import type { LoggedPost } from '../types'

interface PostLogProps {
  posts: LoggedPost[]
  onBack: () => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PostLog({ posts, onBack }: PostLogProps) {
  const total = posts.length
  const carousels = posts.filter((p) => p.contentType === 'Carousel').length
  const reels = posts.filter((p) => p.contentType === 'Reel').length
  const singles = posts.filter((p) => p.contentType === 'Single Image').length
  const generated = posts.filter((p) => p.generated).length

  // Pillar breakdown
  const pillarCounts: Record<string, number> = {}
  for (const p of posts) {
    const pillar = p.title.split(' — ')[1]?.split(':')[0]?.trim() || 'Other'
    pillarCounts[pillar] = (pillarCounts[pillar] || 0) + 1
  }
  const pillarEntries = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1])

  // Day breakdown
  const dayCounts: Record<string, number> = {}
  for (const p of posts) {
    dayCounts[p.day] = (dayCounts[p.day] || 0) + 1
  }
  const dayEntries = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])

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
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
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

          <div className="flex items-center gap-3">
            <span>📋</span>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              Post Log
            </h1>
          </div>

          <div className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            {total} posts logged
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto p-6 space-y-6">
        {total === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>No posts logged yet</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Go to Weekly Content and log some posts to see analytics here.</p>
          </div>
        ) : (
          <>
            {/* Stat cards row — like the CRM outreach activity */}
            <div className="glass-panel p-6 card-enter">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text)' }}>
                Content Activity
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatBox icon="📸" value={total} label="Total" color="#3b82f6" />
                <StatBox icon="🎠" value={carousels} label="Carousels" color="#a855f7" />
                <StatBox icon="🎬" value={reels} label="Reels" color="#ec4899" />
                <StatBox icon="🖼️" value={singles} label="Images" color="#3b82f6" />
                <StatBox icon="✦" value={generated} label="Generated" color="#10b981" />
              </div>
            </div>

            {/* Pillar + Day breakdown — side by side like CRM */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pillar breakdown */}
              <div className="glass-panel p-6 card-enter" style={{ animationDelay: '0.06s' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--accent)' }}>
                  Posts by Pillar
                </h2>
                <div className="space-y-3">
                  {pillarEntries.map(([pillar, count]) => (
                    <div key={pillar}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{pillar}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{count}</span>
                      </div>
                      <div className="h-4 rounded-full w-full" style={{ background: 'var(--panel-2)' }}>
                        <div
                          className="h-4 rounded-full transition-all duration-500"
                          style={{
                            width: `${(count / total) * 100}%`,
                            background: 'var(--accent)',
                            opacity: 0.7,
                            minWidth: 8,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day breakdown */}
              <div className="glass-panel p-6 card-enter" style={{ animationDelay: '0.12s' }}>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: '#10b981' }}>
                  Posts by Day
                </h2>
                <div className="space-y-3">
                  {dayEntries.map(([day, count]) => (
                    <div key={day}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{day}</span>
                        <span className="text-xs font-bold" style={{ color: '#10b981' }}>{count}</span>
                      </div>
                      <div className="h-4 rounded-full w-full" style={{ background: 'var(--panel-2)' }}>
                        <div
                          className="h-4 rounded-full transition-all duration-500"
                          style={{
                            width: `${(count / total) * 100}%`,
                            background: '#10b981',
                            opacity: 0.7,
                            minWidth: 8,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts table */}
            <div className="glass-panel p-6 card-enter" style={{ animationDelay: '0.18s' }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text)' }}>
                Logged Posts
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th className="text-left text-xs font-bold uppercase tracking-wider py-2 pr-4" style={{ color: 'var(--muted)' }}>Day</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider py-2 pr-4" style={{ color: 'var(--muted)' }}>Format</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider py-2 pr-4" style={{ color: 'var(--muted)' }}>Pillar</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider py-2 pr-4" style={{ color: 'var(--muted)' }}>Subcategory</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider py-2 pr-4" style={{ color: 'var(--muted)' }}>Status</th>
                      <th className="text-left text-xs font-bold uppercase tracking-wider py-2 pr-4" style={{ color: 'var(--muted)' }}>Logged</th>
                      <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Likes</th>
                      <th className="text-right text-xs font-bold uppercase tracking-wider py-2" style={{ color: 'var(--muted)' }}>Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post, i) => {
                      const titleParts = post.title.split(' — ')
                      const format = titleParts[0] || post.contentType
                      const pillarSubcat = titleParts[1] || ''
                      const pillar = pillarSubcat.split(':')[0]?.trim() || ''
                      const subcat = pillarSubcat.split(':')[1]?.trim() || ''

                      const formatColor =
                        format === 'Carousel' ? '#a855f7' :
                        format === 'Reel' ? '#ec4899' : '#3b82f6'

                      return (
                        <tr
                          key={i}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            background: i % 2 === 0 ? 'transparent' : 'var(--panel-2)',
                          }}
                        >
                          <td className="text-sm py-3 pr-4 font-medium">{post.day}</td>
                          <td className="py-3 pr-4">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${formatColor}15`, color: formatColor }}
                            >
                              {format}
                            </span>
                          </td>
                          <td className="text-sm py-3 pr-4" style={{ color: 'var(--text)' }}>{pillar}</td>
                          <td className="text-sm py-3 pr-4" style={{ color: 'var(--muted)' }}>{subcat}</td>
                          <td className="py-3 pr-4">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{
                                background: post.generated ? 'rgba(16,185,129,.1)' : 'rgba(245,158,11,.1)',
                                color: post.generated ? '#10b981' : '#f59e0b',
                              }}
                            >
                              {post.generated ? 'Generated' : 'Draft'}
                            </span>
                          </td>
                          <td className="text-xs py-3 pr-4" style={{ color: 'var(--muted)' }}>
                            {formatDate(post.loggedAt)}
                          </td>
                          <td className="text-sm text-right py-3 font-medium" style={{ color: 'var(--muted)' }}>
                            {post.performance?.likes ?? '—'}
                          </td>
                          <td className="text-sm text-right py-3 font-medium" style={{ color: 'var(--muted)' }}>
                            {post.performance?.comments ?? '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatBox({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div
      className="text-center p-4 rounded-xl"
      style={{ background: `${color}08`, border: `1px solid ${color}20` }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
