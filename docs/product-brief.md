# Product brief: FeedbackWall

## Product name

FeedbackWall

## Problem

Makers who launch pet projects, small web apps, landing pages, MVPs, GitHub portfolio
projects, or indie products share their link in group chats, Threads, Telegram, Discord, or
with friends. The feedback that comes back is scattered across messages, DMs, comments, and
screenshots. There is no single place to see what's confusing, what's broken, what people
liked, or which ideas are worth prioritizing.

## Audience

- Indie hackers and solo makers shipping side projects
- Students and bootcamp grads building portfolio apps
- Junior product builders who want a lightweight backlog without enterprise tooling
- Anyone sharing an early MVP or prototype with a small group of testers

## Jobs-to-be-done

- "When I share my project, I want a single link people can use to leave feedback, so it
  doesn't get scattered across five different chat apps."
- "When I get feedback, I want to know if it's a bug report, an idea, or just confusion, so I
  can triage it quickly."
- "When I have ten pieces of feedback, I want to know which ones matter most to people, so I
  don't guess at priorities."
- "When I act on feedback, I want to mark it as planned or done, so early users can see their
  input was heard."
- "When someone visits my wall, I want them to understand the project and leave feedback
  without creating an account."

## MVP

A frontend-only web app, persisted in `localStorage`:

- Create a project (name, URL, description, category)
- Get a shareable public wall link for that project
- Visitors leave typed feedback (bug, idea, confusing, liked, painful) with a title,
  description, and optional name
- Anyone can upvote existing feedback, capped at one vote per item per browser
- Visitors can attach evidence screenshots to a feedback item — useful for bugs, confusing
  flows, and painful moments where a picture says more than a description
- Project owners can post a maker response on any feedback item, visible on both the dashboard
  and the public wall, to close the loop and show they're listening
- Project owners can add project preview screenshots to the wall itself, so visitors understand
  what they're looking at before they leave feedback
- Project owners filter, search, and sort feedback, and move it through a status workflow
  (new → planned → in progress → done → rejected)
- A seeded sample project ("BetaRoom") so the product can be evaluated with zero setup

Evidence screenshots, maker responses, and project previews together strengthen the
*qualitative* side of the feedback loop — they turn a one-line complaint into something the
maker can actually act on, and turn a silent backlog into a visible conversation with users,
without adding any backend.

Explicitly out of scope for the MVP: AI features, Telegram integration, payments, user
accounts/authentication, and any real backend.

## User journey

**Maker:**
1. Lands on the homepage, reads the value proposition
2. Clicks "Create your wall," fills in project details
3. Lands on their owner dashboard, copies the public wall link
4. Shares the link in a chat, Discord, or with friends
5. Returns over the next few days to read feedback, filter/sort it, update statuses, and reply
   with a maker response where it matters

**Feedback giver:**
1. Opens the public wall link shared by the maker
2. Reads the project description and any project preview screenshots
3. Optionally upvotes existing feedback they agree with
4. Fills in the feedback form: type, title, description, optional name, optional screenshots
5. Submits and sees their feedback — and any maker response to it — appear immediately

## Metrics

- **Activation** — a maker creates their first feedback wall
- **Core action** — a visitor submits feedback on a public wall
- **Engagement** — average votes per feedback item
- **Prioritization** — share of feedback moved from new to planned/in progress
- **Outcome** — share of feedback eventually marked done
- **Retention proxy** — project owner returns to update statuses after the first session

## Roadmap

- **v0** — frontend-only demo, localStorage, project creation, public wall, upvotes, statuses,
  evidence screenshots, maker responses, project preview screenshots
- **v1 (current)** — Supabase database, real shareable public links, owner-token access,
  screenshots in Supabase Storage, localStorage kept as a fallback when Supabase isn't configured
- **v2** — real authentication replacing owner tokens, secure per-user RLS
- **v3** — embeddable widget, analytics dashboard, public changelog, email notifications,
  feedback export
