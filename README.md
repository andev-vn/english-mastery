# English Mastery

**Learn English. Build Confidence. Speak Naturally.**

A mobile-first, installable (PWA) English learning app for Vietnamese learners, following the CEFR scale (A1 → C2).
Free-first: the core learning experience needs no paid service and no AI key.

> Status: **Phase 5 complete.** The app runs fully in guest mode. With Supabase configured, it adds accounts, loads
> published content from the database (bundled content as offline fallback), syncs the profile and saved words, and
> records progress through server-validated RPCs (server-side grading, XP, streaks, achievements, placement results).
> Listening, speaking, reading and writing practice plus Developer English are included. The offline sync queue, the
> optional AI tutor and production hardening are upcoming phases.
> See [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md).

## What works today

| Area | Features |
| --- | --- |
| Onboarding | Name, learning goal, self-assessed CEFR level, daily goal (validated with Zod) |
| Dashboard | Greeting, level, streak, daily goal ring, continue learning, stats, reviews due, 7-day chart, recommendations, recent activity |
| Learning path | 6 CEFR levels → modules → lessons with locked / available / in-progress / completed states |
| Grammar | 23 topics by CEFR level with search; reference view (structures, examples, common mistakes) linked to practice and the full lesson |
| Lessons | Objectives, grammar structures, examples with Vietnamese translations, common mistakes, tips, vocabulary, linked exercises, text-to-speech |
| Exercise engine | Multiple choice, true/false, fill-in-the-blank, matching, sentence ordering, error correction, translation; reading passages; instant feedback with explanations; scoring; mistake review |
| Vocabulary | Search (debounced), level/topic filters, saved/favourite/difficult lists, word details, pronunciation (browser TTS) |
| Flashcards | SM-2-inspired spaced repetition (again / hard / good / easy) |
| Progress | XP (meaningful actions only), XP levels, streaks, weekly stats, achievements, exercise history; for signed-in users validated on the server and restored on new devices |
| Placement test | 24 questions across vocabulary, grammar, reading, listening (browser voice + transcript) and sentence writing; estimated CEFR level, strengths/weaknesses, suggested first lesson, history and retake. An estimate, not a certificate; speaking not assessed |
| Settings | Light / dark / system theme, daily goal, translations toggle, level, name, install app, reset data |
| Listening | Dialogues read by the browser voice (two voices, 0.75–1.25× speed, line replay), transcript + translation toggles, tap-to-define vocabulary, comprehension questions, dictation with word-level feedback |
| Speaking | Conversation scenarios; speech recognition where the browser supports it, typed fallback everywhere; suggested answers, keyword coverage (not pronunciation scoring), useful phrases, grammar tips |
| Reading | Passages with per-paragraph translation, tap-to-define vocabulary and comprehension questions |
| Writing | Sentence, journal, email, workplace and essay prompts; autosaved drafts; rule-based feedback (length, capitals, frequent Vietnamese-learner errors, prompt checklist); sample answers; daily journal |
| Developer English | Stand-ups, explaining bugs, Java/backend interviews, bug reports, PR descriptions, README and postmortem reading (`/developer`) |
| PWA | Installable, offline app shell + content, update prompt, offline indicator |
| Accounts (optional) | Supabase Auth: register with email confirmation, login, logout, forgot/reset password, account page; profile synced across devices |

Content: 31 lessons in 13 modules, 183 vocabulary entries, 31 exercises / 151 questions, 23 grammar topics.

| Level | Modules | Lessons | Words | Questions |
| --- | --- | --- | --- | --- |
| A1 | 5 | 15 | 114 | 77 |
| A2 | 3 | 10 | 52 | 50 |
| B1–C2 | 5 (samples, incl. Developer English) | 6 | 17 | 24 |

A1 and A2 meet the initial targets from the spec (enforced by `src/data/content.test.ts`).
This is a solid starter curriculum, not a complete CEFR course.

## Getting started

Requirements: Node.js ≥ 22, npm ≥ 10.

```bash
npm install
npm run dev            # http://localhost:5173
```

No environment variables are needed for guest mode. To enable accounts, create `.env.local` from
[.env.example](.env.example) and set up the database. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#supabase).

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
| `npm run db:seed:generate` | Regenerate `supabase/seed.sql` from `src/data` |
| `npm run db:seed:push` | Run the (idempotent) seed against the linked project |
| `npm run db:link` / `db:push` / `db:types` | Link a Supabase project, apply migrations + seed, regenerate DB types |

## Tech stack

React 19 · TypeScript 6 (strict) · Vite 8 · Tailwind CSS 4 · React Router 8 · TanStack Query 5 · Zustand 5 ·
React Hook Form + Zod 4 · Lucide · vite-plugin-pwa (Workbox) · Vitest 5 · Testing Library · Playwright.
Supabase (Postgres + RLS, Auth); PGlite for database tests. Planned: Dexie (IndexedDB), Edge Functions, Cloudflare Pages.

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
