import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../services/feedbackRepository'

export function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) {
    return <Navigate to="/app" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
      navigate('/app')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fw-container fw-auth-page">
      <div className="fw-page-header" style={{ textAlign: 'center' }}>
        <span className="fw-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>
          feedback workspace
        </span>
        <h1>Welcome back</h1>
        <p className="fw-page-header-subtitle" style={{ margin: '0 auto' }}>
          Open your feedback workspace and keep shipping.
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
          <label className="fw-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            className="fw-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="fw-field">
          <label className="fw-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            className="fw-input"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={submitting} style={{ width: '100%' }}>
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>

        {error && (
          <p className="fw-error" role="alert" style={{ marginTop: 'var(--space-3)' }}>
            {error}
          </p>
        )}
      </form>

      <p className="fw-auth-trust">Your walls stay in your workspace.</p>

      <p className="fw-auth-alt">
        No account? <Link to="/signup">Create one</Link>
      </p>
    </div>
  )
}
