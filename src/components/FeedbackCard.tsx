import type { Feedback, FeedbackStatus } from '../types'
import { FEEDBACK_STATUSES, FEEDBACK_STATUS_LABELS } from '../types'
import { StatusBadge, TypeBadge } from './Badge'
import { Button } from './Button'
import { AttachmentGrid } from './AttachmentGrid'
import { OwnerResponse } from './OwnerResponse'
import { formatRelativeDate } from '../utils/formatDate'

interface FeedbackCardProps {
  feedback: Feedback
  isOwner?: boolean
  hasVoted?: boolean
  onUpvote: (id: string) => void
  onStatusChange?: (id: string, status: FeedbackStatus) => void
  onDelete?: (id: string) => void
  onSaveOwnerResponse?: (feedbackId: string, body: string) => void
  onDeleteOwnerResponse?: (feedbackId: string) => void
}

export function FeedbackCard({
  feedback,
  isOwner = false,
  hasVoted = false,
  onUpvote,
  onStatusChange,
  onDelete,
  onSaveOwnerResponse,
  onDeleteOwnerResponse,
}: FeedbackCardProps) {
  return (
    <article className="fw-card fw-card-hover fw-feedback-card">
      <div className="fw-feedback-card-top">
        <div className="fw-feedback-badges">
          <TypeBadge type={feedback.type} />
          <StatusBadge status={feedback.status} />
        </div>
        <button
          type="button"
          className={`fw-vote-btn ${hasVoted ? 'fw-vote-btn-voted' : ''}`}
          onClick={() => onUpvote(feedback.id)}
          disabled={hasVoted}
          aria-pressed={hasVoted}
          aria-label={
            hasVoted
              ? `You upvoted "${feedback.title}". Currently ${feedback.votes} votes.`
              : `Upvote "${feedback.title}", currently ${feedback.votes} votes`
          }
        >
          <span className="fw-vote-btn-arrow" aria-hidden="true">▲</span>
          {feedback.votes}
        </button>
      </div>

      <div className="fw-feedback-content">
        <h3 className="fw-feedback-title">{feedback.title}</h3>
        <p className="fw-feedback-desc">{feedback.description}</p>
      </div>

      {feedback.attachments && feedback.attachments.length > 0 && (
        <AttachmentGrid items={feedback.attachments} />
      )}

      <div className="fw-feedback-meta">
        <div className="fw-feedback-meta-left">
          <span>{feedback.authorName || 'Anonymous'}</span>
          <span>{formatRelativeDate(feedback.createdAt)}</span>
        </div>

        {isOwner && (
          <div className="fw-feedback-actions">
            <label className="fw-feedback-action-label" htmlFor={`status-${feedback.id}`}>
              Status
            </label>
            <select
              id={`status-${feedback.id}`}
              className="fw-select"
              value={feedback.status}
              onChange={(e) => onStatusChange?.(feedback.id, e.target.value as FeedbackStatus)}
              aria-label={`Change status for "${feedback.title}"`}
            >
              {FEEDBACK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {FEEDBACK_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete?.(feedback.id)}
              aria-label={`Delete "${feedback.title}"`}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      <OwnerResponse
        feedbackId={feedback.id}
        response={feedback.ownerResponse}
        isOwner={isOwner}
        onSave={onSaveOwnerResponse}
        onDelete={onDeleteOwnerResponse}
      />
    </article>
  )
}
