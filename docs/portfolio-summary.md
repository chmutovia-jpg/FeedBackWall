# FeedbackWall — feedback board for pet projects

## One-liner

A frontend-only web app where makers create a public feedback wall, early users submit
structured feedback and upvote what matters, and owners manage it all through a status
workflow from `new` to `done`.

## Problem

Makers who ship pet projects, MVPs, or portfolio apps share their link in group chats,
Threads, Telegram, Discord, or with friends. The feedback that comes back is scattered across
messages, DMs, comments, and screenshots — nothing is searchable, nothing is prioritized, and
good signal gets lost.

## Target users

- Indie hackers and solo makers shipping side projects
- Students and bootcamp grads building portfolio apps
- Junior product builders who want a lightweight backlog without enterprise tooling
- Anyone sharing an early MVP with a small group of testers

## What I built

A frontend-only MVP (React, TypeScript, Vite, `localStorage`) covering the full core loop:

- A landing page that frames the problem and converts to wall creation
- Project creation with validation (name, URL, description, category)
- A public feedback wall with a typed submission form (bug, idea, confusing, liked, painful)
- Upvoting capped at one vote per item per browser
- An owner dashboard with stats, filters, search, sort, and status management
  (new → planned → in progress → done → rejected)
- A seeded sample project ("BetaRoom") so the product is evaluable with zero setup
- Premium dark dev-tool UI
- A documented product case study, written for a Junior PM portfolio, both in `docs/` and as
  an in-app page

## Key product decisions

- **Five feedback types instead of free-form tags** — bug, idea, confusing, liked, and painful
  map directly to the questions a maker actually asks after launching, with no moderation
  overhead.
- **One upvote per item per browser** — uncapped anonymous voting lets a single visitor inflate
  one item by clicking repeatedly; capping it makes the vote count mean something even without
  accounts.
- **No login for visitors** — anonymous feedback beats no feedback. Friction on the core action
  (submitting feedback) was cut in favor of attribution.
- **`localStorage` behind one storage service, not scattered calls** — every read/write goes
  through `src/services/storage.ts`, so migrating to Supabase later is a contained rewrite of
  one file, not an audit of every page.
- **A seeded, clearly-labeled demo project** — reviewers shouldn't have to fabricate their own
  data to evaluate the product.

## Metrics

Defined as if this had real users, mapped to the actual user journey:

- **Activation** — a maker creates their first feedback wall
- **Core action** — a visitor submits feedback on a public wall
- **Engagement** — average votes per feedback item
- **Prioritization** — share of feedback moved from new to planned/in progress
- **Outcome** — share of feedback eventually marked done
- **Retention proxy** — project owner returns to update statuses after the first session

## What I would improve next

- Migrate `localStorage` to Supabase so wall links work across devices and the upvote cap is
  enforced server-side instead of per-browser
- Add lightweight owner login so the admin view is actually restricted to the project owner
- Add a public changelog generated from items marked "done," so early users can see their
  feedback was acted on without checking back manually
- Add feedback export so makers can analyze data outside the app

Full roadmap in [docs/roadmap.md](roadmap.md).

## Resume bullet

FeedbackWall — web app for collecting structured feedback on pet projects. Designed and built
a frontend-only MVP where makers create public feedback walls, users submit feedback by type,
upvote important items, and owners manage statuses from new to done. Documented the problem,
user journey, MVP scope, product metrics, and roadmap.
