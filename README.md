# FeedbackWall

A lightweight public feedback wall for makers who need useful product signals before launch.

## Overview

FeedbackWall helps a maker create one public wall, ask one focused question, and collect typed
feedback in a private workspace. Visitors can submit feedback without logging in, attach
screenshots, upvote existing signals, and read maker responses. The maker can then triage,
reply, and mark work as shipped.

## Problem

Makers often launch landing pages, MVPs, and pet projects without a structured way to collect
actionable feedback. Feedback usually gets scattered across chats, comments, DMs, and
screenshots. That makes it hard to see what is broken, what is confusing, and what is actually
worth shipping next.

## Product Hypothesis

If a maker can create one public wall, share it with a few people, and ask one focused question,
they will collect better signals faster.

## Core User Loop

create wall -> copy invite message -> share public link -> receive feedback -> triage signal ->
respond or mark shipped

## Key Features

- Authenticated maker dashboard
- Public feedback wall
- Focused feedback question
- Copyable invite message
- Feedback submission without login
- Upvotes
- Owner responses
- Feedback statuses
- Screenshot support
- Post-create success flow
- Dark-only premium dev-tool interface
- Local fallback mode when Supabase env vars are not configured

## Product Decisions

- **No AI in the first release.** The product is about collecting clearer human signal, not summarizing noise.
- **No teams/workspaces yet.** A solo maker workflow keeps the scope sharp.
- **No billing yet.** Payment would add friction before the core loop is proven.
- **No comments from everyone.** Maker responses are enough to close the loop without turning the
  wall into a forum.
- **No complex analytics.** Counts, votes, statuses, and shipped signals are the first useful
  indicators.
- **Smallest useful feedback loop.** Create, share, collect, triage, respond, ship.

## Tech Stack

- React
- Vite
- TypeScript
- React Router
- Supabase Auth
- Supabase Database
- Supabase Storage
- CSS

## Screenshots

Screenshot guidance lives in [public/screenshots/README.md](public/screenshots/README.md).
Recommended captures:

- Landing hero with typewriter
- Post-create success screen
- Public wall with feedback question
- Owner dashboard with signals
- Case study page or project card

## Demo Flow

1. Create a wall.
2. Copy the public link or invite message.
3. Send it to testers.
4. Receive public feedback.
5. Manage signals in the owner dashboard.
6. Respond or update status.

Recommended demo seed content is documented in [docs/DEMO_DATA.md](docs/DEMO_DATA.md).

## What I Learned

- A product loop matters more than a feature list.
- Onboarding after creation is critical because the next action is sharing, not browsing.
- Empty states should guide action instead of simply reporting that nothing exists.
- Feedback quality improves when the maker asks one focused question.
- Deploy-ready polish is part of product thinking: metadata, docs, screenshots, and cleanup shape
  how the product is understood.

## Roadmap

- Better screenshot previews
- Lightweight analytics
- Public demo wall
- Export feedback
- Optional email digest later

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Run quality checks:

```bash
npm run typecheck
npm run build
npm run preview
```

Create `.env.local` for live Supabase mode:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

When both variables are blank, FeedbackWall runs in local fallback mode using browser
localStorage. When both are set, it uses Supabase Auth, Database, and Storage. Schema details live
in [supabase/schema.sql](supabase/schema.sql), and deployment checks live in
[docs/DEPLOY_CHECKLIST.md](docs/DEPLOY_CHECKLIST.md).
