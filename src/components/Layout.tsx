import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../services/feedbackRepository'

const PERSONAL_URL = 'https://t.me/vanyaproai'
const BRAND_LOGO_SRC = '/brand/logo.png'

export function Layout({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const showAuthNav = isSupabaseConfigured
  const showLocalDemoNav = !isSupabaseConfigured
  const [logoFailed, setLogoFailed] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
    } finally {
      navigate('/')
    }
  }

  return (
    <>
      <header className="fw-header">
        <div className="fw-container fw-header-inner">
          <div className="fw-header-brand">
            <Link to="/" className="fw-logo" aria-label="FeedbackWall home">
              <span className="fw-logo-mark" aria-hidden="true">
                {logoFailed ? (
                  <span className="fw-logo-fallback" />
                ) : (
                  <img
                    src={BRAND_LOGO_SRC}
                    alt=""
                    className="fw-logo-image"
                    onError={() => setLogoFailed(true)}
                  />
                )}
              </span>
              <span className="fw-logo-wordmark">FeedbackWall</span>
            </Link>
          </div>

          <nav className="fw-nav" aria-label="Primary">
            {showAuthNav && user ? (
              <Link to="/app">Dashboard</Link>
            ) : showLocalDemoNav ? (
              <Link to="/demo">Sample</Link>
            ) : null}
            <Link to="/create">Create wall</Link>
            <Link to="/case-study">Case study</Link>
            {showAuthNav && !loading && !user && <Link to="/login">Log in</Link>}
            {showAuthNav && user && (
              <button type="button" className="fw-nav-button" onClick={handleSignOut}>
                Log out
              </button>
            )}
          </nav>

          <div className="fw-header-actions">
            {showAuthNav && user && (
              <Link to="/app" className="fw-account-pill" title={user.email ?? 'Your account'}>
                <span className="fw-account-pill-text">{user.email ?? 'Account'}</span>
              </Link>
            )}
            <a className="fw-personal-pill" href={PERSONAL_URL} target="_blank" rel="noreferrer">
              <span className="fw-personal-pill-full">made by @olenmukava</span>
              <span className="fw-personal-pill-short">@olenmukava</span>
              <span aria-hidden="true">-&gt;</span>
            </a>
          </div>
        </div>
      </header>
      <main className="fw-main">{children}</main>
      <footer className="fw-footer">
        <div className="fw-container">
          <div className="fw-footer-inner">
            <span>FeedbackWall / public feedback walls for makers</span>
            <div className="fw-footer-links">
              <Link to="/case-study">Case study</Link>
              <a href={PERSONAL_URL} target="_blank" rel="noreferrer">
                made by @olenmukava
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
