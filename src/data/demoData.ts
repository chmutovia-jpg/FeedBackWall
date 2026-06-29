import type { Feedback, Project } from '../types'

export const DEMO_PROJECT_ID = 'proj_demo_betaroom'
export const DEMO_PUBLIC_SLUG = 'betaroom-demo'
/** Fixed and documented on purpose — anyone can open the demo admin view, no setup required. */
export const DEMO_OWNER_TOKEN = 'demo-owner-access'

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

const dashboardScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#f5f3ff"/>
  <rect width="800" height="56" fill="#5b5bf6"/>
  <circle cx="28" cy="28" r="9" fill="#ffffff"/>
  <rect x="48" y="20" width="130" height="16" rx="4" fill="#ffffff" opacity="0.92"/>
  <rect x="640" y="18" width="120" height="20" rx="10" fill="#ffffff" opacity="0.25"/>
  <rect x="40" y="90" width="220" height="130" rx="14" fill="#ffffff" stroke="#e3e6ee"/>
  <rect x="280" y="90" width="220" height="130" rx="14" fill="#ffffff" stroke="#e3e6ee"/>
  <rect x="520" y="90" width="220" height="130" rx="14" fill="#ffffff" stroke="#e3e6ee"/>
  <rect x="64" y="114" width="80" height="10" rx="3" fill="#5b5bf6" opacity="0.7"/>
  <rect x="64" y="136" width="150" height="22" rx="4" fill="#1a1d29" opacity="0.85"/>
  <rect x="304" y="114" width="80" height="10" rx="3" fill="#5b5bf6" opacity="0.7"/>
  <rect x="304" y="136" width="150" height="22" rx="4" fill="#1a1d29" opacity="0.85"/>
  <rect x="544" y="114" width="80" height="10" rx="3" fill="#5b5bf6" opacity="0.7"/>
  <rect x="544" y="136" width="150" height="22" rx="4" fill="#1a1d29" opacity="0.85"/>
  <rect x="40" y="246" width="720" height="220" rx="14" fill="#ffffff" stroke="#e3e6ee"/>
  <rect x="64" y="270" width="220" height="16" rx="4" fill="#1a1d29" opacity="0.85"/>
  <rect x="64" y="304" width="672" height="44" rx="10" fill="#f5f3ff"/>
  <rect x="64" y="358" width="672" height="44" rx="10" fill="#f5f3ff"/>
  <rect x="64" y="412" width="672" height="44" rx="10" fill="#f5f3ff"/>
  <circle cx="700" cy="326" r="10" fill="#11825a"/>
  <circle cx="700" cy="380" r="10" fill="#9a6400"/>
  <circle cx="700" cy="434" r="10" fill="#5b5bf6"/>
</svg>
`.trim()

const roomViewScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <rect width="800" height="500" fill="#eef6f2"/>
  <rect width="220" height="500" fill="#11825a"/>
  <rect x="24" y="28" width="120" height="16" rx="4" fill="#ffffff" opacity="0.9"/>
  <rect x="24" y="70" width="172" height="36" rx="8" fill="#ffffff" opacity="0.18"/>
  <rect x="24" y="116" width="172" height="36" rx="8" fill="#ffffff" opacity="0.30"/>
  <rect x="24" y="162" width="172" height="36" rx="8" fill="#ffffff" opacity="0.18"/>
  <rect x="260" y="28" width="500" height="60" rx="12" fill="#ffffff" stroke="#dce8e2"/>
  <rect x="284" y="48" width="220" height="18" rx="4" fill="#1a1d29" opacity="0.85"/>
  <rect x="260" y="108" width="500" height="320" rx="12" fill="#ffffff" stroke="#dce8e2"/>
  <circle cx="300" cy="150" r="16" fill="#cfe3da"/>
  <rect x="328" y="142" width="280" height="16" rx="4" fill="#1a1d29" opacity="0.7"/>
  <circle cx="300" cy="200" r="16" fill="#cfe3da"/>
  <rect x="328" y="192" width="340" height="16" rx="4" fill="#1a1d29" opacity="0.7"/>
  <circle cx="300" cy="250" r="16" fill="#cfe3da"/>
  <rect x="328" y="242" width="240" height="16" rx="4" fill="#1a1d29" opacity="0.7"/>
</svg>
`.trim()

const mobileMenuBugSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="500" viewBox="0 0 360 500">
  <rect width="360" height="500" fill="#ffffff"/>
  <rect width="360" height="64" fill="#5b5bf6"/>
  <rect x="20" y="24" width="140" height="16" rx="4" fill="#ffffff" opacity="0.5"/>
  <rect x="290" y="20" width="40" height="24" rx="4" fill="#ffffff"/>
  <rect x="0" y="40" width="240" height="150" fill="#1a1d29" opacity="0.85"/>
  <rect x="20" y="60" width="160" height="14" rx="3" fill="#ffffff"/>
  <rect x="20" y="84" width="160" height="14" rx="3" fill="#ffffff"/>
  <rect x="20" y="108" width="160" height="14" rx="3" fill="#ffffff"/>
  <rect x="2" y="36" width="356" height="158" fill="none" stroke="#ff5a4e" stroke-width="4" stroke-dasharray="8 6"/>
  <rect x="24" y="220" width="312" height="70" rx="12" fill="#f5f3ff"/>
  <rect x="24" y="304" width="312" height="70" rx="12" fill="#f5f3ff"/>
</svg>
`.trim()

const confusingFlowSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="360" viewBox="0 0 500 360">
  <rect width="500" height="360" fill="#ffffff"/>
  <rect width="500" height="56" fill="#5b5bf6"/>
  <rect x="20" y="20" width="120" height="16" rx="4" fill="#ffffff" opacity="0.5"/>
  <rect x="170" y="120" width="160" height="48" rx="10" fill="#5b5bf6"/>
  <rect x="196" y="136" width="108" height="16" rx="4" fill="#ffffff" opacity="0.9"/>
  <text x="250" y="240" font-family="sans-serif" font-size="48" fill="#9a6400" text-anchor="middle">?</text>
  <rect x="170" y="280" width="160" height="14" rx="4" fill="#5b6072" opacity="0.4"/>
</svg>
`.trim()

export const demoProject: Project = {
  id: DEMO_PROJECT_ID,
  publicSlug: DEMO_PUBLIC_SLUG,
  name: 'BetaRoom',
  url: 'https://chmutovia-jpg.github.io/betaroom/',
  description: 'A one-page project room for collecting early feedback before launch.',
  feedbackQuestion: 'What feels unclear, broken, or worth improving before launch?',
  category: 'web-app',
  createdAt: '2026-05-12T09:00:00.000Z',
  screenshots: [
    {
      id: 'shot_demo_1',
      name: 'betaroom-overview.svg',
      type: 'image/svg+xml',
      size: dashboardScreenshotSvg.length,
      url: svgDataUrl(dashboardScreenshotSvg),
      caption: 'BetaRoom overview - early project context in one place',
      createdAt: daysAgo(10),
    },
    {
      id: 'shot_demo_2',
      name: 'betaroom-public-preview.svg',
      type: 'image/svg+xml',
      size: roomViewScreenshotSvg.length,
      url: svgDataUrl(roomViewScreenshotSvg),
      caption: 'Public preview before launch',
      createdAt: daysAgo(10),
    },
  ],
}

export const demoFeedback: Feedback[] = [
  {
    id: 'fb_demo_1',
    projectId: DEMO_PROJECT_ID,
    type: 'idea',
    status: 'new',
    title: 'The first screen explains the idea, but the CTA could be stronger',
    description:
      'I understand that it is a project room, but I would make the main action more visible above the fold.',
    authorName: 'Dana',
    votes: 18,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
    attachments: [
      {
        id: 'att_demo_1',
        name: 'mobile-menu-overlap.svg',
        type: 'image/svg+xml',
        size: mobileMenuBugSvg.length,
        url: svgDataUrl(mobileMenuBugSvg),
        createdAt: daysAgo(9),
      },
    ],
    ownerResponse: {
      id: 'comment_demo_1',
      feedbackId: 'fb_demo_1',
      body: "Good catch. I'll make the CTA more direct on mobile.",
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  },
  {
    id: 'fb_demo_2',
    projectId: DEMO_PROJECT_ID,
    type: 'confusing',
    status: 'planned',
    title: 'Mobile spacing feels a little tight',
    description:
      'On a smaller screen, the project title and first section feel close together. More breathing room would make it feel more premium.',
    authorName: 'Marco',
    votes: 11,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
    attachments: [
      {
        id: 'att_demo_2',
        name: 'no-confirmation-state.svg',
        type: 'image/svg+xml',
        size: confusingFlowSvg.length,
        url: svgDataUrl(confusingFlowSvg),
        createdAt: daysAgo(7),
      },
    ],
  },
  {
    id: 'fb_demo_3',
    projectId: DEMO_PROJECT_ID,
    type: 'liked',
    status: 'done',
    title: 'The public preview is useful',
    description:
      'I like that I can understand the product before signing up. This makes the flow feel more trustworthy.',
    authorName: 'Priya',
    votes: 21,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(3),
    ownerResponse: {
      id: 'comment_demo_2',
      feedbackId: 'fb_demo_3',
      body: 'Shipped a cleaner first-screen layout and improved spacing.',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  },
  {
    id: 'fb_demo_4',
    projectId: DEMO_PROJECT_ID,
    type: 'confusing',
    status: 'new',
    title: 'The value proposition could be more specific',
    description:
      '"Collect feedback before launch" is clear, but I would add who it is mainly for: indie makers, students, or early-stage founders.',
    authorName: 'Mira',
    votes: 13,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  },
  {
    id: 'fb_demo_5',
    projectId: DEMO_PROJECT_ID,
    type: 'idea',
    status: 'planned',
    title: 'Add one example of a finished project room',
    description:
      'A concrete example would help me understand what I am supposed to create and what good output looks like.',
    authorName: 'Yusuf',
    votes: 16,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1),
    ownerResponse: {
      id: 'comment_demo_3',
      feedbackId: 'fb_demo_5',
      body: "Agree. I'm adding a stronger example wall before launch.",
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
  },
  {
    id: 'fb_demo_6',
    projectId: DEMO_PROJECT_ID,
    type: 'liked',
    status: 'done',
    title: 'The design feels polished enough to share',
    description:
      'The dark interface and focused flow make it feel like a real product, not just a form.',
    authorName: 'Anonymous',
    votes: 19,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  },
]
