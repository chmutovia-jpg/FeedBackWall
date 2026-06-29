import type { ReactNode } from 'react'

interface EmptyStateProps {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ eyebrow, title, description, action }: EmptyStateProps) {
  return (
    <div className="fw-card fw-empty-state">
      {eyebrow && <span className="fw-chip fw-empty-eyebrow">{eyebrow}</span>}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
