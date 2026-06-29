import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { CreatedWallSuccess } from '../components/CreatedWallSuccess'
import { EmptyState } from '../components/EmptyState'
import { feedbackRepository } from '../services/feedbackRepository'
import type { Project } from '../types'

type LoadStatus = 'loading' | 'ready' | 'denied' | 'error'

export function ProjectCreatedPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [project, setProject] = useState<Project | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!projectId) {
        setStatus('denied')
        return
      }
      setStatus('loading')
      try {
        const loaded = await feedbackRepository.getOwnerProjectById(projectId)
        if (cancelled) return
        if (!loaded) {
          setStatus('denied')
          return
        }
        setProject(loaded)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load your new wall.')
        setStatus('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (status === 'loading') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-7)' }}>
        <p className="fw-hint" style={{ textAlign: 'center' }}>
          Loading wall...
        </p>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <EmptyState
          eyebrow="wall unavailable"
          title="Wall not found"
          description="This wall does not exist, or it is not part of your workspace."
          action={
            <Link to="/app">
              <Button>Back to your walls</Button>
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
          eyebrow="load error"
          title="Something went wrong"
          description={error ?? 'Could not load your new wall.'}
        />
      </div>
    )
  }

  return <CreatedWallSuccess project={project} dashboardTo={`/app/projects/${project.id}`} />
}
