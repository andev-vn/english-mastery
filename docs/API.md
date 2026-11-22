# API & service layer

The UI talks only to service modules. There is no custom backend server.

## Content (implemented)

`src/services/contentRepository.ts`

```ts
interface ContentRepository {
  getLevels(): Promise<LevelInfo[]>;
  getModules(levelId?: CefrLevel): Promise<Module[]>;
  getModule(moduleId: string): Promise<Module | undefined>;
  getLessons(filter?: { moduleId?: string; levelId?: CefrLevel }): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | undefined>;
  getVocabulary(): Promise<VocabularyEntry[]>;
  getVocabularyTopics(): Promise<VocabularyTopic[]>;
  getExercises(): Promise<Exercise[]>;
  getExercise(exerciseId: string): Promise<Exercise | undefined>;
}
```

Current implementation: `localContentRepository` (bundled, lazily imported seed data).
Phase 2: `supabaseContentRepository` reading published rows, falling back to the local dataset offline.

React hooks (`src/services/contentQueries.ts`): `useLevels`, `useModules`, `useModule`, `useLessons`, `useLesson`,
`useVocabulary`, `useVocabularyTopics`, `useExercises`, `useExercise` — TanStack Query, `staleTime: Infinity`.

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

Phase 2/6: these become calls on a `ProgressRepository` that writes to IndexedDB and queues sync operations
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
