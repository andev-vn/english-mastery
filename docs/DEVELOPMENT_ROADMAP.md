# Development roadmap & checklist

## Phase 0 — Architecture ✅
- [x] Repository inspected (empty), toolchain checked (Node 22, npm 10)
- [x] Architecture, routes, design tokens, data model, ERD documented

## Phase 1 — Foundation & mobile UI ✅
- [x] Vite 8 + React 19 + TypeScript 6 (strict) + Tailwind 4 + React Router 8 + TanStack Query + Zustand + RHF/Zod
- [x] Design tokens (light/dark), Inter self-hosted (Latin + Vietnamese subsets)
- [x] Design system components (see DESIGN_SYSTEM.md)
- [x] App shell: bottom navigation (mobile), side rail (desktop), focus layout, safe areas, route code splitting, error boundary
- [x] Onboarding (guest), dashboard, learning path, level, module, lesson, practice hub, exercise engine (7 question types),
      vocabulary (search/filter/save/favourite/difficult), flashcards with SRS, profile, progress, settings
- [x] PWA: manifest, icons, service worker, update prompt, offline indicator, install flow
- [x] Unit/component tests (Vitest) and E2E (Playwright at 360 px + desktop)
- [x] Verified in browser at 360 × 800 and 1280 px, light & dark; no horizontal overflow

## Phase 2 — Supabase & authentication
- [ ] Supabase client + centralized env config (`src/lib/env.ts`, Zod-validated)
- [ ] SQL migrations for all tables in DATABASE.md, constraints, indexes, RLS
- [ ] Seed script generating SQL from `src/data`
- [ ] Auth: register, login, logout, password reset, session persistence, protected routes
- [ ] Profiles; link guest progress to a new account
- [ ] RLS tests with two users

## Phase 3 — Learning core on real data
- [ ] `supabaseContentRepository` with local fallback
- [ ] Grammar section (`/grammar`, `/grammar/:topicId`) organised by CEFR level
- [ ] Content to targets: A1 ≥ 5 modules × 3 lessons, ≥ 100 words, ≥ 50 questions; A2 ≥ 3 modules / 10 lessons / 50 words / 30 questions
- [ ] Server-side persistence of user vocabulary (SRS) and answers

## Phase 4 — Progress & assessment
- [ ] Placement test (grammar, vocabulary, reading, listening; writing/speaking self-check) with estimated CEFR + strengths/weaknesses
- [ ] Server-validated XP/streak RPCs, achievements table, assessment history

## Phase 5 — Language skills
- [ ] Listening (audio player, speed, transcript, translation, dictation)
- [ ] Speaking (Web Speech API with capability detection + text fallback)
- [ ] Reading lessons with highlighted vocabulary
- [ ] Writing prompts with rule-based feedback
- [ ] More Developer English modules (APIs, Git, interviews) across levels

## Phase 6 — Offline & AI
- [ ] Dexie storage, downloadable modules, sync queue with op IDs + conflict detection, sync status UI
- [ ] Optional AI tutor via Supabase Edge Function, provider adapter, rate limits, graceful "unavailable" state

## Phase 7 — Production
- [ ] Lighthouse audit on mobile (targets ≥ 90), accessibility review, security review
- [ ] Cloudflare Pages + Supabase production setup (DEPLOYMENT.md), CI (typecheck, lint, test, e2e)

## Known limitations (Phase 1)
- Guest progress lives in `localStorage` only (no cross-device sync yet).
- Self-assessed level instead of a placement test.
- Seed content is a representative sample, not a full curriculum.
- `npm audit` reports moderate advisories in `glob`/`minimatch` pulled in by `workbox-build` (build-time only, not shipped to users).
