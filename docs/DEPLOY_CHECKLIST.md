# Deploy Checklist

Use this checklist before publishing FeedbackWall or recording portfolio screenshots.

## Vercel

- Set the build command to `npm run build`.
- Set the output directory to `dist`.
- Add the public Supabase env vars:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Keep real keys out of `.env.example` and `.env.local.example`.
- Confirm `vercel.json` is present so client-side routes fall back to `index.html`.

## Supabase Pre-Check

Before deleting test data, inspect existing projects:

```sql
select
  id,
  name,
  public_slug,
  created_at
from public.projects
order by created_at desc;
```

## Clear Test Project Data

Only run this in the intended Supabase project after confirming the rows are test data.

```sql
delete from public.owner_comments;
delete from public.feedback;
delete from public.project_screenshots;
delete from public.projects;

notify pgrst, 'reload schema';
```

Supabase Storage files may need to be deleted manually from the Storage UI if old screenshots
were uploaded.

## Security Smoke Checks

- A signed-out visitor can open a public wall.
- A signed-out visitor can submit feedback.
- A signed-out visitor cannot open the authenticated owner dashboard.
- One user cannot edit another user's project.
- Feedback status cannot be changed from the public wall.
- Screenshot upload works for feedback and does not break Storage.

## Screenshots For Portfolio And Threads

Capture these at a clean desktop width, around 1280px:

1. Landing hero with typewriter.
2. Post-create success screen.
3. Public wall with feedback question.
4. Owner dashboard with signals.
5. Case study page or project card.

## Final Local Checks

```bash
npm run typecheck
npm run build
npm run preview
```

Open the preview build and manually scan landing, auth, dashboard, create wall, public wall,
owner dashboard, settings, and case study pages.
