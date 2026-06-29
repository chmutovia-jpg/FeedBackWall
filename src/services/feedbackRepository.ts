import type { User } from '@supabase/supabase-js'
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
import { storage } from './storage'
import type { PickedFile } from './storage'
import { isSupabaseConfigured, supabase } from './supabaseClient'
import { generateOwnerToken, generatePublicSlug, sha256Hex } from '../utils/accessTokens'
import { dataUrlToBlob } from '../utils/fileToDataUrl'
import { generateId } from '../utils/ids'

export { isSupabaseConfigured }
export type { PickedFile }

const STORAGE_BUCKET = 'feedbackwall-screenshots'

export interface CreateProjectResult {
  project: Project
  ownerToken: string
}

/** A project plus the feedback counts shown on its dashboard card. */
export interface ProjectWithStats extends Project {
  feedbackTotal: number
  feedbackNew: number
  feedbackDone: number
}

export interface DashboardData {
  projects: ProjectWithStats[]
  totalWalls: number
  totalFeedback: number
  newSignals: number
  doneItems: number
}

// ----------------------------------------------------------------------------
// Status value mapping: the app's UI/CSS uses hyphenated status values
// ('in-progress') everywhere; the Supabase schema uses underscored ones
// ('in_progress') to follow SQL identifier conventions. This is the only
// place that needs to know both spellings exist.
// ----------------------------------------------------------------------------

function toDbStatus(status: FeedbackStatus): string {
  return status === 'in-progress' ? 'in_progress' : status
}

function fromDbStatus(dbStatus: string): FeedbackStatus {
  return dbStatus === 'in_progress' ? 'in-progress' : (dbStatus as FeedbackStatus)
}

// ----------------------------------------------------------------------------
// Row -> app-type mapping (snake_case DB rows -> camelCase app types)
// ----------------------------------------------------------------------------

interface ProjectRow {
  id: string
  public_slug: string
  name: string
  url: string | null
  description: string
  feedback_question: string | null
  category: string | null
  created_at: string
}

interface FeedbackRow {
  id: string
  project_id: string
  type: string
  status: string
  title: string
  description: string
  author_name: string | null
  votes: number
  created_at: string
  updated_at: string
  feedback_attachments?: AttachmentRow[]
  owner_comments?: OwnerCommentRow[] | OwnerCommentRow | null
}

interface OwnerCommentRow {
  id: string
  feedback_id: string
  body: string
  created_at: string
  updated_at: string
}

interface AttachmentRow {
  id: string
  file_path: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
}

interface ScreenshotRow {
  id: string
  file_path: string
  file_url: string
  file_name: string
  file_type: string
  file_size: number
  caption: string | null
  created_at: string
}

function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    publicSlug: row.public_slug,
    name: row.name,
    url: row.url ?? '',
    description: row.description,
    feedbackQuestion: row.feedback_question ?? undefined,
    category: (row.category ?? 'other') as ProjectCategory,
    createdAt: row.created_at,
  }
}

function mapOwnerCommentRow(row: OwnerCommentRow): OwnerComment {
  return {
    id: row.id,
    feedbackId: row.feedback_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function extractOwnerComment(value: FeedbackRow['owner_comments']): OwnerComment | undefined {
  if (!value) return undefined
  const row = Array.isArray(value) ? value[0] : value
  return row ? mapOwnerCommentRow(row) : undefined
}

function mapAttachmentRow(row: AttachmentRow): FeedbackAttachment {
  return {
    id: row.id,
    name: row.file_name,
    type: row.file_type,
    size: row.file_size,
    url: row.file_url,
    createdAt: row.created_at,
  }
}

function mapScreenshotRow(row: ScreenshotRow): ProjectScreenshot {
  return {
    id: row.id,
    name: row.file_name,
    type: row.file_type,
    size: row.file_size,
    url: row.file_url,
    caption: row.caption ?? undefined,
    createdAt: row.created_at,
  }
}

function mapFeedbackRow(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type as FeedbackType,
    status: fromDbStatus(row.status),
    title: row.title,
    description: row.description,
    authorName: row.author_name ?? 'Anonymous',
    votes: row.votes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    attachments: row.feedback_attachments?.length
      ? row.feedback_attachments.map(mapAttachmentRow)
      : undefined,
    ownerResponse: extractOwnerComment(row.owner_comments),
  }
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function requireData<T>(data: T | null, error: { message: string } | null, notFoundMessage: string): T {
  if (error) throw new Error(error.message)
  if (data === null) throw new Error(notFoundMessage)
  return data
}

/**
 * The signed-in user's id, read from the locally cached session (no network).
 * RLS is the real ownership boundary on every query/mutation below — this id
 * is only used to scope/filter queries to the right rows for a good UX.
 */
async function currentUserId(): Promise<string> {
  const client = requireSupabase()
  const { data } = await client.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new Error('You must be signed in to do that.')
  return id
}

const OWNER_PROJECT_COLUMNS =
  'id, public_slug, name, url, description, feedback_question, category, created_at'

async function uploadImageToStorage(
  file: PickedFile,
  folder: string,
): Promise<{ path: string; url: string }> {
  const client = requireSupabase()
  const extension = file.type.split('/')[1] || 'png'
  const path = `${folder}/${generateId('img')}.${extension}`
  const blob = dataUrlToBlob(file.dataUrl)

  const { error: uploadError } = await client.storage
    .from(STORAGE_BUCKET)
    .upload(path, blob, { contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)

  const { data } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

async function fetchProjectScreenshots(projectId: string): Promise<ProjectScreenshot[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('project_screenshots')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapScreenshotRow)
}

async function upsertOwnerComment(
  feedbackId: string,
  token: string,
  body: string,
): Promise<OwnerComment> {
  if (!isSupabaseConfigured) {
    const saved = storage.saveOwnerResponse(feedbackId, body)
    if (!saved) throw new Error('Feedback not found.')
    return saved
  }
  const client = requireSupabase()
  const { data, error } = await client
    .rpc('owner_save_comment', { p_feedback_id: feedbackId, p_token: token, p_body: body })
    .single()
  const row = requireData(data, error, 'Owner token invalid, or feedback not found.')
  return mapOwnerCommentRow(row as OwnerCommentRow)
}

/**
 * Repository facade: every page/component should import from here, never
 * from ./storage or ./supabaseClient directly. It transparently uses
 * Supabase when VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are set, and falls
 * back to localStorage (services/storage.ts) otherwise — see README
 * "Supabase setup" for what that fallback means in practice.
 */
export const feedbackRepository = {
  async createProject(input: {
    name: string
    url: string
    description: string
    feedbackQuestion?: string
    category: ProjectCategory
  }): Promise<CreateProjectResult> {
    if (!isSupabaseConfigured) return storage.createProject(input)

    const client = requireSupabase()
    const ownerToken = generateOwnerToken()
    const ownerTokenHash = await sha256Hex(ownerToken)
    const publicSlug = generatePublicSlug(input.name)

    const { data, error } = await client
      .from('projects')
      .insert({
        public_slug: publicSlug,
        owner_token_hash: ownerTokenHash,
        name: input.name.trim(),
        url: input.url.trim() || null,
        description: input.description.trim(),
        feedback_question: input.feedbackQuestion?.trim() || null,
        category: input.category,
      })
      .select(OWNER_PROJECT_COLUMNS)
      .single()

    const row = requireData(data, error, 'Could not create project.')
    return { project: mapProjectRow(row as ProjectRow), ownerToken }
  },

  async getProjectBySlug(slug: string): Promise<Project | undefined> {
    if (!isSupabaseConfigured) return storage.getProjectBySlug(slug)

    const client = requireSupabase()
    const { data, error } = await client
      .from('projects')
      .select(OWNER_PROJECT_COLUMNS)
      .eq('public_slug', slug)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return undefined

    const project = mapProjectRow(data as ProjectRow)
    project.screenshots = await fetchProjectScreenshots(project.id)
    return project
  },

  async getOwnerProjectBySlugAndToken(slug: string, token: string): Promise<Project | undefined> {
    if (!isSupabaseConfigured) return storage.getOwnerProjectBySlugAndToken(slug, token)

    const client = requireSupabase()
    const { data, error } = await client
      .rpc('get_owner_project', { p_public_slug: slug, p_token: token })
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return undefined

    const project = mapProjectRow(data as ProjectRow)
    project.screenshots = await fetchProjectScreenshots(project.id)
    return project
  },

  async listFeedback(projectId: string): Promise<Feedback[]> {
    if (!isSupabaseConfigured) return storage.listFeedback(projectId)

    const client = requireSupabase()
    const { data, error } = await client
      .from('feedback')
      .select('*, feedback_attachments(*), owner_comments(*)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => mapFeedbackRow(row as FeedbackRow))
  },

  async createFeedback(input: {
    projectId: string
    type: FeedbackType
    title: string
    description: string
    authorName: string
    attachments?: PickedFile[]
  }): Promise<Feedback> {
    if (!isSupabaseConfigured) return storage.createFeedback(input)

    const client = requireSupabase()
    const { data, error } = await client
      .from('feedback')
      .insert({
        project_id: input.projectId,
        type: input.type,
        title: input.title.trim(),
        description: input.description.trim(),
        author_name: input.authorName.trim() || null,
      })
      .select('*')
      .single()

    const row = requireData(data, error, 'Could not save feedback.')
    const feedback = mapFeedbackRow(row as FeedbackRow)

    if (input.attachments?.length) {
      const attachments: FeedbackAttachment[] = []
      for (const file of input.attachments) {
        attachments.push(await this.uploadFeedbackAttachment(feedback.id, file))
      }
      feedback.attachments = attachments
    }

    return feedback
  },

  hasVoted(feedbackId: string): boolean {
    return storage.hasVoted(feedbackId)
  },

  async upvoteFeedback(feedbackId: string): Promise<boolean> {
    if (storage.hasVoted(feedbackId)) return false

    if (!isSupabaseConfigured) return storage.upvoteFeedback(feedbackId)

    const client = requireSupabase()
    const { error } = await client.rpc('upvote_feedback', { p_feedback_id: feedbackId })
    if (error) throw new Error(error.message)
    storage.markVoted(feedbackId)
    return true
  },

  async updateFeedbackStatus(feedbackId: string, token: string, status: FeedbackStatus): Promise<void> {
    if (!isSupabaseConfigured) {
      storage.updateFeedbackStatus(feedbackId, status)
      return
    }
    const client = requireSupabase()
    const { error } = await client.rpc('owner_update_feedback_status', {
      p_feedback_id: feedbackId,
      p_token: token,
      p_status: toDbStatus(status),
    })
    if (error) throw new Error(error.message)
  },

  async deleteFeedback(feedbackId: string, token: string): Promise<void> {
    if (!isSupabaseConfigured) {
      storage.deleteFeedback(feedbackId)
      return
    }
    const client = requireSupabase()
    const { error } = await client.rpc('owner_delete_feedback', {
      p_feedback_id: feedbackId,
      p_token: token,
    })
    if (error) throw new Error(error.message)
  },

  async addOwnerComment(feedbackId: string, token: string, body: string): Promise<OwnerComment> {
    return upsertOwnerComment(feedbackId, token, body)
  },

  async updateOwnerComment(feedbackId: string, token: string, body: string): Promise<OwnerComment> {
    return upsertOwnerComment(feedbackId, token, body)
  },

  async deleteOwnerComment(feedbackId: string, token: string): Promise<void> {
    if (!isSupabaseConfigured) {
      storage.deleteOwnerResponse(feedbackId)
      return
    }
    const client = requireSupabase()
    const { error } = await client.rpc('owner_delete_comment', {
      p_feedback_id: feedbackId,
      p_token: token,
    })
    if (error) throw new Error(error.message)
  },

  async uploadFeedbackAttachment(feedbackId: string, file: PickedFile): Promise<FeedbackAttachment> {
    if (!isSupabaseConfigured) {
      throw new Error('uploadFeedbackAttachment requires Supabase to be configured.')
    }
    const client = requireSupabase()
    const { path, url } = await uploadImageToStorage(file, `feedback/${feedbackId}`)
    const { data, error } = await client
      .from('feedback_attachments')
      .insert({
        feedback_id: feedbackId,
        file_path: path,
        file_url: url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      })
      .select('*')
      .single()
    const row = requireData(data, error, 'Could not save the attachment.')
    return mapAttachmentRow(row as AttachmentRow)
  },

  async uploadProjectScreenshot(
    projectId: string,
    token: string,
    file: PickedFile,
    caption?: string,
  ): Promise<ProjectScreenshot> {
    if (!isSupabaseConfigured) {
      const saved = storage.addProjectScreenshot(projectId, { ...file, caption })
      if (!saved) throw new Error('Project not found.')
      return saved
    }

    const client = requireSupabase()
    const { path, url } = await uploadImageToStorage(file, `projects/${projectId}`)
    const { data, error } = await client
      .rpc('owner_add_project_screenshot', {
        p_project_id: projectId,
        p_token: token,
        p_file_path: path,
        p_file_url: url,
        p_file_name: file.name,
        p_file_type: file.type,
        p_file_size: file.size,
        p_caption: caption ?? null,
      })
      .single()
    const row = requireData(data, error, 'Owner token invalid, or project not found.')
    return mapScreenshotRow(row as ScreenshotRow)
  },

  async updateProjectScreenshotCaption(
    projectId: string,
    token: string,
    screenshotId: string,
    caption: string,
  ): Promise<void> {
    if (!isSupabaseConfigured) {
      storage.updateProjectScreenshotCaption(projectId, screenshotId, caption)
      return
    }
    const client = requireSupabase()
    const { error } = await client.rpc('owner_update_screenshot_caption', {
      p_screenshot_id: screenshotId,
      p_token: token,
      p_caption: caption,
    })
    if (error) throw new Error(error.message)
  },

  async deleteProjectScreenshot(projectId: string, token: string, screenshotId: string): Promise<void> {
    if (!isSupabaseConfigured) {
      storage.deleteProjectScreenshot(projectId, screenshotId)
      return
    }
    const client = requireSupabase()
    const { data, error } = await client
      .rpc('owner_delete_project_screenshot', { p_screenshot_id: screenshotId, p_token: token })
      .single()
    const row = requireData(data, error, 'Owner token invalid, or screenshot not found.')
    await client.storage.from(STORAGE_BUCKET).remove([(row as ScreenshotRow).file_path])
  },

  // ==========================================================================
  // Authenticated workspace (v1.5). Everything below requires Supabase + a
  // signed-in user, and relies on auth.uid() RLS policies for ownership —
  // there is no token. The token methods above are left intact for legacy
  // owner-link projects and the localStorage demo.
  // ==========================================================================

  async getCurrentUser(): Promise<User | null> {
    if (!supabase) return null
    const { data } = await supabase.auth.getUser()
    return data.user
  },

  async getUserProjects(): Promise<Project[]> {
    const client = requireSupabase()
    const userId = await currentUserId()
    const { data, error } = await client
      .from('projects')
      .select(OWNER_PROJECT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row) => mapProjectRow(row as ProjectRow))
  },

  async createProjectForUser(input: {
    name: string
    url: string
    description: string
    feedbackQuestion?: string
    category: ProjectCategory
  }): Promise<Project> {
    const client = requireSupabase()
    const userId = await currentUserId()
    const { data, error } = await client
      .from('projects')
      .insert({
        user_id: userId,
        public_slug: generatePublicSlug(input.name),
        name: input.name.trim(),
        url: input.url.trim() || null,
        description: input.description.trim(),
        feedback_question: input.feedbackQuestion?.trim() || null,
        category: input.category,
      })
      .select(OWNER_PROJECT_COLUMNS)
      .single()
    const row = requireData(data, error, 'Could not create project.')
    return mapProjectRow(row as ProjectRow)
  },

  /** Loads a project the current user owns (by id). Returns undefined if not theirs. */
  async getOwnerProjectById(projectId: string): Promise<Project | undefined> {
    const client = requireSupabase()
    const userId = await currentUserId()
    const { data, error } = await client
      .from('projects')
      .select(OWNER_PROJECT_COLUMNS)
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return undefined
    const project = mapProjectRow(data as ProjectRow)
    project.screenshots = await fetchProjectScreenshots(project.id)
    return project
  },

  async updateProject(
    projectId: string,
    input: {
      name: string
      url: string
      description: string
      feedbackQuestion?: string
      category: ProjectCategory
    },
  ): Promise<Project> {
    const client = requireSupabase()
    const userId = await currentUserId()
    const { data, error } = await client
      .from('projects')
      .update({
        name: input.name.trim(),
        url: input.url.trim() || null,
        description: input.description.trim(),
        feedback_question: input.feedbackQuestion?.trim() || null,
        category: input.category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select(OWNER_PROJECT_COLUMNS)
      .single()
    const row = requireData(data, error, 'Could not update the project, or it is not yours.')
    return mapProjectRow(row as ProjectRow)
  },

  async deleteProject(projectId: string): Promise<void> {
    const client = requireSupabase()
    const userId = await currentUserId()
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  /** Dashboard projects + per-project and aggregate feedback counts, scoped to the user. */
  async getDashboardStats(): Promise<DashboardData> {
    const client = requireSupabase()
    const userId = await currentUserId()
    const { data: projectRows, error: projectError } = await client
      .from('projects')
      .select(OWNER_PROJECT_COLUMNS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (projectError) throw new Error(projectError.message)

    const projects = (projectRows ?? []).map((row) => mapProjectRow(row as ProjectRow))
    const ids = projects.map((p) => p.id)

    const counts = new Map<string, { total: number; newCount: number; done: number }>()
    ids.forEach((id) => counts.set(id, { total: 0, newCount: 0, done: 0 }))

    if (ids.length > 0) {
      const { data: feedbackRows, error: feedbackError } = await client
        .from('feedback')
        .select('status, project_id')
        .in('project_id', ids)
      if (feedbackError) throw new Error(feedbackError.message)

      for (const row of feedbackRows ?? []) {
        const bucket = counts.get((row as { project_id: string }).project_id)
        if (!bucket) continue
        bucket.total += 1
        const status = (row as { status: string }).status
        if (status === 'new') bucket.newCount += 1
        if (status === 'done') bucket.done += 1
      }
    }

    const withStats: ProjectWithStats[] = projects.map((p) => {
      const c = counts.get(p.id) ?? { total: 0, newCount: 0, done: 0 }
      return { ...p, feedbackTotal: c.total, feedbackNew: c.newCount, feedbackDone: c.done }
    })

    return {
      projects: withStats,
      totalWalls: withStats.length,
      totalFeedback: withStats.reduce((sum, p) => sum + p.feedbackTotal, 0),
      newSignals: withStats.reduce((sum, p) => sum + p.feedbackNew, 0),
      doneItems: withStats.reduce((sum, p) => sum + p.feedbackDone, 0),
    }
  },

  async authUpdateFeedbackStatus(feedbackId: string, status: FeedbackStatus): Promise<void> {
    const client = requireSupabase()
    const { error } = await client
      .from('feedback')
      .update({ status: toDbStatus(status), updated_at: new Date().toISOString() })
      .eq('id', feedbackId)
    if (error) throw new Error(error.message)
  },

  async authDeleteFeedback(feedbackId: string): Promise<void> {
    const client = requireSupabase()
    const { error } = await client.from('feedback').delete().eq('id', feedbackId)
    if (error) throw new Error(error.message)
  },

  async authSaveOwnerComment(
    feedbackId: string,
    body: string,
    hasExisting: boolean,
  ): Promise<OwnerComment> {
    const client = requireSupabase()
    // Separate insert/update paths (rather than upsert) so each only touches
    // the columns its grant allows.
    if (hasExisting) {
      const { data, error } = await client
        .from('owner_comments')
        .update({ body: body.trim(), updated_at: new Date().toISOString() })
        .eq('feedback_id', feedbackId)
        .select('*')
        .single()
      const row = requireData(data, error, 'Could not update the response.')
      return mapOwnerCommentRow(row as OwnerCommentRow)
    }
    const { data, error } = await client
      .from('owner_comments')
      .insert({ feedback_id: feedbackId, body: body.trim() })
      .select('*')
      .single()
    const row = requireData(data, error, 'Could not save the response.')
    return mapOwnerCommentRow(row as OwnerCommentRow)
  },

  async authDeleteOwnerComment(feedbackId: string): Promise<void> {
    const client = requireSupabase()
    const { error } = await client.from('owner_comments').delete().eq('feedback_id', feedbackId)
    if (error) throw new Error(error.message)
  },

  async authUploadProjectScreenshot(
    projectId: string,
    file: PickedFile,
    caption?: string,
  ): Promise<ProjectScreenshot> {
    const client = requireSupabase()
    const { path, url } = await uploadImageToStorage(file, `projects/${projectId}`)
    const { data, error } = await client
      .from('project_screenshots')
      .insert({
        project_id: projectId,
        file_path: path,
        file_url: url,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        caption: caption ?? null,
      })
      .select('*')
      .single()
    const row = requireData(data, error, 'Could not save the screenshot.')
    return mapScreenshotRow(row as ScreenshotRow)
  },

  async authUpdateProjectScreenshotCaption(screenshotId: string, caption: string): Promise<void> {
    const client = requireSupabase()
    const { error } = await client
      .from('project_screenshots')
      .update({ caption })
      .eq('id', screenshotId)
    if (error) throw new Error(error.message)
  },

  async authDeleteProjectScreenshot(screenshotId: string): Promise<void> {
    const client = requireSupabase()
    const { data, error } = await client
      .from('project_screenshots')
      .select('file_path')
      .eq('id', screenshotId)
      .maybeSingle()
    if (error) throw new Error(error.message)

    const { error: deleteError } = await client
      .from('project_screenshots')
      .delete()
      .eq('id', screenshotId)
    if (deleteError) throw new Error(deleteError.message)

    const filePath = (data as { file_path?: string } | null)?.file_path
    if (filePath) {
      await client.storage.from(STORAGE_BUCKET).remove([filePath])
    }
  },
}
