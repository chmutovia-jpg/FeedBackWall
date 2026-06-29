import { useState } from 'react'
import { ImagePreviewModal } from './ImagePreviewModal'

export interface AttachmentGridItem {
  id: string
  name: string
  url: string
  caption?: string
}

interface AttachmentGridProps {
  items: AttachmentGridItem[]
  variant?: 'compact' | 'showcase'
}

export function AttachmentGrid({ items, variant = 'compact' }: AttachmentGridProps) {
  const [active, setActive] = useState<AttachmentGridItem | null>(null)

  if (items.length === 0) return null

  if (variant === 'showcase') {
    return (
      <>
        <div className="fw-screenshot-grid">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="fw-screenshot-item"
              onClick={() => setActive(item)}
              aria-label={`View ${item.caption || item.name} full size`}
            >
              <img src={item.url} alt={item.caption || item.name} />
              {item.caption && <span className="fw-screenshot-caption">{item.caption}</span>}
            </button>
          ))}
        </div>
        <ImagePreviewModal image={active} onClose={() => setActive(null)} />
      </>
    )
  }

  return (
    <>
      <div className="fw-attachment-grid">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="fw-attachment-thumb"
            onClick={() => setActive(item)}
            aria-label={`View screenshot ${item.name} full size`}
          >
            <img src={item.url} alt={item.name} />
          </button>
        ))}
      </div>
      <ImagePreviewModal image={active} onClose={() => setActive(null)} />
    </>
  )
}
