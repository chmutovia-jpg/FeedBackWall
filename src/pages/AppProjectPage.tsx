import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { OwnerProjectView } from '../components/OwnerProjectView'
import { DEFAULT_FILTER_STATE } from '../components/Filters'
import type { FeedbackFilterState } from '../components/Filters'
import type { PickedImage } from '../components/ImageUpload'
import { feedbackRepository } from '../services/feedbackRepository'
import type { Feedback, FeedbackStatus, Project } from '../types'

type LoadStatus = 'loading' | 'denied' | 'ready' | 'error'

function buildPublicUrl(slug: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/p/${slug}`
}

export function AppProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()

  const [status, setStatus] = useState<LoadStatus>('loading')
  const [project, setProject] = useState<Project | undefined>(undefined)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FeedbackFilterState>(DEFAULT_FILTER_STATE)
  const [copied, setCopied] = useState(false)
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!projectId) {
        setStatus('denied')
        return
      }
      setStatus('loading')
      try {
        const proj = await feedbackRepository.getOwnerProjectById(projectId)
        if (cancelled) return
        if (!proj) {
          setStatus('denied')
          return
        }
        const items = await feedbackRepository.listFeedback(proj.id)
        if (cancelled) return
        setProject(proj)
        setFeedback(items)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Could not load this project.')
        setStatus('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  async function refresh() {
    if (!project) return
    try {
      setFeedback(await feedbackRepository.listFeedback(project.id))
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not refresh feedback.')
    }
  }

  async function refreshProject() {
    if (!project) return
    try {
      const updated = await feedbackRepository.getOwnerProjectById(project.id)
      if (updated) setProject(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not refresh the project.')
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

  async function handleStatusChange(id: string, nextStatus: FeedbackStatus) {
    setActionError(null)
    try {
      await feedbackRepository.authUpdateFeedbackStatus(id, nextStatus)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update the status.')
    }
  }

  async function handleDelete(id: string) {
    setActionError(null)
    try {
      await feedbackRepository.authDeleteFeedback(id)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete this feedback.')
    }
  }

  async function handleSaveOwnerResponse(feedbackId: string, body: string) {
    setActionError(null)
    try {
      const hasExisting = Boolean(feedback.find((f) => f.id === feedbackId)?.ownerResponse)
      await feedbackRepository.authSaveOwnerComment(feedbackId, body, hasExisting)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save the response.')
    }
  }

  async function handleDeleteOwnerResponse(feedbackId: string) {
    setActionError(null)
    try {
      await feedbackRepository.authDeleteOwnerComment(feedbackId)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the response.')
    }
  }

  async function handleScreenshotsPicked(files: PickedImage[]) {
    if (!project) return
    setActionError(null)
    setIsUploadingScreenshot(true)
    try {
      for (const file of files) {
        await feedbackRepository.authUploadProjectScreenshot(project.id, file)
      }
      await refreshProject()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not upload the screenshot.')
    } finally {
      setIsUploadingScreenshot(false)
    }
  }

  function handleScreenshotCaptionInput(screenshotId: string, caption: string) {
    setProject((current) =>
      current
        ? {
            ...current,
            screenshots: current.screenshots?.map((s) =>
              s.id === screenshotId ? { ...s, caption } : s,
            ),
          }
        : current,
    )
  }

  async function handleScreenshotCaptionBlur(screenshotId: string, caption: string) {
    try {
      await feedbackRepository.authUpdateProjectScreenshotCaption(screenshotId, caption)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save the caption.')
    }
  }

  async function handleDeleteScreenshot(screenshotId: string) {
    setActionError(null)
    try {
      await feedbackRepository.authDeleteProjectScreenshot(screenshotId)
      await refreshProject()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete the screenshot.')
    }
  }

  async function handleCopyLink() {
    if (!project) return
    try {
      await navigator.clipboard.writeText(buildPublicUrl(project.publicSlug))
    } catch {
      // clipboard unavailable — non-fatal
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-7)' }}>
        <p className="fw-hint" style={{ textAlign: 'center' }}>
          Loading project…
        </p>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <EmptyState
          title="Project not found"
          description="This project doesn't exist, or it isn't part of your workspace."
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
          title="Something went wrong"
          description={loadError ?? 'Could not load this project. Please try again.'}
        />
      </div>
    )
  }

  return (
    <OwnerProjectView
      project={project}
      feedback={feedback}
      filters={filters}
      onFiltersChange={setFilters}
      copied={copied}
      isUploadingScreenshot={isUploadingScreenshot}
      actionError={actionError}
      banner={
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Link to="/app" className="fw-back-link">
            ← Back to your walls
          </Link>
        </div>
      }
      metaActions={
        <Link to={`/app/projects/${project.id}/settings`}>
          <Button variant="ghost" size="sm">
            Settings
          </Button>
        </Link>
      }
      onCopyLink={handleCopyLink}
      onUpvote={handleUpvote}
      onStatusChange={handleStatusChange}
      onDeleteFeedback={handleDelete}
      onSaveOwnerResponse={handleSaveOwnerResponse}
      onDeleteOwnerResponse={handleDeleteOwnerResponse}
      onScreenshotsPicked={handleScreenshotsPicked}
      onScreenshotCaptionInput={handleScreenshotCaptionInput}
      onScreenshotCaptionBlur={handleScreenshotCaptionBlur}
      onDeleteScreenshot={handleDeleteScreenshot}
    />
  )
}
