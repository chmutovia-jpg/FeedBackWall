import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { feedbackRepository } from '../services/feedbackRepository'
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS } from '../types'
import type { Project, ProjectCategory } from '../types'

type LoadStatus = 'loading' | 'denied' | 'ready' | 'error'

function looksLikeUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function buildPublicUrl(slug: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/p/${slug}`
}

export function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()

  const [status, setStatus] = useState<LoadStatus>('loading')
  const [project, setProject] = useState<Project | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [feedbackQuestion, setFeedbackQuestion] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('web-app')

  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
        setProject(proj)
        setName(proj.name)
        setUrl(proj.url)
        setDescription(proj.description)
        setFeedbackQuestion(proj.feedbackQuestion ?? '')
        setCategory(proj.category)
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setLoadError(err instanceof Error ? err.message : 'Could not load project settings.')
        setStatus('error')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [projectId])

  useEffect(() => {
    if (!confirmOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setConfirmOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmOpen])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!project) return
    if (!name.trim()) {
      setFieldError('Project name is required.')
      return
    }
    if (!description.trim()) {
      setFieldError('Description is required.')
      return
    }
    if (url.trim() && !looksLikeUrl(url.trim())) {
      setFieldError('Enter a valid URL, e.g. https://your-project.com')
      return
    }
    setFieldError(null)
    setSaveError(null)
    setSaving(true)
    try {
      const updated = await feedbackRepository.updateProject(project.id, {
        name,
        url,
        description,
        feedbackQuestion,
        category,
      })
      setProject({ ...updated, screenshots: project.screenshots })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSaving(false)
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

  async function handleDelete() {
    if (!project) return
    setDeleteError(null)
    setDeleting(true)
    try {
      await feedbackRepository.deleteProject(project.id)
      navigate('/app')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the project.')
      setDeleting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="fw-container" style={{ paddingTop: 'var(--space-7)' }}>
        <p className="fw-hint" style={{ textAlign: 'center' }}>
          Loading settings…
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
          description={loadError ?? 'Could not load project settings. Please try again.'}
        />
      </div>
    )
  }

  return (
    <div className="fw-container" style={{ maxWidth: 640, paddingBottom: 'var(--space-7)' }}>
      <div className="fw-page-header">
        <div style={{ marginBottom: 'var(--space-3)' }}>
          <Link to={`/app/projects/${project.id}`} className="fw-back-link">
            ← Back to dashboard
          </Link>
        </div>
        <h1>Project settings</h1>
        <p className="fw-page-header-subtitle">
          Update the details people see before they leave feedback.
        </p>
      </div>

      <form className="fw-card fw-card-padded" onSubmit={handleSave} noValidate>
        <div className="fw-field">
          <label className="fw-label" htmlFor="settings-name">
            Project name
          </label>
          <input
            id="settings-name"
            type="text"
            className="fw-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="fw-field">
          <label className="fw-label" htmlFor="settings-url">
            Project URL <span className="fw-hint">(optional)</span>
          </label>
          <input
            id="settings-url"
            type="text"
            className="fw-input"
            placeholder="https://your-project.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="fw-field">
          <label className="fw-label" htmlFor="settings-description">
            Short description
          </label>
          <textarea
            id="settings-description"
            className="fw-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="fw-field">
          <label className="fw-label" htmlFor="settings-category">
            Category
          </label>
          <select
            id="settings-category"
            className="fw-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProjectCategory)}
          >
            {PROJECT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {PROJECT_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        <div className="fw-field">
          <label className="fw-label" htmlFor="settings-feedback-question">
            What kind of feedback do you want? <span className="fw-hint">(optional)</span>
          </label>
          <textarea
            id="settings-feedback-question"
            className="fw-textarea"
            placeholder="e.g. What was confusing on the first screen?"
            value={feedbackQuestion}
            onChange={(e) => setFeedbackQuestion(e.target.value)}
            aria-describedby="settings-feedback-question-helper"
          />
          <span className="fw-hint" id="settings-feedback-question-helper">
            Give visitors one focused question to answer.
          </span>
        </div>

        <div className="fw-settings-actions">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          <Button type="button" variant="secondary" size="md" onClick={handleCopyLink}>
            {copied ? 'Copied' : 'Copy public link'}
          </Button>
          <Link to={`/p/${project.publicSlug}`}>
            <Button type="button" variant="ghost">
              Open public wall
            </Button>
          </Link>
        </div>

        {fieldError && (
          <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
            {fieldError}
          </p>
        )}
        {saveError && (
          <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
            {saveError}
          </p>
        )}
        {saved && (
          <p className="fw-copy-feedback" role="status" style={{ marginTop: 'var(--space-3)' }}>
            Saved.
          </p>
        )}
      </form>

      <div className="fw-card fw-card-padded fw-danger-zone">
        <h2 style={{ fontSize: '1.05rem' }}>Delete this wall</h2>
        <p className="fw-hint" style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
          Permanently removes the project, all its feedback, responses and screenshots. This
          can't be undone.
        </p>
        <Button
          variant="danger"
          onClick={() => {
            setConfirmText('')
            setDeleteError(null)
            setConfirmOpen(true)
          }}
        >
          Delete project
        </Button>
      </div>

      {confirmOpen && (
        <div
          className="fw-modal-backdrop"
          role="presentation"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="fw-card fw-card-padded fw-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm project deletion"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.1rem' }}>Delete “{project.name}”?</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
              Type the project name <strong>{project.name}</strong> to confirm.
            </p>
            <input
              type="text"
              className="fw-input"
              style={{ marginTop: 'var(--space-3)' }}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              aria-label="Type the project name to confirm deletion"
              autoFocus
            />
            <div className="fw-settings-actions" style={{ marginTop: 'var(--space-4)' }}>
              <Button
                variant="danger"
                disabled={confirmText.trim() !== project.name || deleting}
                onClick={handleDelete}
              >
                {deleting ? 'Deleting…' : 'Delete forever'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
            </div>
            {deleteError && (
              <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
                {deleteError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
