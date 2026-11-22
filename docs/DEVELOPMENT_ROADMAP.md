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

## Phase 2 — Supabase & authentication ✅ (code complete; live project pending)
- [x] Supabase client (lazy SDK chunk, PKCE) + validated env config that rejects secret keys
- [x] SQL migration: all tables, constraints, indexes, `updated_at` triggers, new-user trigger, RLS on every table
- [x] Seed generated from `src/data` (`npm run db:seed:generate`), idempotent
- [x] Auth: register (with email confirmation), login, logout, forgot/reset password, session persistence,
      email-link callback, protected `/account` route, Vietnamese error messages
- [x] Profiles: device profile linked to the account on sign-in; later edits synced
- [x] Database tests in PGlite: RLS with two users, constraints, trigger, idempotency (17 tests)
- [ ] **Apply the migration to the live project and test sign-up/login end to end.** Waiting on `.env.local`
      and `supabase login` (or SQL Editor)
- [ ] Sync of learning progress (lessons, SRS, XP), which moves to the Phase 6 sync queue

## Phase 3 — Learning core on real data ✅
- [x] Content repository: bundled content first; published content from Supabase swapped in once per session;
      any failure keeps bundled content. A round-trip test proves database content equals bundled content.
- [x] Grammar section (`/grammar`, `/grammar/:topicId`): 23 topics by CEFR level, search, reference view, practice link
- [x] Content targets met: A1 5 modules × 3 lessons, 114 words, 77 questions; A2 3 modules / 10 lessons / 52 words / 50 questions
- [x] Server-side persistence for signed-in users: `user_vocabulary` (per-word merge on sign-in with deletion
      tombstones, then write-through) and `user_answers` (per finished exercise)
- [x] Generated database types (`npm run db:types`) with runtime guards for enum columns
- [ ] Not yet verified with a real signed-in account (needs a test sign-up with a real inbox)

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

## Known limitations
- Accounts sync the profile, daily goal, saved words/SRS state and answers. Lesson completion, XP and streaks stay on
  the device until the Phase 4 RPCs and the Phase 6 sync queue.
- Offline changes are reconciled at the next sign-in or app start, not through a durable queue yet.
- Self-assessed level instead of a placement test.
- Seed content is a representative sample, not a full curriculum.
- `npm audit` reports moderate advisories in `glob`/`minimatch` pulled in by `workbox-build` (build-time only, not shipped to users).
