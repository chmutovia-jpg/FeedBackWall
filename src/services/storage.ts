import type {
  Feedback,
  FeedbackAttachment,
  FeedbackStatus,
  FeedbackType,
  OwnerComment,
  Project,
  ProjectCategory,
  ProjectScreenshot,
} from '../types'
import { generateId } from '../utils/ids'
import { generateOwnerToken, generatePublicSlug } from '../utils/accessTokens'
import { demoProject, demoFeedback, DEMO_OWNER_TOKEN } from '../data/demoData'

const PROJECTS_KEY = 'feedbackwall:projects'
const FEEDBACK_KEY = 'feedbackwall:feedback'
const SEEDED_KEY = 'feedbackwall:seeded'
const VOTED_IDS_KEY = 'feedbackwall:votedFeedbackIds'

/** A freshly picked, not-yet-persisted image — already converted to a data URL. */
export interface PickedFile {
  name: string
  type: string
  size: number
  dataUrl: string
}

/**
 * Local-mode-only field. Never returned from any function below — this is
 * the local-fallback stand-in for Supabase's owner_token_hash column, except
 * unhashed, because there is no real security boundary inside one browser's
 * own localStorage anyway. Real (Supabase) projects hash it server-side.
 */
type StoredProject = Project & { ownerToken: string }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      throw new Error(
        'Local storage is full. Try removing a screenshot or using a smaller image, then send again.',
      )
    }
    throw err
  }
}

function ensureSeeded(): void {
  if (localStorage.getItem(SEEDED_KEY)) return
  const projects = readJson<StoredProject[]>(PROJECTS_KEY, [])
  const feedback = readJson<Feedback[]>(FEEDBACK_KEY, [])
  if (!projects.some((p) => p.id === demoProject.id)) {
    projects.push({ ...demoProject, ownerToken: DEMO_OWNER_TOKEN })
    feedback.push(...demoFeedback)
    writeJson(PROJECTS_KEY, projects)
    writeJson(FEEDBACK_KEY, feedback)
  }
  localStorage.setItem(SEEDED_KEY, 'true')
}

function toPublicProject(stored: StoredProject): Project {
  return {
    id: stored.id,
    publicSlug: stored.publicSlug,
    name: stored.name,
    url: stored.url,
    description: stored.description,
    feedbackQuestion: stored.feedbackQuestion,
    category: stored.category,
    createdAt: stored.createdAt,
    screenshots: stored.screenshots,
  }
}

/**
 * Local-storage backend. This is the v0 implementation and the v1 fallback
 * for whenever Supabase isn't configured — see services/feedbackRepository.ts,
 * which is the only thing pages/components should import from directly.
 */
export const storage = {
  getStoredProjects(): StoredProject[] {
    ensureSeeded()
    return readJson<StoredProject[]>(PROJECTS_KEY, [])
  },

  getProjectBySlug(slug: string): Project | undefined {
    const found = this.getStoredProjects().find((p) => p.publicSlug === slug)
    return found ? toPublicProject(found) : undefined
  },

  getOwnerProjectBySlugAndToken(slug: string, token: string): Project | undefined {
    const found = this.getStoredProjects().find(
      (p) => p.publicSlug === slug && p.ownerToken === token,
    )
    return found ? toPublicProject(found) : undefined
  },

  createProject(input: {
    name: string
    url: string
    description: string
    feedbackQuestion?: string
    category: ProjectCategory
  }): { project: Project; ownerToken: string } {
    const ownerToken = generateOwnerToken()
    const stored: StoredProject = {
      id: generateId('proj'),
      publicSlug: generatePublicSlug(input.name),
      name: input.name.trim(),
      url: input.url.trim(),
      description: input.description.trim(),
      feedbackQuestion: input.feedbackQuestion?.trim() || undefined,
      category: input.category,
      createdAt: new Date().toISOString(),
      ownerToken,
    }
    const projects = this.getStoredProjects()
    projects.push(stored)
    writeJson(PROJECTS_KEY, projects)
    return { project: toPublicProject(stored), ownerToken }
  },

  listFeedback(projectId: string): Feedback[] {
    ensureSeeded()
    return readJson<Feedback[]>(FEEDBACK_KEY, []).filter((f) => f.projectId === projectId)
  },

  createFeedback(input: {
    projectId: string
    type: FeedbackType
    title: string
    description: string
    authorName: string
    attachments?: PickedFile[]
  }): Feedback {
    const now = new Date().toISOString()
    const feedback: Feedback = {
      id: generateId('fb'),
      projectId: input.projectId,
      type: input.type,
      status: 'new',
      title: input.title.trim(),
      description: input.description.trim(),
      authorName: input.authorName.trim() || 'Anonymous',
      votes: 0,
      createdAt: now,
      updatedAt: now,
      attachments: input.attachments?.map<FeedbackAttachment>((file) => ({
        id: generateId('att'),
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.dataUrl,
        createdAt: now,
      })),
    }
    const all = readJson<Feedback[]>(FEEDBACK_KEY, [])
    all.push(feedback)
    writeJson(FEEDBACK_KEY, all)
    return feedback
  },

  hasVoted(feedbackId: string): boolean {
    return readJson<string[]>(VOTED_IDS_KEY, []).includes(feedbackId)
  },

  /**
   * Anonymous, localStorage-only vote cap: one upvote per feedback item per browser.
   * Kept as a purely client-side concept even in Supabase mode (markVoted is reused
   * by feedbackRepository there), since v1 has no real accounts to attribute votes to.
   */
  markVoted(feedbackId: string): void {
    const votedIds = readJson<string[]>(VOTED_IDS_KEY, [])
    if (!votedIds.includes(feedbackId)) {
      writeJson(VOTED_IDS_KEY, [...votedIds, feedbackId])
    }
  },

  upvoteFeedback(feedbackId: string): boolean {
    if (this.hasVoted(feedbackId)) return false

    const all = readJson<Feedback[]>(FEEDBACK_KEY, [])
    const item = all.find((f) => f.id === feedbackId)
    if (!item) return false

    item.votes += 1
    item.updatedAt = new Date().toISOString()
    writeJson(FEEDBACK_KEY, all)
    this.markVoted(feedbackId)
    return true
  },

  updateFeedbackStatus(feedbackId: string, status: FeedbackStatus): void {
    const all = readJson<Feedback[]>(FEEDBACK_KEY, [])
    const item = all.find((f) => f.id === feedbackId)
    if (!item) return
    item.status = status
    item.updatedAt = new Date().toISOString()
    writeJson(FEEDBACK_KEY, all)
  },

  deleteFeedback(feedbackId: string): void {
    const all = readJson<Feedback[]>(FEEDBACK_KEY, [])
    writeJson(FEEDBACK_KEY, all.filter((f) => f.id !== feedbackId))
  },

  /** Owner-only reply to a feedback item. Creates or overwrites the single response. */
  saveOwnerResponse(feedbackId: string, body: string): OwnerComment | undefined {
    const all = readJson<Feedback[]>(FEEDBACK_KEY, [])
    const item = all.find((f) => f.id === feedbackId)
    if (!item) return undefined

    const now = new Date().toISOString()
    item.ownerResponse = {
      id: item.ownerResponse?.id ?? generateId('comment'),
      feedbackId,
      body: body.trim(),
      createdAt: item.ownerResponse?.createdAt ?? now,
      updatedAt: now,
    }
    item.updatedAt = now
    writeJson(FEEDBACK_KEY, all)
    return item.ownerResponse
  },

  deleteOwnerResponse(feedbackId: string): void {
    const all = readJson<Feedback[]>(FEEDBACK_KEY, [])
    const item = all.find((f) => f.id === feedbackId)
    if (!item) return
    delete item.ownerResponse
    item.updatedAt = new Date().toISOString()
    writeJson(FEEDBACK_KEY, all)
  },

  addProjectScreenshot(
    projectId: string,
    file: PickedFile & { caption?: string },
  ): ProjectScreenshot | undefined {
    const projects = this.getStoredProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project) return undefined

    const screenshot: ProjectScreenshot = {
      id: generateId('shot'),
      name: file.name,
      type: file.type,
      size: file.size,
      url: file.dataUrl,
      caption: file.caption,
      createdAt: new Date().toISOString(),
    }
    project.screenshots = [...(project.screenshots ?? []), screenshot]
    writeJson(PROJECTS_KEY, projects)
    return screenshot
  },

  updateProjectScreenshotCaption(projectId: string, screenshotId: string, caption: string): void {
    const projects = this.getStoredProjects()
    const project = projects.find((p) => p.id === projectId)
    const shot = project?.screenshots?.find((s) => s.id === screenshotId)
    if (!shot) return
    shot.caption = caption
    writeJson(PROJECTS_KEY, projects)
  },

  deleteProjectScreenshot(projectId: string, screenshotId: string): void {
    const projects = this.getStoredProjects()
    const project = projects.find((p) => p.id === projectId)
    if (!project?.screenshots) return
    project.screenshots = project.screenshots.filter((s) => s.id !== screenshotId)
    writeJson(PROJECTS_KEY, projects)
  },
}
