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

## Phase 4 — Progress & assessment ✅
- [x] Placement test (`/placement-test`): 24 questions, 4 per level, five skills; listening via speech synthesis with
      transcript fallback; estimate = level after the highest consecutive level with ≥ 3/4 correct; strengths/weaknesses
      with practice links; suggested first lesson; "set my level"; retake. Speaking is not assessed (stated in the UI).
- [x] Assessment history (`/assessments`), dashboard prompt until the first result
- [x] Server-validated progress RPCs: `complete_lesson`, `submit_exercise` (server-side grading), `record_reviews`
      (daily cap), `submit_assessment`, `get_progress_summary`; idempotent per operation id; streak in the learner's
      time zone; achievements unlocked on the server
- [x] Client: RPC calls after each meaningful action (signed-in only); on sign-in, lessons completed as a guest are
      uploaded and the account's progress is restored (never lowering local values)
- [x] Parity tests: SQL grader vs TypeScript grader on every exercise question; SQL placement scoring vs `scorePlacement()`
- [ ] Not yet verified with a real signed-in account (needs a test sign-up with a real inbox)

## Phase 5 — Language skills ✅
- [x] 20 skill activities (4 listening, 6 speaking, 4 reading, 6 writing), A1–B2, in `skill_activities` (migration 5)
- [x] Listening: speech-synthesis playback with two voices, speed, line replay, transcript/translation, vocabulary
      highlights, comprehension questions (exercise engine + server grading), dictation with LCS word alignment
- [x] Speaking: Web Speech recognition with capability detection and clear error messages; typed fallback; partner
      lines read aloud; keyword coverage vs suggested answer (explicitly not pronunciation scoring)
- [x] Reading: per-paragraph translation, tap-to-define vocabulary, comprehension questions
- [x] Writing: rule-based feedback (`src/lib/writingFeedback.ts`), checklists, sample answers, autosaved drafts, journal
- [x] Developer English hub (`/developer`): stand-up, bug explanation, Java/backend interviews, bug report, PR description, README, postmortem
- [x] Tests: library units, fake SpeechRecognition hook tests, sample answers must pass their own checks, E2E with
      recognition removed (fallback path)

## Phase 6 — Offline & AI
- [ ] Dexie storage, downloadable modules, sync queue with op IDs + conflict detection, sync status UI
- [ ] Optional AI tutor via Supabase Edge Function, provider adapter, rate limits, graceful "unavailable" state

## Phase 7 — Production
- [ ] Lighthouse audit on mobile (targets ≥ 90), accessibility review, security review
- [ ] Cloudflare Pages + Supabase production setup (DEPLOYMENT.md), CI (typecheck, lint, test, e2e)

## Known limitations
- RPC calls that fail (offline) are not retried until the Phase 6 queue; lessons are re-uploaded at the next sign-in,
  but exercise attempts and review sessions made offline stay on the device only.
- Exercise attempts made as a guest are not uploaded (their answers were not kept).
- Speaking, writing and dictation earn no XP and are stored on the device only (they cannot be graded reliably yet);
  comprehension questions earn validated XP through the exercise engine.
- Listening audio is browser speech synthesis; voice quality depends on the OS. Speech recognition is unavailable in
  Firefox; in Chrome audio is processed by Google's recognition service.
- Review XP on the server is trust-bounded (2 XP per recalled card, max 120/day) because review state is client-writable.
- Seed content is a representative sample, not a full curriculum.
- `npm audit` reports moderate advisories in `glob`/`minimatch` pulled in by `workbox-build` (build-time only, not shipped to users).
