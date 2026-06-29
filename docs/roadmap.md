# Roadmap

## v0 — localStorage demo

Frontend-only MVP, no backend, no accounts. Kept working today as the local-demo fallback
whenever Supabase isn't configured — see [README "Local setup"](../README.md#local-setup).

- React + Vite + TypeScript, hash-based client-side routing
- `localStorage` persistence behind a single storage service
- Project creation (name, URL, description, category)
- Public feedback wall per project
- Typed feedback submission (bug, idea, confusing, liked, painful)
- Upvotes on feedback, capped at one vote per item per browser
- Status workflow for owners (new, planned, in progress, done, rejected)
- Filters, search, and sort (newest / top voted) for owners and visitors
- Evidence screenshots on feedback items (up to 3, 2 MB each)
- Maker responses — owner replies visible on both dashboard and public wall
- Project preview screenshots on the wall itself (up to 5, with captions)
- Seeded sample project ("BetaRoom") with realistic sample feedback
- Dark-first premium dev-tool interface

## v1 — Supabase shared persistence

Real multi-user persistence, before accounts — owner access was a per-project token. See
[README "Access model"](../README.md#access-model) for how this still works for legacy projects.

- `supabase/schema.sql`: projects, feedback, owner_comments, feedback_attachments,
  project_screenshots tables, RLS on all five, `feedbackwall-screenshots` Storage bucket
- `src/services/feedbackRepository.ts`: a single repository facade that uses Supabase when
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set, and transparently falls back to the v0
  `localStorage` implementation otherwise — no page or component needs to know which one is active
- Shareable routes work for everyone, not just the creating browser: `#/p/:publicSlug` (public
  wall) and `#/p/:publicSlug/admin?token=:ownerToken` (owner dashboard)
- Owner access via a random per-project token (shown once at creation), verified server-side
  through `SECURITY DEFINER` Postgres functions — not full auth, but `owner_token_hash` is
  never exposed to public queries, and dangerous mutations never get a direct table grant
- Screenshots upload to Supabase Storage and store their public URL, instead of base64 data
  URLs in `localStorage` — removes the v0 localStorage-quota ceiling entirely
- Polished loading/error states for project load, feedback load, upload-in-progress, and
  failed saves, instead of failing silently

## v1.5 — Supabase Auth + personal workspace (current)

Owner access becomes a real account instead of a link to keep safe.

- Supabase Auth (email + password): `src/context/AuthContext.tsx` exposes
  `user`/`session`/`loading`/`signUp`/`signIn`/`signOut`, restores the session on refresh via
  `getSession()` + `onAuthStateChange()`, and `ProtectedRoute` guards the workspace
- Personal dashboard at `#/app` listing only the signed-in user's projects, with aggregate +
  per-project feedback stats (queried by `user_id`, never filtered on the frontend)
- User-owned projects: `projects.user_id` + per-user RLS policies keyed on `auth.uid()`, so
  owners manage feedback/status/responses/screenshots through ordinary table operations
- Authenticated owner dashboard (`#/app/projects/:id`) and project settings
  (`#/app/projects/:id/settings`) with edit + delete-with-confirmation
- Public visitors are unchanged: open a wall, submit feedback, upload screenshots, upvote, read
  maker responses — all with no account
- Legacy owner-token projects keep working through the v1 `owner_*` functions

## v2 — hardening + growth

- Stronger auth/RLS hardening, including Storage-object access scoped to the verified owner and
  garbage-collecting orphaned files when a project/feedback is deleted
- Team workspaces — invite collaborators to manage a wall together
- Embeddable feedback widget for makers who want FeedbackWall inside their own site
- Analytics dashboard surfacing the metrics defined in
  [docs/case-study.md](case-study.md#metrics) (activation, core action, engagement,
  prioritization, outcome, retention proxy)
- Email notifications to owners when new feedback arrives; feedback export (CSV/JSON)
