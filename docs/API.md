# API & service layer

The UI talks only to service modules. There is no custom backend server.

## Content (implemented)

`src/services/contentRepository.ts`: `getLevels`, `getModules`, `getModule`, `getLessons`, `getLesson`,
`getVocabulary`, `getVocabularyTopics`, `getExercises`, `getExercise`, `getGrammarTopics`, `getAssessment`,
`getActivities(skill?)`, `getActivity`.

Strategy: **bundled first, Supabase in the background.**
1. Reads are served from the bundled dataset (`services/content/dataset.ts`, lazily imported, precached by the service worker).
2. `ContentSync` (mounted in `App`) calls `refreshFromRemote()` once per session when the browser is idle. It loads all
   published rows (`services/content/remoteDataset.ts`, paginated), converts them with `assembleDataset()` (which
   validates enum columns and JSON payloads), and swaps the dataset in. Content queries are then invalidated;
   unchanged data does not re-render thanks to TanStack Query's structural sharing.
3. Offline, unconfigured, timeout (10 s), empty or malformed data: the bundled content stays.

React hooks (`src/services/contentQueries.ts`) all use query keys prefixed with `'content'`.

## Learning data sync (implemented)

`src/services/learningSync.ts`, for signed-in users only:
- `syncVocabularyOnSignIn(userId)`: merges `user_vocabulary` with local cards via `mergeVocabulary()`
  (`src/lib/vocabularyMerge.ts`). The newest version of each word wins; local deletions are kept as tombstones so they
  propagate to the server instead of being restored from it.
- `watchVocabularyChanges(userId)`: debounced, batched upserts and deletes after each change.
- `recordAnswers({ exerciseId, attemptId, results })`: inserts one `user_answers` row per question.

## Supabase client & auth (implemented)

- `src/lib/env.ts`: validated config. Supabase is enabled only when both `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` are set; secret/service-role keys are rejected.
- `src/services/supabase/client.ts`: `getSupabase()` lazily imports the SDK (its own ~56 KB gzip chunk, never loaded
  in guest mode) and creates one client with the PKCE flow and persisted sessions. Returns `null` when unconfigured.
- `src/services/auth/authService.ts`: `signIn`, `signUp` (sends `display_name` metadata), `signOut` (this device only),
  `requestPasswordReset`, `updatePassword`, `resolveSessionUser`, `safeNextPath` (blocks open redirects).
- `src/services/auth/authErrors.ts`: Supabase error codes mapped to Vietnamese messages.
- `src/stores/authStore.ts` + `src/app/AuthSync.tsx`: mirror the session (`disabled | loading | signed_in | signed_out`).
- `src/services/profileRepository.ts`: `fetchProfile`, `saveProfile` (profiles + learning_goals, RLS-scoped).
- `src/services/accountSync.ts`: on sign-in, reconciles the device profile with the account (`decideProfileSync`:
  the onboarded side wins, otherwise the newest `updated_at`), then pushes later edits (debounced).

Email links go to `/auth/callback?next=…`, which waits for the PKCE code exchange, syncs the profile and continues.

## Progress (implemented)

Local, for every learner: `src/stores/progressStore.ts` (Zustand, persisted to IndexedDB key `em-progress`; see docs/PWA.md).

| Action | Effect |
| --- | --- |
| `completeOnboarding(profile)` / `updateProfile(patch)` | Learner profile |
| `startLesson(id)` / `completeLesson(lesson)` → xp | Completion and XP once per lesson |
| `recordExercise(...)` → `{ xp, attempt }` | Attempt history; XP only on improvement |
| `saveWord` / `removeWord` / `toggleFavorite` / `reviewWord(id, grade)` | Vocabulary and SRS |
| `finishReviewSession(...)` / `recordAssessment(record)` | Activity log, assessment history |
| `mergeServerProgress(summary)` | Applies the account's progress, never lowering local values |
| `applyServerCards(newer, processedDeletions)` | Adopts account copies of words that are newer than the device's |

Server, for signed-in users: `src/services/progressSync.ts` queues these Postgres RPC calls in the durable sync queue
(`src/services/sync/syncQueue.ts`), which sends them when online (`security definer`,
`authenticated` only, idempotent per `p_op_id`, `p_tz` = IANA time zone for streak days):

| RPC | Validates / does |
| --- | --- |
| `complete_lesson(p_lesson_id, p_op_id, p_tz)` | Lesson exists; 20 XP once per lesson (decided from the read-only session ledger) |
| `submit_exercise(p_exercise_id, p_answers, p_duration_seconds, p_op_id, p_tz)` | **Grades the answers on the server**, stores `user_answers`, XP = 5 × improvement + 10 first perfect |
| `record_reviews(p_reviewed, p_recalled, p_duration_seconds, p_op_id, p_tz)` | 2 XP per recalled card, capped at 120 XP per local day |
| `submit_assessment(p_assessment_id, p_answers, p_duration_seconds, p_op_id, p_tz)` | Grades the placement test, stores `assessment_results` (no XP) |
| `get_progress_summary(p_tz)` | Totals, streak, completed lessons, achievements, last 60 days |

| `sync_vocabulary(p_cards, p_deleted)` | `security invoker` (RLS applies). Upserts a word only if newer than the server copy, deletes only if the server copy is not newer; device times clamped to `now()`; unknown words skipped; returns `{ newer: rows[] }` |

Every progress RPC returns the progress summary, which the client merges back. Sign-in runs `syncProgressOnSignIn()`:
upload lessons completed as a guest, then restore the account's progress. The server dates an operation by when it
arrives, so activity done offline counts toward the server streak on the day it syncs (the device keeps the real day).

## AI tutor (optional): `functions/v1/ai-tutor`

Supabase Edge Function (`supabase/functions/ai-tutor`). The provider key is a server secret; the browser only sends the
learner's session. `POST` JSON:

| `action` | Body | Response |
| --- | --- | --- |
| `status` | none (no session needed) | `{ available, provider, limits }` |
| `chat` | `level`, `message` (max 2000), `conversationId?` | `{ conversationId, reply }`; both turns saved in `ai_conversations` / `ai_messages`; the last 20 turns are sent as context |
| `correct_writing` | `level`, `text` (max 4000), `taskVi?` | `{ feedback: { correctedText, issues[{original, suggestion, explanationVi}], overallVi } }` |
| `evaluate_answer` | `level`, `question`, `answer` | `{ evaluation: { verdict: good/acceptable/needs_work, feedbackVi, improvedAnswer } }` |

Errors are `{ code, message }`: `400 invalid_request`, `401 not_signed_in`, `404 conversation_not_found`,
`429 rate_limited_day | rate_limited_minute` (default 30/day and 5/min per user, counted in `ai_usage_events`),
`422 ai_refused`, `502 ai_failed`, `503 ai_unavailable` (no provider key). The client (`src/services/aiTutor.ts`)
maps them to Vietnamese messages; AI buttons are only rendered when `status` says available and the learner is signed in.

Provider interface (`supabase/functions/ai-tutor/provider.ts`), implemented for Claude in `anthropic.ts`:

```ts
interface AIProvider {
  generateResponse(input: TutorContext & { messages: ChatTurn[] }): Promise<Result<string>>;
  correctWriting(input: TutorContext & { text: string; taskVi?: string }): Promise<Result<AIWritingFeedback>>;
  evaluateAnswer(input: TutorContext & { question: string; answer: string }): Promise<Result<AIAnswerEvaluation>>;
}
```

Structured results use JSON-schema structured outputs (Zod schemas). AI-generated exercises are not implemented:
generated questions would need the same validation as seeded content before the server could grade them.
