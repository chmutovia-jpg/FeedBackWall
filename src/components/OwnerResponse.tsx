import { useState } from 'react'
import type { OwnerComment } from '../types'
import { Button } from './Button'
import { formatRelativeDate } from '../utils/formatDate'

interface OwnerResponseProps {
  feedbackId: string
  response?: OwnerComment
  isOwner: boolean
  onSave?: (feedbackId: string, body: string) => void
  onDelete?: (feedbackId: string) => void
}

function ReplyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 17l-5-5 5-5M4 12h11a5 5 0 0 1 5 5v1" />
    </svg>
  )
}

export function OwnerResponse({ feedbackId, response, isOwner, onSave, onDelete }: OwnerResponseProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')

  if (!isOwner) {
    if (!response) return null
    return (
      <div className="fw-owner-response">
        <div className="fw-owner-response-label">
          <ReplyIcon />
          Maker response
        </div>
        <p className="fw-owner-response-body">{response.body}</p>
        <div className="fw-owner-response-date">{formatRelativeDate(response.updatedAt)}</div>
      </div>
    )
  }

  if (response && !isEditing) {
    return (
      <div className="fw-owner-response">
        <div className="fw-owner-response-label">
          <ReplyIcon />
          Maker response
        </div>
        <p className="fw-owner-response-body">{response.body}</p>
        <div className="fw-owner-response-date">{formatRelativeDate(response.updatedAt)}</div>
        <div className="fw-owner-response-actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraft(response.body)
              setIsEditing(true)
            }}
          >
            Edit response
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete?.(feedbackId)}>
            Delete response
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fw-owner-response-form">
      <textarea
        className="fw-textarea"
        aria-label="Maker response"
        placeholder="Reply to this feedback…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={2}
        autoFocus={isEditing}
      />
      <div className="fw-owner-response-actions">
        <Button
          size="sm"
          disabled={!draft.trim()}
          onClick={() => {
            if (!draft.trim()) return
            onSave?.(feedbackId, draft.trim())
            setDraft('')
            setIsEditing(false)
          }}
        >
          {response ? 'Save response' : 'Add response'}
        </Button>
        {isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
