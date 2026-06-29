import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { TypeBadge } from '../components/Badge'
import { isSupabaseConfigured } from '../services/feedbackRepository'
import type { FeedbackType } from '../types'

const FEATURES = [
  {
    title: 'Structured feedback',
    description: 'Every submission has a type: bug, idea, confusing, liked, or painful instead of a wall of unsorted text.',
  },
  {
    title: 'Upvotes',
    description: 'One vote per item per visitor, so the top of the list reflects real demand, not repeat clicks.',
  },
  {
    title: 'Owner statuses',
    description: 'Move feedback from new to planned, in progress, done, or rejected as you actually work through it.',
  },
  {
    title: 'Public wall',
    description: 'Share one link. Anyone can read context and leave feedback with no account required.',
  },
  {
    title: 'Local-first roots',
    description: 'A local fallback still exists for single-browser testing, while production walls run on Supabase.',
  },
  {
    title: 'Decision trail',
    description: 'The case study captures the product problem, scope calls, and metrics behind the build.',
  },
]

const STEPS = [
  {
    title: 'Create wall',
    description: 'Name your project, add a short description and an optional link.',
  },
  {
    title: 'Share link',
    description: 'Copy your public wall link and drop it in chats, Discord, or DMs.',
  },
  {
    title: 'Collect signals',
    description: 'Early users leave typed, titled feedback instead of scattered comments.',
  },
  {
    title: 'Prioritize and ship',
    description: 'Sort by votes, then move items to planned, in progress, or done.',
  },
]

const MAKER_TAGS = [
  'pet projects',
  'MVPs',
  'GitHub launches',
  'landing pages',
  'indie apps',
  'student projects',
]

const HERO_PREVIEW_ITEMS: { type: FeedbackType; title: string; votes: number }[] = [
  { type: 'bug', title: 'Mobile menu overlaps the title', votes: 14 },
  { type: 'idea', title: 'Add a public preview before joining', votes: 21 },
  { type: 'liked', title: 'Visual style feels clean and focused', votes: 17 },
]

type TypewriterPhase = 'typing' | 'holding' | 'deleting'

function BuiltForTypewriter() {
  const [tagIndex, setTagIndex] = useState(0)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<TypewriterPhase>('typing')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(media.matches)

    function handleChange() {
      setPrefersReducedMotion(media.matches)
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) return undefined

    const currentTag = MAKER_TAGS[tagIndex]
    let delay = 84
    let next = () => {}

    if (phase === 'typing') {
      if (text.length < currentTag.length) {
        next = () => setText(currentTag.slice(0, text.length + 1))
      } else {
        delay = 1250
        next = () => setPhase('deleting')
      }
    }

    if (phase === 'deleting') {
      if (text.length > 0) {
        delay = 42
        next = () => setText(currentTag.slice(0, text.length - 1))
      } else {
        delay = 260
        next = () => {
          setTagIndex((current) => (current + 1) % MAKER_TAGS.length)
          setPhase('typing')
        }
      }
    }

    if (phase === 'holding') {
      delay = 1250
      next = () => setPhase('deleting')
    }

    const timeout = window.setTimeout(next, delay)
    return () => window.clearTimeout(timeout)
  }, [prefersReducedMotion, tagIndex, text, phase])

  useEffect(() => {
    if (!prefersReducedMotion || phase !== 'typing') return
    setText(MAKER_TAGS[tagIndex])
  }, [prefersReducedMotion, phase, tagIndex])

  useEffect(() => {
    const currentTag = MAKER_TAGS[tagIndex]
    if (!prefersReducedMotion && phase === 'typing' && text.length === currentTag.length) {
      setPhase('holding')
    }
  }, [prefersReducedMotion, phase, tagIndex, text])

  const visibleText = prefersReducedMotion ? MAKER_TAGS[0] : text

  return (
    <section
      className="fw-section fw-makers-strip"
      aria-label={`built for ${MAKER_TAGS.join(', ')}`}
    >
      <p className="fw-makers-strip-label">built for</p>
      <p className="fw-typewriter-line" aria-hidden="true">
        <span className="fw-typewriter-text">{visibleText}</span>
        <span className="fw-typewriter-caret" />
      </p>
    </section>
  )
}

export function LandingPage() {
  const secondaryCta = isSupabaseConfigured
    ? { to: '/case-study', label: 'View case study' }
    : { to: '/demo', label: 'Open sample wall' }

  return (
    <div className="fw-container">
      <section className="fw-hero">
        <div className="fw-hero-copy">
          <div className="fw-hero-eyebrow">
            <span className="fw-eyebrow">feedback infrastructure for makers</span>
          </div>
          <h1>Turn scattered feedback into a product backlog</h1>
          <p>
            Public walls, structured signals, owner replies, screenshots, and status tracking -
            one link your early users can actually leave feedback on.
          </p>
          <div className="fw-hero-ctas">
            <Link to="/create">
              <Button className="fw-btn-glow">Create your wall</Button>
            </Link>
            <Link to={secondaryCta.to}>
              <Button variant="secondary">{secondaryCta.label}</Button>
            </Link>
          </div>
          <p className="fw-hero-note">
            Supabase-powered. No AI magic. Just signals, not noise.
          </p>
          <div className="fw-hero-chips fw-chip-row">
            <span className="fw-chip">local-first roots</span>
            <span className="fw-chip">Supabase-powered</span>
            <span className="fw-chip">for makers</span>
          </div>
        </div>

        <div className="fw-hero-visual-wrap">
          <div className="fw-glass fw-hero-visual">
            <div className="fw-hero-visual-chrome">
              <span className="fw-hero-visual-dot" />
              <span className="fw-hero-visual-dot" />
              <span className="fw-hero-visual-dot" />
              <span className="fw-hero-visual-title">feedback-backlog / product-wall</span>
            </div>
            <div className="fw-hero-visual-body">
              {HERO_PREVIEW_ITEMS.map((item) => (
                <div className="fw-hero-visual-row" key={item.title}>
                  <TypeBadge type={item.type} />
                  <span className="fw-hero-visual-row-title">{item.title}</span>
                  <span className="fw-hero-visual-vote" aria-hidden="true">
                    {item.votes}
                  </span>
                </div>
              ))}
              <div className="fw-hero-visual-stats">
                <span className="fw-chip fw-chip-accent">23 signals</span>
                <span className="fw-chip fw-chip-accent">7 planned</span>
                <span className="fw-chip fw-chip-accent">4 shipped</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fw-section fw-editorial-band">
        <div className="fw-editorial-copy">
          <span className="fw-chip fw-chip-accent">why it exists</span>
          <h2 className="fw-section-title">
            Your feedback is everywhere except where you need it
          </h2>
          <p>
            Makers share their project in group chats, Threads, Telegram, Discord, or with
            friends - and the feedback that comes back gets scattered across messages, DMs,
            comments, and screenshots. FeedbackWall gives every project one place to collect it
            instead.
          </p>
        </div>
      </section>

      <section className="fw-section fw-section-split-head">
        <div className="fw-section-heading-left">
          <span className="fw-chip">workflow</span>
          <h2 className="fw-section-title">How it works</h2>
          <p className="fw-section-subtitle">Four steps from "I shipped something" to a real backlog.</p>
        </div>
        <div className="fw-steps">
          {STEPS.map((step, index) => (
            <div className="fw-card fw-card-padded fw-step" key={step.title}>
              <span className="fw-step-number">{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fw-section fw-section-split-head">
        <div className="fw-section-heading-left">
          <span className="fw-chip">signal system</span>
          <h2 className="fw-section-title">Everything you need, nothing you don't</h2>
          <p className="fw-section-subtitle">
            Turn "looks cool bro" into something you can actually use. A focused feature set,
            not an enterprise backlog tool.
          </p>
        </div>
        <div className="fw-grid fw-grid-3">
          {FEATURES.map((feature) => (
            <div className="fw-card fw-card-padded fw-feature-card fw-card-hover" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <BuiltForTypewriter />
    </div>
  )
}
