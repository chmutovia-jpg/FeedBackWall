import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { DEFAULT_FILTER_STATE, Filters, applyFilters } from '../components/Filters'
import type { FeedbackFilterState } from '../components/Filters'
import { FeedbackCard } from '../components/FeedbackCard'
import { FeedbackForm } from '../components/FeedbackForm'
import { EmptyState } from '../components/EmptyState'
import { AttachmentGrid } from '../components/AttachmentGrid'
import { feedbackRepository, isSupabaseConfigured } from '../services/feedbackRepository'
import type { Feedback, Project } from '../types'
import { DEMO_PUBLIC_SLUG } from '../data/demoData'

type LoadStatus = 'loading' | 'not-found' | 'ready' | 'error'

export function PublicWallPage() {
  const { publicSlug } = useParams<{ publicSlug: string }>()
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [project, setProject] = useState<Project | undefined>(undefined)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FeedbackFilterState>(DEFAULT_FILTER_STATE)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!publicSlug) {
        setStatus('not-found')
        return
      }
      setStatus('loading')
      try {
        const proj = await feedbackRepository.getProjectBySlug(publicSlug)
        if (cancelled) return
        if (!proj) {
          setStatus('not-found')
          return
        }
        const items = await feedbackRepository.listFeedback(proj.id)
        if (cancelled) return
        setProject(proj)
        setFeedback(items)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Could not load this wall.')
        setStatus('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [publicSlug])

  const filtered = useMemo(() => applyFilters(feedback, filters), [feedback, filters])

  async function refresh() {
    if (!project) return
    try {
      setFeedback(await feedbackRepository.listFeedback(project.id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not refresh feedback.')
    }
  }

  async function handleUpvote(id: string) {
    setActionError(null)
    try {
      await feedbackRepository.upvoteFeedback(id)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not record the vote.')
    }
  }

  if (status === 'loading') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <p className="fw-hint" style={{ textAlign: 'center' }}>
          Loading project...
        </p>
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <EmptyState
          title="Project not found"
          description="This feedback wall does not exist, or its link is wrong."
          action={
            <Link to="/create">
              <Button>Create your wall</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (status === 'error' || !project) {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <EmptyState
          title="Something went wrong"
          description={loadError ?? 'Could not load this wall. Please try again.'}
        />
      </div>
    )
  }

  const isDemo = project.publicSlug === DEMO_PUBLIC_SLUG

  return (
    <div className="fw-container" style={{ paddingBottom: 'var(--space-7)' }}>
      <div className="fw-page-header">
        {!isSupabaseConfigured && (
          <div className="fw-demo-banner">
            {isDemo
              ? 'Local mode: feel free to leave sample feedback on this project.'
              : "Local mode: Supabase is not configured, so this wall only exists in this browser."}
            {isDemo && (
              <>
                {' '}
                <Link to={`/p/${project.publicSlug}/admin?token=demo-owner-access`}>
                  View as project owner -&gt;
                </Link>
              </>
            )}
          </div>
        )}
        <div className="fw-card fw-card-padded fw-wall-hero-card">
          <span className="fw-chip" style={{ marginBottom: 'var(--space-3)' }}>
            public feedback wall
          </span>
          <h1>{project.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            {project.description}
          </p>
          {project.url && (
            <p style={{ marginTop: 'var(--space-2)' }}>
              <a href={project.url} target="_blank" rel="noreferrer">
                {project.url}
              </a>
            </p>
          )}
          {project.screenshots && project.screenshots.length > 0 && (
            <>
              <h2 style={{ fontSize: '1rem', marginTop: 'var(--space-4)' }}>Project preview</h2>
              <AttachmentGrid items={project.screenshots} variant="showcase" />
            </>
          )}
        </div>
      </div>

      <div className="fw-two-col fw-wall-layout">
        <FeedbackForm
          feedbackQuestion={project.feedbackQuestion}
          onSubmit={async (input) => {
            if (!project) return
            await feedbackRepository.createFeedback({ projectId: project.id, ...input })
            await refresh()
          }}
        />

        <section className="fw-wall-signals" aria-labelledby="signals-heading">
          <div className="fw-board-section-head">
            <span className="fw-chip">live signals</span>
            <h2 id="signals-heading">Signals from users</h2>
          </div>
          <Filters value={filters} onChange={setFilters} showStatusFilter={false} />

          {actionError && (
            <p className="fw-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
              {actionError}
            </p>
          )}

          {feedback.length === 0 ? (
            <EmptyState
              eyebrow="no signals yet"
              title="Be the first to help this maker"
              description="Share what feels confusing, broken, useful, or worth improving."
            />
          ) : filtered.length === 0 ? (
            <EmptyState title="No matching signals." description="Try clearing filters or search." />
          ) : (
            <div className="fw-feedback-list">
              {filtered.map((item) => (
                <FeedbackCard
                  key={item.id}
                  feedback={item}
                  hasVoted={feedbackRepository.hasVoted(item.id)}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
