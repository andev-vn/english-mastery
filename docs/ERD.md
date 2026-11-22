# ERD (planned — Phase 2)

```mermaid
erDiagram
  profiles ||--o{ user_lessons : tracks
  profiles ||--o{ user_vocabulary : reviews
  profiles ||--o{ study_sessions : logs
  profiles ||--|| learning_goals : sets
  profiles ||--|| learning_streaks : has
  profiles ||--o{ assessment_results : takes
  profiles ||--o{ user_achievements : unlocks
  profiles ||--o{ ai_conversations : starts
  profiles ||--o{ user_answers : submits

  cefr_levels ||--o{ modules : contains
  modules ||--o{ lessons : contains
  lessons ||--o{ lesson_contents : "ordered blocks"
  lessons ||--o{ user_lessons : ""
  cefr_levels ||--o{ grammar_topics : ""
  lessons |o--o{ grammar_topics : explains

  vocabulary_topics ||--o{ vocabulary : groups
  vocabulary ||--o{ user_vocabulary : ""

  exercises ||--o{ questions : contains
  questions ||--o{ answer_options : offers
  questions ||--o{ user_answers : ""

  assessments ||--o{ assessment_questions : contains
  assessments ||--o{ assessment_results : ""

  achievements ||--o{ user_achievements : ""
  ai_conversations ||--o{ ai_messages : contains
```

Lesson ↔ vocabulary and lesson ↔ exercise references are stored in `lesson_contents.block` (`vocabulary` / `exercise` blocks),
matching the client model in `src/types/content.ts`.
