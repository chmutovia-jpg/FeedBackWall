import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { OwnerProjectView } from '../components/OwnerProjectView'
import { DEFAULT_FILTER_STATE } from '../components/Filters'
import type { FeedbackFilterState } from '../components/Filters'
import type { PickedImage } from '../components/ImageUpload'
import { feedbackRepository, isSupabaseConfigured } from '../services/feedbackRepository'
import type { Feedback, FeedbackStatus, Project } from '../types'
import { DEMO_PUBLIC_SLUG } from '../data/demoData'

type LoadStatus = 'checking' | 'denied' | 'ready' | 'error'

function buildPublicUrl(slug: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/p/${slug}`
}

/**
 * Legacy owner dashboard reached via the shareable owner-token link
 * (#/p/:slug/admin?token=...). Kept for backward compatibility and local
 * fallback mode; authenticated users use AppProjectPage instead. Owner
 * mutations here go through the token-verified repository methods.
 */
export function OwnerDashboardPage() {
  const { publicSlug } = useParams<{ publicSlug: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [status, setStatus] = useState<LoadStatus>('checking')
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
      if (!publicSlug || !token) {
        setStatus('denied')
        return
      }
      setStatus('checking')
      try {
        const proj = await feedbackRepository.getOwnerProjectBySlugAndToken(publicSlug, token)
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
        setLoadError(err instanceof Error ? err.message : 'Could not load this dashboard.')
        setStatus('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [publicSlug, token])

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
      const updated = await feedbackRepository.getOwnerProjectBySlugAndToken(project.publicSlug, token)
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
      await feedbackRepository.updateFeedbackStatus(id, token, nextStatus)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not update the status.')
    }
  }

  async function handleDelete(id: string) {
    setActionError(null)
    try {
      await feedbackRepository.deleteFeedback(id, token)
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not delete this feedback.')
    }
  }

  async function handleSaveOwnerResponse(feedbackId: string, body: string) {
    setActionError(null)
    try {
      const hasExisting = Boolean(feedback.find((f) => f.id === feedbackId)?.ownerResponse)
      if (hasExisting) {
        await feedbackRepository.updateOwnerComment(feedbackId, token, body)
      } else {
        await feedbackRepository.addOwnerComment(feedbackId, token, body)
      }
      await refresh()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save the response.')
    }
  }

  async function handleDeleteOwnerResponse(feedbackId: string) {
    setActionError(null)
    try {
      await feedbackRepository.deleteOwnerComment(feedbackId, token)
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
        await feedbackRepository.uploadProjectScreenshot(project.id, token, file)
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
    if (!project) return
    try {
      await feedbackRepository.updateProjectScreenshotCaption(project.id, token, screenshotId, caption)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save the caption.')
    }
  }

  async function handleDeleteScreenshot(screenshotId: string) {
    if (!project) return
    setActionError(null)
    try {
      await feedbackRepository.deleteProjectScreenshot(project.id, token, screenshotId)
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
      // Clipboard API can be unavailable; the public URL is still visible in the browser.
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'denied') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <EmptyState
          title="Owner link required"
          description="Open the private dashboard link created with this project."
          action={
            <Link to="/create">
              <Button>Create your wall</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (status === 'checking') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <p className="fw-hint" style={{ textAlign: 'center' }}>
          Loading dashboard...
        </p>
      </div>
    )
  }

  if (status === 'error' || !project) {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
        <EmptyState
          title="Something went wrong"
          description={loadError ?? 'Could not load this dashboard. Please try again.'}
        />
      </div>
    )
  }

  const isDemo = project.publicSlug === DEMO_PUBLIC_SLUG
  const banner = !isSupabaseConfigured ? (
    <div className="fw-demo-banner">
      {isDemo
        ? 'Local mode: this sample project is stored only in this browser.'
        : 'Local mode: Supabase is not configured, so this wall only exists in this browser.'}
      {isDemo && (
        <>
          {' '}
          <Link to={`/p/${project.publicSlug}`}>View public wall -&gt;</Link>
        </>
      )}
    </div>
  ) : undefined

  return (
    <OwnerProjectView
      project={project}
      feedback={feedback}
      filters={filters}
      onFiltersChange={setFilters}
      copied={copied}
      isUploadingScreenshot={isUploadingScreenshot}
      actionError={actionError}
      banner={banner}
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
