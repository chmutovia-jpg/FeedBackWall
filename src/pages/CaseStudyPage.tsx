const METRICS = [
  {
    name: 'Activation',
    definition: 'A maker creates their first feedback wall.',
  },
  {
    name: 'Core action',
    definition: 'A visitor submits typed feedback on a public wall.',
  },
  {
    name: 'Prioritization',
    definition: 'Feedback moves from new into planned or in progress.',
  },
  {
    name: 'Outcome',
    definition: 'A signal is resolved and marked shipped.',
  },
]

const DECISIONS = [
  {
    title: 'Structured types beat free-form tags',
    body:
      'Bug, idea, confusing, liked, and painful map directly to the questions a maker asks after launching: what broke, what is missing, what is unclear, what works, and what hurts.',
  },
  {
    title: 'A status loop instead of a kanban clone',
    body:
      'New, planned, in progress, done, and rejected reflect solo-maker triage without turning the product into a project-management suite.',
  },
  {
    title: 'No login for visitors',
    body:
      'The core action is leaving feedback. Anonymous submission keeps that action low-friction, because anonymous feedback beats no feedback.',
  },
  {
    title: 'One vote per item per browser',
    body:
      'Voting only helps prioritization when repeat clicks are capped. FeedbackWall keeps that rule in both local fallback mode and the live Supabase-backed product.',
  },
  {
    title: 'Repository boundary from day one',
    body:
      'Persistence stays behind one repository layer, so moving from localStorage to Supabase did not require rewriting every page.',
  },
  {
    title: 'Owner links evolved into workspaces',
    body:
      'Owner links validated the loop, then Supabase Auth made the product feel real for makers managing several walls at once.',
  },
]

const ROADMAP = [
  {
    label: 'Prototype',
    body: 'Validated the smallest loop: create a wall, share a public link, collect typed feedback, upvote, and move signals through statuses.',
  },
  {
    label: 'Shared backend',
    body: 'Added Supabase persistence, public links that work across browsers, owner access, and screenshot storage.',
  },
  {
    label: 'Workspace',
    body: 'Supabase Auth and a personal workspace: user-owned walls, per-user RLS, authenticated dashboard, and project settings.',
  },
  {
    label: 'Next',
    body: 'Better screenshot previews, lightweight analytics, export, and an optional email digest once the core loop proves useful.',
  },
]

export function CaseStudyPage() {
  return (
    <div className="fw-container fw-case-page">
      <div className="fw-page-header fw-case-hero">
        <span className="fw-eyebrow">product case / feedback loops</span>
        <h1>Case study: FeedbackWall</h1>
        <p className="fw-page-header-subtitle">
          How a lightweight feedback wall became a complete maker workflow: create, share,
          collect, prioritize, and ship from one focused workspace.
        </p>
      </div>

      <section className="fw-card fw-card-padded fw-case-summary-card">
        <div>
          <span className="fw-chip fw-chip-accent">product thesis</span>
          <h2>Early feedback is useful only when it lands somewhere actionable.</h2>
        </div>
        <p>
          FeedbackWall tests whether makers need a simple, shareable place to collect structured
          product signals for early projects instead of losing them across DMs, group chats,
          screenshots, and scattered comments.
        </p>
      </section>

      <section className="fw-case-section fw-case-context-grid">
        <div>
          <h2>Context</h2>
          <p>
            Makers who ship pet projects, MVPs, or portfolio apps usually share them informally:
            a link in a group chat, a Discord thread, a social post, or a DM. Feedback comes back,
            but it rarely arrives in a form that helps the maker decide what to do next.
          </p>
        </div>
        <div className="fw-card fw-card-padded fw-case-problem-card">
          <span className="fw-chip">problem</span>
          <p>
            High-volume, low-structure feedback is hard to search, hard to prioritize, and easy to
            ignore. Makers need less admin and more signal.
          </p>
        </div>
      </section>

      <section className="fw-case-section">
        <h2>Hypothesis</h2>
        <p>
          If makers had one public link where feedback arrived already typed and votable, they
          would collect more useful input with less manual triage - and they would be more likely
          to act on it because updating a status is a five-second action.
        </p>
      </section>

      <section className="fw-case-section">
        <h2>Audience and scope</h2>
        <div className="fw-case-split">
          <div className="fw-card fw-card-padded">
            <h3>Built for</h3>
            <div className="fw-chip-row fw-chip-row-left">
              <span className="fw-chip">indie hackers</span>
              <span className="fw-chip">solo makers</span>
              <span className="fw-chip">students</span>
              <span className="fw-chip">junior PMs</span>
              <span className="fw-chip">early MVPs</span>
            </div>
          </div>
          <div className="fw-card fw-card-padded">
            <h3>Core loop</h3>
            <p>
              Create a wall, share the public link, collect typed feedback with optional
              screenshots, upvote what matters, then move signals through statuses.
            </p>
          </div>
        </div>
      </section>

      <section className="fw-case-section">
        <h2>Product decisions</h2>
        <div className="fw-grid fw-grid-3 fw-decision-grid">
          {DECISIONS.map((decision) => (
            <article className="fw-card fw-card-padded fw-decision-card" key={decision.title}>
              <h3>{decision.title}</h3>
              <p>{decision.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fw-case-section">
        <h2>Metrics</h2>
        <p>How success would be measured with real makers using the product:</p>
        <div className="fw-metric-grid">
          {METRICS.map((metric) => (
            <div className="fw-card fw-metric-card" key={metric.name}>
              <span className="fw-metric-index">signal</span>
              <h4>{metric.name}</h4>
              <p>{metric.definition}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fw-case-section">
        <h2>Roadmap</h2>
        <div className="fw-timeline">
          {ROADMAP.map((item) => (
            <div className="fw-timeline-item" key={item.label}>
              <span className="fw-timeline-dot" aria-hidden="true" />
              <div className="fw-timeline-label">{item.label}</div>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fw-case-section">
        <h2>Lessons learned</h2>
        <div className="fw-case-split">
          <div className="fw-card fw-card-padded">
            <h3>Scope is a product decision</h3>
            <p>
              Designing the first version around the core loop forced a sharper definition of
              what was product value versus infrastructure.
            </p>
          </div>
          <div className="fw-card fw-card-padded">
            <h3>Workflow language matters</h3>
            <p>
              Naming statuses around maker behavior makes the dashboard feel like a backlog, not
              a generic bug tracker.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
