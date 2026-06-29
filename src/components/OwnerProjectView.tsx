import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'
import { Filters, applyFilters } from './Filters'
import type { FeedbackFilterState } from './Filters'
import { FeedbackCard } from './FeedbackCard'
import { EmptyState } from './EmptyState'
import { StatsCard } from './StatsCard'
import { ImageUpload } from './ImageUpload'
import type { PickedImage } from './ImageUpload'
import { feedbackRepository } from '../services/feedbackRepository'
import type { Feedback, FeedbackStatus, Project } from '../types'
import { MAX_PROJECT_SCREENSHOTS } from '../utils/fileToDataUrl'

interface OwnerProjectViewProps {
  project: Project
  feedback: Feedback[]
  filters: FeedbackFilterState
  onFiltersChange: (next: FeedbackFilterState) => void
  copied: boolean
  isUploadingScreenshot: boolean
  actionError: string | null
  /** Rendered above the page title - used for the legacy demo-mode banner. */
  banner?: ReactNode
  /** Extra buttons in the project meta actions row - e.g. a Settings link. */
  metaActions?: ReactNode
  onCopyLink: () => void
  onUpvote: (id: string) => void
  onStatusChange: (id: string, status: FeedbackStatus) => void
  onDeleteFeedback: (id: string) => void
  onSaveOwnerResponse: (feedbackId: string, body: string) => void
  onDeleteOwnerResponse: (feedbackId: string) => void
  onScreenshotsPicked: (files: PickedImage[]) => void
  onScreenshotCaptionInput: (screenshotId: string, caption: string) => void
  onScreenshotCaptionBlur: (screenshotId: string, caption: string) => void
  onDeleteScreenshot: (screenshotId: string) => void
}

/**
 * Shared owner-facing project view: project header, screenshot manager, stats,
 * filters and the feedback backlog. Purely presentational - both the legacy
 * token dashboard (OwnerDashboardPage) and the authenticated dashboard
 * (AppProjectPage) own the data + handlers and render this.
 */
export function OwnerProjectView({
  project,
  feedback,
  filters,
  onFiltersChange,
  copied,
  isUploadingScreenshot,
  actionError,
  banner,
  metaActions,
  onCopyLink,
  onUpvote,
  onStatusChange,
  onDeleteFeedback,
  onSaveOwnerResponse,
  onDeleteOwnerResponse,
  onScreenshotsPicked,
  onScreenshotCaptionInput,
  onScreenshotCaptionBlur,
  onDeleteScreenshot,
}: OwnerProjectViewProps) {
  const filtered = useMemo(() => applyFilters(feedback, filters), [feedback, filters])

  const stats = useMemo(() => {
    const total = feedback.length
    const newCount = feedback.filter((f) => f.status === 'new').length
    const inFlight = feedback.filter((f) => f.status === 'planned' || f.status === 'in-progress').length
    const done = feedback.filter((f) => f.status === 'done').length
    const topVoted = feedback.reduce<Feedback | undefined>((top, item) => {
      if (!top || item.votes > top.votes) return item
      return top
    }, undefined)
    return { total, newCount, inFlight, done, topVoted }
  }, [feedback])

  return (
    <div className="fw-container fw-owner-page" style={{ paddingBottom: 'var(--space-7)' }}>
      <div className="fw-page-header">
        {banner}
        <span className="fw-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>
          owner workspace
        </span>
        <h1>Feedback backlog</h1>
        <p className="fw-page-header-subtitle">
          Prioritize what users actually said, not what your brain invented at 3 a.m.
        </p>

        <div className="fw-card fw-card-padded fw-project-meta fw-owner-project-card">
          <div className="fw-project-info">
            <span className="fw-project-card-kicker">public wall</span>
            <h2>{project.name}</h2>
            <p>{project.description}</p>
            {project.url && (
              <p>
                <a href={project.url} target="_blank" rel="noreferrer">
                  {project.url}
                </a>
              </p>
            )}
            <div className="fw-project-links">
              <Button variant="secondary" size="sm" onClick={onCopyLink}>
                {copied ? 'Copied' : 'Copy public link'}
              </Button>
              <Link to={`/p/${project.publicSlug}`}>
                <Button variant="ghost" size="sm">
                  View public wall
                </Button>
              </Link>
              {metaActions}
            </div>
          </div>
        </div>

        <div className="fw-card fw-card-padded fw-screenshot-panel">
          <div className="fw-board-section-head">
            <span className="fw-chip">visual context</span>
            <h2>Project screenshots</h2>
            <p>Show users what they should react to.</p>
          </div>
          <ImageUpload
            label="Attach screenshots"
            helperText={isUploadingScreenshot ? 'Uploading...' : 'PNG, JPG or WebP, up to 5 images.'}
            maxFiles={MAX_PROJECT_SCREENSHOTS}
            existingCount={project.screenshots?.length ?? 0}
            onChange={onScreenshotsPicked}
          />
          {project.screenshots && project.screenshots.length > 0 && (
            <div className="fw-screenshot-manage-grid">
              {project.screenshots.map((shot) => (
                <div className="fw-screenshot-manage-card" key={shot.id}>
                  <div className="fw-screenshot-manage-image-wrap">
                    <img src={shot.url} alt={shot.caption || shot.name} />
                    <button
                      type="button"
                      className="fw-screenshot-manage-delete"
                      onClick={() => onDeleteScreenshot(shot.id)}
                      aria-label={`Delete screenshot ${shot.name}`}
                    >
                      x
                    </button>
                  </div>
                  <input
                    type="text"
                    className="fw-screenshot-manage-caption-input"
                    placeholder="Add a caption (optional)"
                    value={shot.caption ?? ''}
                    onChange={(e) => onScreenshotCaptionInput(shot.id, e.target.value)}
                    onBlur={(e) => onScreenshotCaptionBlur(shot.id, e.target.value)}
                    aria-label={`Caption for ${shot.name}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {actionError && (
          <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-4)' }}>
            {actionError}
          </p>
        )}
      </div>

      <div className="fw-stats">
        <StatsCard label="Total feedback" value={stats.total} />
        <StatsCard label="New signals" value={stats.newCount} />
        <StatsCard label="Planned / in progress" value={stats.inFlight} />
        <StatsCard label="Done" value={stats.done} />
        <StatsCard label="Top voted" value={stats.topVoted ? `${stats.topVoted.votes} votes` : '-'} />
      </div>

      <div className="fw-board-section-head fw-board-section-head-row">
        <div>
          <span className="fw-chip">feedback queue</span>
          <h2>Signals to triage</h2>
        </div>
      </div>

      <Filters value={filters} onChange={onFiltersChange} showStatusFilter />

      {feedback.length === 0 ? (
        <EmptyState
          eyebrow="waiting for signals"
          title="No feedback yet"
          description="Copy the public link, send it to five people, and ask one direct question: what was confusing?"
          action={
            <Button variant="secondary" onClick={onCopyLink}>
              {copied ? 'Copied' : 'Copy public link'}
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No matching signals." description="Try clearing filters or search." />
      ) : (
        <div className="fw-feedback-list">
          {filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              isOwner
              hasVoted={feedbackRepository.hasVoted(item.id)}
              onUpvote={onUpvote}
              onStatusChange={onStatusChange}
              onDelete={onDeleteFeedback}
              onSaveOwnerResponse={onSaveOwnerResponse}
              onDeleteOwnerResponse={onDeleteOwnerResponse}
            />
          ))}
        </div>
      )}
    </div>
  )
}
