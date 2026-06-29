export type FeedbackType = 'bug' | 'idea' | 'confusing' | 'liked' | 'painful'

export type FeedbackStatus = 'new' | 'planned' | 'in-progress' | 'done' | 'rejected'

export type ProjectCategory =
  | 'web-app'
  | 'mobile-app'
  | 'landing'
  | 'github-project'
  | 'saas'
  | 'game'
  | 'other'

export interface ProjectScreenshot {
  id: string
  name: string
  type: string
  size: number
  /** Renderable image URL — a data: URL in local mode, a Supabase Storage public URL otherwise. */
  url: string
  caption?: string
  createdAt: string
}

export interface Project {
  id: string
  /** URL-safe identifier used in shareable links instead of the raw id. */
  publicSlug: string
  name: string
  url: string
  description: string
  feedbackQuestion?: string
  category: ProjectCategory
  createdAt: string
  screenshots?: ProjectScreenshot[]
}

export interface FeedbackAttachment {
  id: string
  name: string
  type: string
  size: number
  /** Renderable image URL — a data: URL in local mode, a Supabase Storage public URL otherwise. */
  url: string
  createdAt: string
}

export interface OwnerComment {
  id: string
  feedbackId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface Feedback {
  id: string
  projectId: string
  type: FeedbackType
  status: FeedbackStatus
  title: string
  description: string
  authorName: string
  votes: number
  createdAt: string
  updatedAt: string
  attachments?: FeedbackAttachment[]
  ownerResponse?: OwnerComment
}

export type SortOrder = 'newest' | 'top-voted'

export const FEEDBACK_TYPES: FeedbackType[] = ['bug', 'idea', 'confusing', 'liked', 'painful']

export const FEEDBACK_STATUSES: FeedbackStatus[] = [
  'new',
  'planned',
  'in-progress',
  'done',
  'rejected',
]

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'web-app',
  'mobile-app',
  'landing',
  'github-project',
  'saas',
  'game',
  'other',
]

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug',
  idea: 'Idea',
  confusing: 'Confusing',
  liked: 'Liked',
  painful: 'Painful',
}

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: 'New',
  planned: 'Planned',
  'in-progress': 'In progress',
  done: 'Done',
  rejected: 'Rejected',
}

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  'web-app': 'Web app',
  'mobile-app': 'Mobile app',
  landing: 'Landing page',
  'github-project': 'GitHub project',
  saas: 'SaaS',
  game: 'Game',
  other: 'Other',
}
