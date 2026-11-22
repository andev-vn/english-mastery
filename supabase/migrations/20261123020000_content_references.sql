-- =============================================================================
-- Content fields needed to rebuild the app's content model from the database.
-- =============================================================================

-- Explicit references from a lesson to the words and exercises it teaches
-- (the lesson blocks reference them too, but the lesson-level lists drive navigation).
alter table public.lessons
  add column vocabulary_ids text[] not null default '{}',
  add column exercise_ids   text[] not null default '{}';

-- One-line Vietnamese summary for the grammar index.
alter table public.grammar_topics
  add column summary_vi text not null default '';

-- Grammar topics are listed per level in a fixed order.
alter table public.grammar_topics
  add constraint grammar_topics_level_sort_key unique (level_id, sort_order);
