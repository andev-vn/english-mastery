# API & service layer

The UI talks only to service modules. There is no custom backend server.

## Content (implemented)

`src/services/contentRepository.ts`: `getLevels`, `getModules`, `getModule`, `getLessons`, `getLesson`,
`getVocabulary`, `getVocabularyTopics`, `getExercises`, `getExercise`, `getGrammarTopics`.

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

## Progress (implemented locally)

`src/stores/progressStore.ts` (Zustand, persisted to `localStorage` key `em-progress`):

| Action | Effect |
| --- | --- |
| `completeOnboarding(profile)` / `updateProfile(patch)` | Learner profile |
| `startLesson(id)` | Marks a lesson in progress (idempotent) |
| `completeLesson(lesson)` → xp | Completes once; returns 0 on repeats |
| `recordExercise({ exerciseId, correct, total, durationSeconds })` → `{ xp, attempt }` | Stores attempt; XP only on improvement |
| `saveWord` / `removeWord` / `toggleFavorite` | Vocabulary list |
| `reviewWord(id, grade)` → xp | SM-2 scheduling; XP only for due cards |
| `finishReviewSession({ reviewed, xp, durationSeconds })` | Activity log + study time |
| `resetProgress()` | Clears local progress |

Phase 6: these become calls on a `ProgressRepository` that writes to IndexedDB and queues sync operations
(with client-generated operation IDs) to Supabase RPCs.

## Planned server endpoints

| Endpoint | Type | Purpose |
| --- | --- | --- |
| `rpc/complete_lesson(lesson_id, op_id)` | Postgres function (security definer) | Validated completion + XP |
| `rpc/record_exercise(exercise_id, answers, op_id)` | Postgres function | Server-side grading + XP |
| `rpc/review_word(vocabulary_id, grade, reviewed_at, op_id)` | Postgres function | SRS update, conflict check on `updated_at` |
| `functions/v1/ai-tutor` | Supabase Edge Function | Optional AI proxy; provider key stays server-side; per-user rate limit |

### AI provider interface (Phase 6)

```ts
interface AIProvider {
  generateResponse(input: TutorContext & { messages: ChatMessage[] }): Promise<string>;
  correctWriting(input: TutorContext & { text: string }): Promise<WritingFeedback>;
  evaluateAnswer(input: TutorContext & { question: string; answer: string }): Promise<AnswerEvaluation>;
  generateExercises(input: TutorContext & { topic: string; count: number }): Promise<Question[]>;
}
```

When no provider is configured the Edge Function returns `503 { code: 'ai_unavailable' }` and the UI hides AI actions.
