import { Link, Navigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { isSupabaseConfigured } from '../services/feedbackRepository'
import { DEMO_PUBLIC_SLUG } from '../data/demoData'

export function DemoPage() {
  // Local mode: the seeded sample project lives in localStorage, so open it directly.
  if (!isSupabaseConfigured) {
    return <Navigate to={`/p/${DEMO_PUBLIC_SLUG}`} replace />
  }

  // Supabase mode: the built-in sample only exists in local mode, so it is not in the database.
  return (
    <div className="fw-container" style={{ paddingTop: 'var(--space-6)' }}>
      <EmptyState
        title="Create a live wall"
        description="This deployment runs on a live Supabase backend, so sample local data is not promoted here. Create your own wall in under a minute, or read how FeedbackWall was built."
        action={
          <div className="fw-hero-ctas" style={{ marginTop: 'var(--space-4)' }}>
            <Link to="/create">
              <Button>Create your wall</Button>
            </Link>
            <Link to="/case-study">
              <Button variant="secondary">Open case study</Button>
            </Link>
          </div>
        }
      />
    </div>
  )
}
