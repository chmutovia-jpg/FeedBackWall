import type { FeedbackStatus, FeedbackType, SortOrder } from '../types'
import { FEEDBACK_STATUS_LABELS, FEEDBACK_TYPE_LABELS } from '../types'

export interface FeedbackFilterState {
  status: FeedbackStatus | 'all'
  type: FeedbackType | 'all'
  sort: SortOrder
  search: string
}

interface FiltersProps {
  value: FeedbackFilterState
  onChange: (next: FeedbackFilterState) => void
  showStatusFilter?: boolean
}

export function Filters({ value, onChange, showStatusFilter = true }: FiltersProps) {
  return (
    <div className="fw-toolbar fw-filter-toolbar" role="search" aria-label="Filter feedback">
      <span className="fw-filter-label">Filter signals</span>
      <input
        type="search"
        className="fw-input"
        placeholder="Search feedback..."
        aria-label="Search feedback"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
      />

      <select
        className="fw-select"
        aria-label="Filter by type"
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value as FeedbackFilterState['type'] })}
      >
        <option value="all">All types</option>
        {Object.entries(FEEDBACK_TYPE_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {showStatusFilter && (
        <select
          className="fw-select"
          aria-label="Filter by status"
          value={value.status}
          onChange={(e) =>
            onChange({ ...value, status: e.target.value as FeedbackFilterState['status'] })
          }
        >
          <option value="all">All statuses</option>
          {Object.entries(FEEDBACK_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      )}

      <select
        className="fw-select"
        aria-label="Sort feedback"
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value as SortOrder })}
      >
        <option value="newest">Newest first</option>
        <option value="top-voted">Top voted</option>
      </select>
    </div>
  )
}

export const DEFAULT_FILTER_STATE: FeedbackFilterState = {
  status: 'all',
  type: 'all',
  sort: 'newest',
  search: '',
}

export function applyFilters<T extends { type: FeedbackType; status: FeedbackStatus; title: string; description: string; votes: number; createdAt: string }>(
  items: T[],
  filters: FeedbackFilterState,
): T[] {
  let result = items.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false
    if (filters.type !== 'all' && item.type !== filters.type) return false
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase()
      const haystack = `${item.title} ${item.description}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  result = [...result].sort((a, b) => {
    if (filters.sort === 'top-voted') return b.votes - a.votes
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return result
}
