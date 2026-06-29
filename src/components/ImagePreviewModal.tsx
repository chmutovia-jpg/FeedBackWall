import { useEffect, useRef } from 'react'

export interface PreviewImage {
  url: string
  name: string
  caption?: string
}

interface ImagePreviewModalProps {
  image: PreviewImage | null
  onClose: () => void
}

export function ImagePreviewModal({ image, onClose }: ImagePreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!image) return
    closeButtonRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [image, onClose])

  if (!image) return null

  return (
    <div
      className="fw-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="fw-modal"
        role="dialog"
        aria-modal="true"
        aria-label={image.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="fw-modal-close"
          onClick={onClose}
          aria-label="Close preview"
        >
          ✕
        </button>
        <img src={image.url} alt={image.caption || image.name} />
        <div className="fw-modal-footer">
          <span className="fw-modal-filename">{image.caption || image.name}</span>
        </div>
      </div>
    </div>
  )
}
