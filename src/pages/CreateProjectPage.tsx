import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProjectForm } from '../components/ProjectForm'
import { Button } from '../components/Button'
import { CreatedWallSuccess } from '../components/CreatedWallSuccess'
import { feedbackRepository, isSupabaseConfigured } from '../services/feedbackRepository'
import type { CreateProjectResult } from '../services/feedbackRepository'
import { useAuth } from '../context/AuthContext'

function buildAdminUrl(slug: string, token: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/p/${slug}/admin?token=${token}`
}

const CREATE_STEPS = ['Create wall', 'Share link', 'Collect signals']

function CreateWallIntro() {
  return (
    <aside className="fw-create-intro">
      <span className="fw-eyebrow">new feedback wall</span>
      <h1>Create your wall</h1>
      <p>
        Give every early product one clean place for bugs, ideas, screenshots, and shipped
        responses. No spreadsheet archaeology later.
      </p>
      <div className="fw-create-steps" aria-label="Wall setup steps">
        {CREATE_STEPS.map((step, index) => (
          <div className="fw-create-step" key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </div>
    </aside>
  )
}

export function CreateProjectPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [result, setResult] = useState<CreateProjectResult | null>(null)

  if (isSupabaseConfigured) {
    if (loading) {
      return (
        <div className="fw-container" style={{ paddingTop: 'var(--space-7)' }}>
          <p className="fw-hint" style={{ textAlign: 'center' }}>
            Loading...
          </p>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="fw-container fw-create-page">
          <div className="fw-create-layout">
            <CreateWallIntro />
            <div className="fw-card fw-card-padded fw-create-auth-card">
              <span className="fw-chip fw-chip-accent">workspace required</span>
              <h2>Create an account first</h2>
              <p>
                FeedbackWall keeps every wall you create in a personal dashboard, so you can
                track signals across all your projects in one place.
              </p>
              <div className="fw-hero-ctas" style={{ marginTop: 'var(--space-4)' }}>
                <Link to="/signup">
                  <Button>Create account</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary">Log in</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="fw-container fw-create-page">
        <div className="fw-create-layout">
          <CreateWallIntro />
          <div className="fw-create-form-panel">
            <div className="fw-form-shell">
              <div className="fw-form-head">
                <span className="fw-chip fw-chip-accent">workspace asset</span>
                <h2>Wall details</h2>
                <p>Takes less than a minute. It will show up in your workspace right away.</p>
              </div>
              <ProjectForm
                onSubmit={async (input) => {
                  const project = await feedbackRepository.createProjectForUser(input)
                  navigate(`/app/projects/${project.id}/created`)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (result) {
    const adminPath = `/p/${result.project.publicSlug}/admin?token=${result.ownerToken}`
    return (
      <CreatedWallSuccess
        project={result.project}
        dashboardTo={adminPath}
        ownerLink={buildAdminUrl(result.project.publicSlug, result.ownerToken)}
      />
    )
  }

  return (
    <div className="fw-container fw-create-page">
      <div className="fw-create-layout">
        <CreateWallIntro />
        <div className="fw-create-form-panel">
          <div className="fw-demo-banner">
            Local mode: Supabase is not configured, so this wall will only exist in this browser.
          </div>
          <div className="fw-form-shell">
            <div className="fw-form-head">
              <span className="fw-chip fw-chip-accent">local workspace</span>
              <h2>Wall details</h2>
              <p>You can edit the details later from the owner link.</p>
            </div>
            <ProjectForm
              onSubmit={async (input) => {
                const created = await feedbackRepository.createProject(input)
                setResult(created)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
