import type { FeedbackStatus, FeedbackType } from '../types'
import { FEEDBACK_STATUS_LABELS, FEEDBACK_TYPE_LABELS } from '../types'

export function TypeBadge({ type }: { type: FeedbackType }) {
  return (
    <span className={`fw-badge fw-badge-${type}`}>
      <span className="fw-badge-dot" aria-hidden="true" />
      {FEEDBACK_TYPE_LABELS[type]}
    </span>
  )
}

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span className={`fw-badge fw-badge-${status}`}>
      <span className="fw-badge-dot" aria-hidden="true" />
      {FEEDBACK_STATUS_LABELS[status]}
    </span>
  )
}
