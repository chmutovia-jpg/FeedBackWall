# Screenshots

Use this folder for portfolio and README screenshots. The app is dark-only, so capture every
screen in the default premium dark interface.

## Recommended Files

| Filename | Page | Suggested route |
|---|---|---|
| `landing.png` | Landing hero with typewriter | `#/` |
| `created-wall.png` | Post-create success screen | `#/app/projects/:projectId/created` |
| `public-wall.png` | Public wall with feedback question | `#/p/:publicSlug` |
| `owner-dashboard.png` | Owner dashboard with signals | `#/app/projects/:projectId` |
| `case-study.png` | Case study page | `#/case-study` |

## Capture Notes

1. Run `npm run dev` and open `http://localhost:5173`.
2. Use a real Supabase project with clean demo data from `docs/DEMO_DATA.md`, or use local
   fallback mode for a quick non-shared capture.
3. Capture at roughly 1280px wide for desktop portfolio shots.
4. Keep the browser chrome out of the image when possible.
5. Make sure the public wall and owner dashboard contain several mixed-status signals.
6. Capture one mobile check separately at 375px if you want to show responsiveness.
