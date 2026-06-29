import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { StatsCard } from '../components/StatsCard'
import { EmptyState } from '../components/EmptyState'
import { feedbackRepository } from '../services/feedbackRepository'
import type { DashboardData } from '../services/feedbackRepository'
import { PROJECT_CATEGORY_LABELS } from '../types'

type LoadStatus = 'loading' | 'ready' | 'error'

function buildPublicUrl(slug: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/p/${slug}`
}

export function AppDashboardPage() {
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setStatus('loading')
      try {
        const result = await feedbackRepository.getDashboardStats()
        if (cancelled) return
        setData(result)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load your workspace.')
        setStatus('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCopy(slug: string, projectId: string) {
    try {
      await navigator.clipboard.writeText(buildPublicUrl(slug))
    } catch {
      // clipboard unavailable — non-fatal
    }
    setCopiedId(projectId)
    window.setTimeout(() => setCopiedId((id) => (id === projectId ? null : id)), 2000)
  }

  if (status === 'loading') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-7)' }}>
        <p className="fw-hint" style={{ textAlign: 'center' }}>
          Loading your workspace…
        </p>
      </div>
    )
  }

  if (status === 'error' || !data) {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <EmptyState
          title="Couldn't load your workspace"
          description={error ?? 'Please try again in a moment.'}
        />
      </div>
    )
  }

  return (
    <div className="fw-container fw-dashboard-page" style={{ paddingBottom: 'var(--space-7)' }}>
      <div className="fw-page-header">
        <div className="fw-dashboard-head">
          <div>
            <span className="fw-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>
              workspace · beta
            </span>
            <h1>Your feedback walls</h1>
            <p className="fw-page-header-subtitle" style={{ marginBottom: 0 }}>
              Every product signal you're collecting, in one workspace.
            </p>
          </div>
          <Link to="/app/projects/new">
            <Button className="fw-btn-glow">Create new wall</Button>
          </Link>
        </div>
      </div>

      <div className="fw-stats">
        <StatsCard label="Total walls" value={data.totalWalls} />
        <StatsCard label="Total feedback" value={data.totalFeedback} />
        <StatsCard label="New signals" value={data.newSignals} />
        <StatsCard label="Shipped" value={data.doneItems} />
      </div>

      {data.projects.length === 0 ? (
        <EmptyState
          eyebrow="workspace empty"
          title="No walls yet"
          description="Create one wall, share it with five people, and collect your first useful signal."
          action={
            <Link to="/app/projects/new">
              <Button>Create your first wall</Button>
            </Link>
          }
        />
      ) : (
        <div className="fw-grid fw-grid-3 fw-dashboard-grid">
          {data.projects.map((project) => (
            <div className="fw-card fw-card-hover fw-project-card fw-workspace-card" key={project.id}>
              <Link className="fw-project-card-main-link" to={`/app/projects/${project.id}`}>
                <div className="fw-project-card-header">
                  <span className="fw-project-card-kicker">public wall</span>
                  <span className="fw-chip fw-project-card-category">
                    {PROJECT_CATEGORY_LABELS[project.category]}
                  </span>
                </div>

                <div className="fw-project-card-body">
                  <h3 className="fw-project-card-name">{project.name}</h3>
                  <p className="fw-project-card-desc">{project.description}</p>
                  <span className="fw-project-card-slug">/p/{project.publicSlug}</span>
                </div>

                <div className="fw-project-card-stats">
                  <div>
                    <strong>{project.feedbackTotal}</strong>
                    <span>signals</span>
                  </div>
                  <div>
                    <strong>{project.feedbackNew}</strong>
                    <span>new</span>
                  </div>
                  <div>
                    <strong>{project.feedbackDone}</strong>
                    <span>shipped</span>
                  </div>
                </div>
              </Link>

              <div className="fw-project-card-actions">
                <Link to={`/app/projects/${project.id}`}>
                  <Button size="sm">Manage</Button>
                </Link>
                <Link to={`/p/${project.publicSlug}`}>
                  <Button variant="secondary" size="sm">
                    Open wall
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(project.publicSlug, project.id)}
                >
                  {copiedId === project.id ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
