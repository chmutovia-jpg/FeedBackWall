import { useState } from 'react'
import type { FormEvent } from 'react'
import type { FeedbackType } from '../types'
import { FEEDBACK_TYPE_LABELS, FEEDBACK_TYPES } from '../types'
import { Button } from './Button'
import { ImageUpload } from './ImageUpload'
import type { PickedImage } from './ImageUpload'
import { MAX_FEEDBACK_ATTACHMENTS, formatFileSize } from '../utils/fileToDataUrl'
import { generateId } from '../utils/ids'

interface StagedFile extends PickedImage {
  tempId: string
}

interface FeedbackFormProps {
  feedbackQuestion?: string
  onSubmit: (input: {
    type: FeedbackType
    title: string
    description: string
    authorName: string
    attachments: PickedImage[]
  }) => Promise<void> | void
}

interface FormErrors {
  type?: string
  title?: string
  description?: string
}

const FRIENDLY_SUBMIT_ERROR =
  'Не удалось отправить фидбек. Попробуй еще раз или проверь интернет.'

export function FeedbackForm({ feedbackQuestion, onSubmit }: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType | ''>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [attachments, setAttachments] = useState<StagedFile[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!type) next.type = 'Please choose a feedback type.'
    if (!title.trim()) next.title = 'Title is required.'
    if (!description.trim()) next.description = 'Description is required.'
    return next
  }

  function handleAttachmentsPicked(files: PickedImage[]) {
    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({ ...file, tempId: generateId('staged') })),
    ])
  }

  function removeAttachment(tempId: string) {
    setAttachments((current) => current.filter((file) => file.tempId !== tempId))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !type) return

    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({
        type,
        title,
        description,
        authorName,
        attachments: attachments.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: file.dataUrl,
        })),
      })

      setType('')
      setTitle('')
      setDescription('')
      setAuthorName('')
      setAttachments([])
      setErrors({})
      setShowSuccess(true)
      window.setTimeout(() => setShowSuccess(false), 3500)
    } catch (err) {
      console.error('[FeedbackWall] feedback submit failed', err)
      setSubmitError(FRIENDLY_SUBMIT_ERROR)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="fw-card fw-card-padded fw-feedback-form" onSubmit={handleSubmit} noValidate>
      <h3>Leave a signal</h3>
      <p className="fw-hint" style={{ marginTop: 'var(--space-1)', marginBottom: 'var(--space-4)' }}>
        What should the maker fix, clarify, or keep?
      </p>

      {feedbackQuestion?.trim() && (
        <div className="fw-maker-question">
          <span className="fw-chip">the maker is asking</span>
          <h4>The maker is asking</h4>
          <p>{feedbackQuestion}</p>
        </div>
      )}

      <div className="fw-feedback-tip">
        <span className="fw-chip">feedback tip</span>
        <h4>Good feedback is specific</h4>
        <p>
          Instead of "looks weird", try "the pricing button was hard to find on mobile".
          Screenshots help the maker see exactly what you saw.
        </p>
      </div>

      <div className="fw-field">
        <label className="fw-label" htmlFor="feedback-type">
          Feedback type
        </label>
        <select
          id="feedback-type"
          className={`fw-select ${errors.type ? 'fw-input-error' : ''}`}
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          aria-invalid={Boolean(errors.type)}
          aria-describedby={errors.type ? 'feedback-type-error' : undefined}
        >
          <option value="">Select a type...</option>
          {FEEDBACK_TYPES.map((t) => (
            <option key={t} value={t}>
              {FEEDBACK_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        {errors.type && (
          <span className="fw-error" id="feedback-type-error">
            {errors.type}
          </span>
        )}
      </div>

      <div className="fw-field">
        <label className="fw-label" htmlFor="feedback-title">
          Title
        </label>
        <input
          id="feedback-title"
          type="text"
          className={`fw-input ${errors.title ? 'fw-input-error' : ''}`}
          placeholder="e.g. Mobile menu overlaps the title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'feedback-title-error' : undefined}
        />
        {errors.title && (
          <span className="fw-error" id="feedback-title-error">
            {errors.title}
          </span>
        )}
      </div>

      <div className="fw-field">
        <label className="fw-label" htmlFor="feedback-description">
          Description
        </label>
        <textarea
          id="feedback-description"
          className={`fw-textarea ${errors.description ? 'fw-input-error' : ''}`}
          placeholder="What happened, what you expected, or what you'd love to see instead."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'feedback-description-error' : undefined}
        />
        {errors.description && (
          <span className="fw-error" id="feedback-description-error">
            {errors.description}
          </span>
        )}
      </div>

      <div className="fw-field">
        <label className="fw-label" htmlFor="feedback-author">
          Your name <span className="fw-hint">(optional)</span>
        </label>
        <input
          id="feedback-author"
          type="text"
          className="fw-input"
          placeholder="Anonymous"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </div>

      <ImageUpload
        label="Screenshots"
        helperText="Optional. PNG, JPG or WebP, up to 3 images."
        maxFiles={MAX_FEEDBACK_ATTACHMENTS}
        existingCount={attachments.length}
        onChange={handleAttachmentsPicked}
      />

      {attachments.length > 0 && (
        <div className="fw-file-list">
          {attachments.map((file) => (
            <div className="fw-file-chip" key={file.tempId}>
              <span className="fw-file-chip-name">{file.name}</span>
              <span className="fw-file-chip-size">{formatFileSize(file.size)}</span>
              <button
                type="button"
                className="fw-file-chip-remove"
                onClick={() => removeAttachment(file.tempId)}
                aria-label={`Remove ${file.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} style={{ marginTop: 'var(--space-4)' }}>
        {isSubmitting ? 'Sending…' : 'Send signal'}
      </Button>

      {submitError && (
        <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
          {submitError}
        </p>
      )}

      {showSuccess && (
        <p className="fw-copy-feedback" role="status" style={{ marginTop: 'var(--space-3)' }}>
          Sent. Your signal is live on the wall.
        </p>
      )}
    </form>
  )
}
