import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../services/feedbackRepository'

export function SignupPage() {
  const { user, loading, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  function validate(): string | null {
    if (!email.trim()) return 'Enter your email address.'
    if (password.length < 6) return 'Use a password with at least 6 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const { needsEmailConfirmation } = await signUp(email.trim(), password)
      if (needsEmailConfirmation) {
        setConfirmationSent(true)
      } else {
        navigate('/app')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmationSent) {
    return (
      <div className="fw-container fw-auth-page">
        <div className="fw-card fw-card-padded" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem' }}>Confirm your email</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            We sent a confirmation link to <strong>{email.trim()}</strong>. Click it to activate
            your account, then come back and log in.
          </p>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/login">
              <Button>Go to log in</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fw-container fw-auth-page">
      <div className="fw-page-header" style={{ textAlign: 'center' }}>
        <span className="fw-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>
          feedback workspace
        </span>
        <h1>Create your FeedbackWall account</h1>
        <p className="fw-page-header-subtitle" style={{ margin: '0 auto' }}>
          Start collecting structured feedback for your next pet project.
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="fw-demo-banner">
          Local mode: accounts need Supabase to be configured. Explore the{' '}
          <Link to="/demo">sample wall</Link> instead.
        </div>
      )}

      <form className="fw-card fw-card-padded" onSubmit={handleSubmit} noValidate>
        <div className="fw-field">
          <label className="fw-label" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            className="fw-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="fw-field">
          <label className="fw-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            className="fw-input"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="fw-field">
          <label className="fw-label" htmlFor="signup-confirm">
            Confirm password
          </label>
          <input
            id="signup-confirm"
            type="password"
            autoComplete="new-password"
            className="fw-input"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>

        {error && (
          <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
            {error}
          </p>
        )}
      </form>

      <p className="fw-auth-trust">Your walls stay in your workspace.</p>

      <p className="fw-auth-alt">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
