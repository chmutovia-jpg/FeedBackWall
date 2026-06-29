import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ProjectCategory } from '../types'
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS } from '../types'
import { Button } from './Button'

interface ProjectFormProps {
  onSubmit: (input: {
    name: string
    url: string
    description: string
    feedbackQuestion?: string
    category: ProjectCategory
  }) => Promise<void> | void
}

interface FormErrors {
  name?: string
  url?: string
  description?: string
}

function looksLikeUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return Boolean(url.protocol === 'http:' || url.protocol === 'https:')
  } catch {
    return false
  }
}

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [feedbackQuestion, setFeedbackQuestion] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('web-app')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!name.trim()) next.name = 'Project name is required.'
    if (!description.trim()) next.description = 'Description is required.'
    if (url.trim() && !looksLikeUrl(url.trim())) {
      next.url = 'Enter a valid URL, e.g. https://your-project.com'
    }
    return next
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        name,
        url: url.trim(),
        description,
        feedbackQuestion: feedbackQuestion.trim(),
        category,
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not create the wall. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="fw-card fw-card-padded fw-project-form" onSubmit={handleSubmit} noValidate>
      <div className="fw-field">
        <label className="fw-label" htmlFor="project-name">
          Project name
        </label>
        <input
          id="project-name"
          type="text"
          className={`fw-input ${errors.name ? 'fw-input-error' : ''}`}
          placeholder="e.g. BetaRoom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'project-name-error' : undefined}
        />
        {errors.name && (
          <span className="fw-error" id="project-name-error">
            {errors.name}
          </span>
        )}
      </div>

      <div className="fw-field">
        <label className="fw-label" htmlFor="project-url">
          Project URL <span className="fw-hint">(optional)</span>
        </label>
        <input
          id="project-url"
          type="text"
          className={`fw-input ${errors.url ? 'fw-input-error' : ''}`}
          placeholder="https://your-project.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-invalid={Boolean(errors.url)}
          aria-describedby={errors.url ? 'project-url-error' : undefined}
        />
        {errors.url && (
          <span className="fw-error" id="project-url-error">
            {errors.url}
          </span>
        )}
      </div>

      <div className="fw-field">
        <label className="fw-label" htmlFor="project-description">
          Short description
        </label>
        <textarea
          id="project-description"
          className={`fw-textarea ${errors.description ? 'fw-input-error' : ''}`}
          placeholder="One or two sentences about what you built"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'project-description-error' : undefined}
        />
        {errors.description && (
          <span className="fw-error" id="project-description-error">
            {errors.description}
          </span>
        )}
      </div>

      <div className="fw-field">
        <label className="fw-label" htmlFor="project-category">
          Category <span className="fw-hint">(optional)</span>
        </label>
        <select
          id="project-category"
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
        <label className="fw-label" htmlFor="project-feedback-question">
          What kind of feedback do you want? <span className="fw-hint">(optional)</span>
        </label>
        <textarea
          id="project-feedback-question"
          className="fw-textarea"
          placeholder="e.g. What was confusing on the first screen?"
          value={feedbackQuestion}
          onChange={(e) => setFeedbackQuestion(e.target.value)}
          aria-describedby="project-feedback-question-helper"
        />
        <span className="fw-hint" id="project-feedback-question-helper">
          Give visitors one focused question to answer.
        </span>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create your wall'}
      </Button>

      {submitError && (
        <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
          {submitError}
        </p>
      )}
    </form>
  )
}
