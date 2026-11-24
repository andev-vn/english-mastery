# Architecture

## Goals

Mobile-first, fast, offline-capable, free to run. Core learning must work with **no backend and no AI**.

## High level

```
Browser (PWA)
├── React app (Vite build, served statically from Cloudflare Pages)
│   ├── UI: features/* pages + components/* design system
│   ├── State
│   │   ├── TanStack Query  → read-only content (lessons, vocabulary, exercises)
│   │   └── Zustand         → learner progress (IndexedDB) + settings (localStorage)
│   ├── Services            → content repository, sync queue, account/progress sync, AI tutor client
│   ├── IndexedDB (Dexie)   → progress snapshot, sync queue, downloaded content
│   └── Service worker      → precached shell + content chunks (Workbox)
└── Supabase (optional): Postgres + RLS, Auth (PKCE), RPCs, Edge Function `ai-tutor` (optional AI proxy)
```

## Source layout

```
src/
  app/            router, providers, layouts (AppLayout, BareLayout), guards, error boundary, PWA prompt
  components/
    ui/           design-system primitives (Button, Field, Dialog, Tabs, Toast, Progress, States…)
    learning/     domain components (LessonCard, VocabularyCard, ExerciseOption, AchievementCard, SpeakButton)
  features/       one folder per area; each page is a lazily loaded route chunk
    dashboard/ learn/ practice/ (engine/) vocabulary/ profile/ onboarding/
  data/           seed learning content (typed TS modules, lazily imported)
  lib/            pure logic: srs, grading, xp, progress selectors, date, speech, hooks
  services/       ContentRepository + TanStack Query hooks
  stores/         Zustand stores (progress, settings)
  types/          domain model (content.ts, progress.ts)
  styles/         Tailwind entry + design tokens + fonts
```

## Key decisions

| Decision | Why |
| --- | --- |
| **Repository layer** (`services/contentRepository.ts`) | Pages never touch data sources. Phase 2 swaps in a Supabase implementation with local fallback without touching UI. |
| **Content as lazily imported TS modules** | Type-checked seed data; code-split away from the app shell; precached for offline. Same shape as the planned DB rows. |
| **TanStack Query for content, Zustand for progress** | Content is server-state-like (cacheable, read-only). Progress is local-first user state that must work offline. |
| **Typed exercise model** (`types/content.ts` discriminated union) | One engine (`features/practice/engine`) renders and grades every question type; no per-question screens. |
| **Pure logic in `lib/`** | SRS, grading, XP and streak rules are unit-tested without React. |
| **Native `<dialog>`** for Modal / Drawer / BottomSheet | Focus trap, Escape and inert background for free; no dialog library. |
| **Data router + route `lazy`** | Route-level code splitting, error boundary per route tree, direct URL access works. |
| **Device first, durable outbox** | Every action is saved on the device, then queued (IndexedDB) for the server with an idempotency key; the UI never waits for the network. See docs/PWA.md. |
| **AI only behind an Edge Function** | Provider keys stay in server secrets; a provider interface keeps the vendor swappable; the UI renders AI actions only when the server says the tutor is available. |
| **Guest mode first, accounts optional** | Everything works without an account. Supabase Auth adds a synced profile; `RequireAuth` protects account-only routes. Without Supabase config, the SDK is never loaded. |

## Routing

| Path | Layout | Notes |
| --- | --- | --- |
| `/` | – | Redirects to `/dashboard` or `/welcome` |
| `/welcome`, `/onboarding` | Bare | Public |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback` | Bare | Public; show an "accounts unavailable" state when Supabase isn't configured |
| `/dashboard`, `/learning-path`, `/levels/:levelId`, `/modules/:moduleId`, `/practice`, `/vocabulary`, `/profile`, `/progress`, `/settings` | App (bottom nav / side rail) | Requires onboarding |
| `/account` | App | Requires onboarding **and** sign-in (`RequireAuth` → `/login?redirect=…`) |
| `/lessons/:lessonId`, `/practice/:exerciseId`, `/vocabulary/review` | Bare (focus mode) | Requires onboarding |
| `*` | – | 404 page |

`/grammar` and `/grammar/:topicId` (App layout) list grammar topics by level and show a reference view.

`/placement-test` (focus layout) runs the placement test; `/assessments` (App layout) shows results history.

`/listening`, `/speaking`, `/reading`, `/writing` (App layout) list skill activities; `/<skill>/:activityId` (focus layout)
runs one; `/developer` collects Developer English lessons and activities. Comprehension questions open
`/practice/:exerciseId?from=/<skill>/<id>` and return to the activity.
They are intentionally not registered yet so the app has no placeholder screens.

## Progress rules

- Lesson completion: +20 XP once per lesson.
- Exercise: +5 XP per correct answer **above the previous best**, +10 for a first perfect score.
- Flashcards: +2 XP per *due* card recalled; early reviews earn nothing.
- Streak: a day counts when any study activity is recorded; the current streak survives until the end of the next day.
- Lesson availability: levels ≤ learner level + 1 are open; higher levels unlock sequentially per module.
- Signed-in learners: the same rules are enforced on the server by the progress RPCs (server-side grading; review XP
  capped at 120 per day). The device shows its own values merged with the server's, never lowering either.
- Skill activities: speaking, writing and dictation log study time (streak) but award no XP; their feedback is
  rule/keyword based and labelled as such in the UI.
- Placement estimate: a level is mastered at ≥ 75 % correct; the estimate is the level after the highest consecutive
  mastered level (A1 if none, C2 if all).

## Error handling

- Route-level `errorElement` (`app/RouteError.tsx`) — also explains failed chunk loads while offline.
- Every data-driven page renders loading (skeleton), error (retry) and empty states.
