# English Mastery

**Learn English. Build Confidence. Speak Naturally.**

A mobile-first, installable (PWA) English learning app for Vietnamese learners, following the CEFR scale (A1 → C2).
Free-first: the core learning experience needs no paid service and no AI key.

> Status: **Phase 1 complete** — the app runs fully in the browser in guest mode (progress stored on the device).
> Supabase accounts/sync, placement test, listening/speaking/writing and the optional AI tutor are upcoming phases.
> See [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md).

## What works today

| Area | Features |
| --- | --- |
| Onboarding | Name, learning goal, self-assessed CEFR level, daily goal (validated with Zod) |
| Dashboard | Greeting, level, streak, daily goal ring, continue learning, stats, reviews due, 7-day chart, recommendations, recent activity |
| Learning path | 6 CEFR levels → modules → lessons with locked / available / in-progress / completed states |
| Lessons | Objectives, grammar structures, examples with Vietnamese translations, common mistakes, tips, vocabulary, linked exercises, text-to-speech |
| Exercise engine | Multiple choice, true/false, fill-in-the-blank, matching, sentence ordering, error correction, translation; reading passages; instant feedback with explanations; scoring; mistake review |
| Vocabulary | Search (debounced), level/topic filters, saved/favourite/difficult lists, word details, pronunciation (browser TTS) |
| Flashcards | SM-2-inspired spaced repetition (again / hard / good / easy) |
| Progress | XP (meaningful actions only), XP levels, streaks, weekly stats, achievements, exercise history |
| Settings | Light / dark / system theme, daily goal, translations toggle, level, name, install app, reset data |
| PWA | Installable, offline app shell + content, update prompt, offline indicator |

Seed content: 13 lessons across 10 modules (A1–C2, including Developer English), 39 vocabulary entries, 13 exercises / 58 questions.
This is a representative starter curriculum, not a complete CEFR course.

## Getting started

Requirements: Node.js ≥ 22, npm ≥ 10.

```bash
npm install
npm run dev            # http://localhost:5173
```

No environment variables are needed for Phase 1. See [.env.example](.env.example) for upcoming ones.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and production build (`dist/`, includes service worker) |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Unit + component tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, 360 px mobile + desktop). First run: `npx playwright install chromium` |
| `npm run icons` | Regenerate PWA PNG icons from the brand mark |

## Tech stack

React 19 · TypeScript 6 (strict) · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query 5 · Zustand 5 ·
React Hook Form + Zod 4 · Lucide · vite-plugin-pwa (Workbox) · Vitest 5 · Testing Library · Playwright.
Planned: Supabase (Postgres, Auth, Edge Functions), Dexie (IndexedDB), Cloudflare Pages.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Database](docs/DATABASE.md) · [ERD](docs/ERD.md)
- [API / service layer](docs/API.md)
- [PWA & offline](docs/PWA.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Roadmap & checklist](docs/DEVELOPMENT_ROADMAP.md)

## Licensing of content

All lesson text, examples and exercises in `src/data` were written for this project.
Inter font: SIL Open Font License 1.1 (via `@fontsource-variable/inter`). Icons: Lucide (ISC).
