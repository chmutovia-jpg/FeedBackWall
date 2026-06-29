import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'
import type { Project } from '../types'

interface CreatedWallSuccessProps {
  project: Project
  dashboardTo: string
  ownerLink?: string
}

function buildPublicUrl(slug: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/p/${slug}`
}

function buildInviteMessage(project: Project, publicUrl: string): string {
  const ask = project.feedbackQuestion?.trim()
  const focusedAsk = ask
    ? `can you open this wall and answer one thing: ${ask}`
    : 'can you open this wall and tell me what feels confusing, broken, or worth improving?'

  return `hey, i just launched a small project and I'm collecting honest feedback.
${focusedAsk}

${publicUrl}`
}

const SUCCESS_STEPS = ['Copy the public link', 'Send it to 5 people', 'Ask one focused question']

export function CreatedWallSuccess({ project, dashboardTo, ownerLink }: CreatedWallSuccessProps) {
  const publicUrl = useMemo(() => buildPublicUrl(project.publicSlug), [project.publicSlug])
  const inviteMessage = useMemo(() => buildInviteMessage(project, publicUrl), [project, publicUrl])
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [copiedOwner, setCopiedOwner] = useState(false)

  async function copyText(text: string, onCopied: (copied: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Clipboard can be unavailable in some browser contexts; visible text remains selectable.
    }
    onCopied(true)
    window.setTimeout(() => onCopied(false), 2000)
  }

  return (
    <div className="fw-container fw-created-page">
      <div className="fw-created-card fw-glass">
        <div className="fw-created-copy">
          <span className="fw-eyebrow">first signal</span>
          <h1>Wall created</h1>
          <p>Now send it to a few people and collect your first useful signal.</p>
        </div>

        <div className="fw-created-link-panel">
          <label className="fw-label" htmlFor="created-public-link">
            Public wall link
          </label>
          <div className="fw-link-row">
            <input
              id="created-public-link"
              className="fw-input"
              readOnly
              value={publicUrl}
              onFocus={(e) => e.target.select()}
            />
            <Button variant="secondary" size="sm" onClick={() => copyText(publicUrl, setCopiedPublic)}>
              {copiedPublic ? 'Copied' : 'Copy public link'}
            </Button>
          </div>
        </div>

        <div className="fw-created-checklist" aria-label="First signal checklist">
          {SUCCESS_STEPS.map((step, index) => (
            <div className="fw-created-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>

        <div className="fw-created-actions">
          <Button onClick={() => copyText(publicUrl, setCopiedPublic)}>
            {copiedPublic ? 'Copied' : 'Copy public link'}
          </Button>
          <Link to={`/p/${project.publicSlug}`}>
            <Button variant="secondary">Open public wall</Button>
          </Link>
          <Link to={dashboardTo}>
            <Button variant="ghost">Go to dashboard</Button>
          </Link>
          <Button variant="ghost" onClick={() => copyText(inviteMessage, setCopiedInvite)}>
            {copiedInvite ? 'Copied' : 'Copy invite message'}
          </Button>
        </div>

        <div className="fw-created-message">
          <span className="fw-chip">invite message</span>
          <pre>{inviteMessage}</pre>
        </div>

        {ownerLink && (
          <div className="fw-created-owner-link">
            <label className="fw-label" htmlFor="created-owner-link">
              Owner dashboard link - keep this private
            </label>
            <div className="fw-link-row">
              <input
                id="created-owner-link"
                className="fw-input"
                readOnly
                value={ownerLink}
                onFocus={(e) => e.target.select()}
              />
              <Button variant="secondary" size="sm" onClick={() => copyText(ownerLink, setCopiedOwner)}>
                {copiedOwner ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <span className="fw-hint">
              Anyone with this private link can manage this local wall.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
