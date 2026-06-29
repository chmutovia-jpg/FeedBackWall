# Case Study: FeedbackWall

FeedbackWall is a portfolio product case study about building the smallest useful feedback loop
for makers before launch.

## Context

Makers often share early projects in group chats, DMs, Discord, social posts, and portfolio
threads. Feedback comes back, but it is usually scattered, inconsistent, and hard to act on.

## Problem

Early feedback is valuable only when it becomes a clear signal. Without structure, a maker has to
manually interpret comments, screenshots, vague praise, and bug reports before deciding what to
ship next.

## Hypothesis

If a maker can create one public wall, ask one focused question, and receive typed feedback from
visitors without requiring login, they can collect better product signals faster.

## Core Loop

1. Create a wall.
2. Copy the invite message or public link.
3. Share it with testers.
4. Receive typed feedback and screenshots.
5. Triage by status and votes.
6. Respond or mark shipped.

## Scope Decisions

- No AI in the first version.
- No billing.
- No team workspaces.
- No visitor accounts.
- No public comment threads.
- No complex analytics.

The goal was to prove the loop, not build a full feedback platform.

## Product Decisions

- **Focused question:** each wall can ask visitors one clear question, which improves feedback
  quality.
- **Typed feedback:** bug, idea, confusing, liked, and painful are simple enough for visitors but
  structured enough for makers.
- **Public submission without login:** the core action should stay low-friction.
- **Owner responses:** makers can close the loop without turning the wall into a forum.
- **Statuses:** new, planned, in progress, done, and rejected match solo-maker triage.
- **Screenshots:** visual context turns vague reports into actionable evidence.
- **Dark-only UI:** the interface should feel like a focused maker workspace, not a generic SaaS
  template.

## Metrics

| Metric | Definition |
|---|---|
| Activation | A maker creates their first feedback wall |
| Core action | A visitor submits feedback on a public wall |
| Prioritization | Feedback moves from new into planned or in progress |
| Outcome | A signal is resolved and marked shipped |
| Retention proxy | The maker returns to manage feedback after the first session |

## Current Implementation

- React, Vite, and TypeScript
- Supabase Auth
- Supabase Database with RLS
- Supabase Storage for screenshots
- Authenticated maker dashboard
- Public feedback walls
- Local fallback mode for single-browser review

## What I Learned

- A product loop matters more than a feature list.
- Post-create onboarding is part of activation.
- Empty states should teach the next action.
- One focused question creates better feedback than a blank generic form.
- Deployment polish, docs, metadata, and screenshot readiness are part of product quality.

## Next Steps

- Better screenshot previews
- Lightweight analytics
- Public demo wall
- Feedback export
- Optional email digest
