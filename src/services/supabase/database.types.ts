export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          description: string
          goal: number
          id: string
          metric: string
          title: string
        }
        Insert: {
          description: string
          goal: number
          id: string
          metric: string
          title: string
        }
        Update: {
          description?: string
          goal?: number
          id?: string
          metric?: string
          title?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_user_id_fkey"
            columns: ["conversation_id", "user_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          action: string
          created_at: string
          id: number
          input_tokens: number
          model: string
          output_tokens: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: never
          input_tokens?: number
          model?: string
          output_tokens?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: never
          input_tokens?: number
          model?: string
          output_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_options: {
        Row: {
          id: string
          is_correct: boolean
          option_key: string
          position: number
          question_id: string
          text: string
        }
        Insert: {
          id?: string
          is_correct?: boolean
          option_key: string
          position: number
          question_id: string
          text: string
        }
        Update: {
          id?: string
          is_correct?: boolean
          option_key?: string
          position?: number
          question_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          assessment_id: string
          explanation_vi: string
          id: string
          level_id: string
          payload: Json
          position: number
          prompt: string
          skill: string
          type: string
        }
        Insert: {
          assessment_id: string
          explanation_vi?: string
          id: string
          level_id: string
          payload?: Json
          position: number
          prompt: string
          skill: string
          type: string
        }
        Update: {
          assessment_id?: string
          explanation_vi?: string
          id?: string
          level_id?: string
          payload?: Json
          position?: number
          prompt?: string
          skill?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_questions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          assessment_id: string
          client_op_id: string | null
          created_at: string
          estimated_level: string
          id: string
          level_scores: Json
          mastered_level: string | null
          score: number
          skill_scores: Json
          user_id: string
        }
        Insert: {
          assessment_id: string
          client_op_id?: string | null
          created_at?: string
          estimated_level: string
          id?: string
          level_scores?: Json
          mastered_level?: string | null
          score: number
          skill_scores?: Json
          user_id: string
        }
        Update: {
          assessment_id?: string
          client_op_id?: string | null
          created_at?: string
          estimated_level?: string
          id?: string
          level_scores?: Json
          mastered_level?: string | null
          score?: number
          skill_scores?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_estimated_level_fkey"
            columns: ["estimated_level"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_mastered_level_fkey"
            columns: ["mastered_level"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          created_at: string
          description: string
          estimated_minutes: number
          id: string
          is_published: boolean
          title: string
          title_vi: string
        }
        Insert: {
          created_at?: string
          description?: string
          estimated_minutes?: number
          id: string
          is_published?: boolean
          title: string
          title_vi: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          title?: string
          title_vi?: string
        }
        Relationships: []
      }
      cefr_levels: {
        Row: {
          description: string
          id: string
          name: string
          name_vi: string
          sort_order: number
        }
        Insert: {
          description?: string
          id: string
          name: string
          name_vi: string
          sort_order: number
        }
        Update: {
          description?: string
          id?: string
          name?: string
          name_vi?: string
          sort_order?: number
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          description: string
          estimated_minutes: number
          id: string
          is_published: boolean
          level_id: string
          skill: string
          title: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          estimated_minutes: number
          id: string
          is_published?: boolean
          level_id: string
          skill: string
          title: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          level_id?: string
          skill?: string
          title?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_topics: {
        Row: {
          id: string
          lesson_id: string | null
          level_id: string
          sort_order: number
          summary_vi: string
          title: string
          title_vi: string
        }
        Insert: {
          id: string
          lesson_id?: string | null
          level_id: string
          sort_order?: number
          summary_vi?: string
          title: string
          title_vi: string
        }
        Update: {
          id?: string
          lesson_id?: string | null
          level_id?: string
          sort_order?: number
          summary_vi?: string
          title?: string
          title_vi?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_topics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_topics_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_goals: {
        Row: {
          daily_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_streaks: {
        Row: {
          best_streak: number
          current_streak: number
          last_active_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          last_active_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          last_active_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_contents: {
        Row: {
          block: Json
          id: string
          lesson_id: string
          position: number
        }
        Insert: {
          block: Json
          id?: string
          lesson_id: string
          position: number
        }
        Update: {
          block?: Json
          id?: string
          lesson_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_contents_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          description: string
          estimated_minutes: number
          exercise_ids: string[]
          id: string
          is_published: boolean
          level_id: string
          module_id: string
          objectives: string[]
          sort_order: number
          title: string
          title_vi: string
          updated_at: string
          vocabulary_ids: string[]
        }
        Insert: {
          created_at?: string
          description?: string
          estimated_minutes: number
          exercise_ids?: string[]
          id: string
          is_published?: boolean
          level_id: string
          module_id: string
          objectives?: string[]
          sort_order: number
          title: string
          title_vi: string
          updated_at?: string
          vocabulary_ids?: string[]
        }
        Update: {
          created_at?: string
          description?: string
          estimated_minutes?: number
          exercise_ids?: string[]
          id?: string
          is_published?: boolean
          level_id?: string
          module_id?: string
          objectives?: string[]
          sort_order?: number
          title?: string
          title_vi?: string
          updated_at?: string
          vocabulary_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "lessons_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_level_id_fkey"
            columns: ["module_id", "level_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id", "level_id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_published: boolean
          level_id: string
          sort_order: number
          title: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id: string
          is_published?: boolean
          level_id: string
          sort_order: number
          title: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          level_id?: string
          sort_order?: number
          title?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cefr_level: string
          created_at: string
          display_name: string
          explanation_language: string
          goal: string
          id: string
          onboarded: boolean
          updated_at: string
        }
        Insert: {
          cefr_level?: string
          created_at?: string
          display_name?: string
          explanation_language?: string
          goal?: string
          id: string
          onboarded?: boolean
          updated_at?: string
        }
        Update: {
          cefr_level?: string
          created_at?: string
          display_name?: string
          explanation_language?: string
          goal?: string
          id?: string
          onboarded?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cefr_level_fkey"
            columns: ["cefr_level"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          context: string | null
          exercise_id: string
          explanation_vi: string
          id: string
          payload: Json
          position: number
          prompt: string
          type: string
        }
        Insert: {
          context?: string | null
          exercise_id: string
          explanation_vi: string
          id: string
          payload?: Json
          position: number
          prompt: string
          type: string
        }
        Update: {
          context?: string | null
          exercise_id?: string
          explanation_vi?: string
          id?: string
          payload?: Json
          position?: number
          prompt?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_activities: {
        Row: {
          category: string
          created_at: string
          description: string
          exercise_id: string | null
          id: string
          is_published: boolean
          level_id: string
          payload: Json
          skill: string
          sort_order: number
          title: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          exercise_id?: string | null
          id: string
          is_published?: boolean
          level_id: string
          payload: Json
          skill: string
          sort_order?: number
          title: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          exercise_id?: string | null
          id?: string
          is_published?: boolean
          level_id?: string
          payload?: Json
          skill?: string
          sort_order?: number
          title?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_activities_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_activities_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          client_op_id: string
          created_at: string
          duration_seconds: number
          id: string
          kind: string
          ref_id: string | null
          score: number | null
          user_id: string
          xp: number
        }
        Insert: {
          client_op_id: string
          created_at?: string
          duration_seconds?: number
          id?: string
          kind: string
          ref_id?: string | null
          score?: number | null
          user_id: string
          xp?: number
        }
        Update: {
          client_op_id?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          kind?: string
          ref_id?: string | null
          score?: number | null
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          answer: Json
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          user_id: string
        }
        Insert: {
          answer: Json
          attempt_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          user_id: string
        }
        Update: {
          answer?: Json
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lessons: {
        Row: {
          completed_at: string | null
          lesson_id: string
          progress_percent: number
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          lesson_id: string
          progress_percent?: number
          started_at?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          lesson_id?: string
          progress_percent?: number
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lessons_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lessons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_vocabulary: {
        Row: {
          created_at: string
          ease_factor: number
          interval_days: number
          is_favorite: boolean
          lapses: number
          last_reviewed_at: string | null
          next_review_at: string
          repetitions: number
          updated_at: string
          user_id: string
          vocabulary_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          interval_days?: number
          is_favorite?: boolean
          lapses?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          updated_at?: string
          user_id: string
          vocabulary_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          interval_days?: number
          is_favorite?: boolean
          lapses?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
          vocabulary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vocabulary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_vocabulary_vocabulary_id_fkey"
            columns: ["vocabulary_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary: {
        Row: {
          antonyms: string[]
          audio_path: string | null
          collocations: string[]
          created_at: string
          definition: string
          example: string
          example_vi: string
          id: string
          ipa: string
          is_published: boolean
          level_id: string
          meaning_vi: string
          part_of_speech: string
          synonyms: string[]
          topic_id: string
          updated_at: string
          word: string
        }
        Insert: {
          antonyms?: string[]
          audio_path?: string | null
          collocations?: string[]
          created_at?: string
          definition: string
          example: string
          example_vi: string
          id: string
          ipa?: string
          is_published?: boolean
          level_id: string
          meaning_vi: string
          part_of_speech: string
          synonyms?: string[]
          topic_id: string
          updated_at?: string
          word: string
        }
        Update: {
          antonyms?: string[]
          audio_path?: string | null
          collocations?: string[]
          created_at?: string
          definition?: string
          example?: string
          example_vi?: string
          id?: string
          ipa?: string
          is_published?: boolean
          level_id?: string
          meaning_vi?: string
          part_of_speech?: string
          synonyms?: string[]
          topic_id?: string
          updated_at?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "cefr_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "vocabulary_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      vocabulary_topics: {
        Row: {
          id: string
          name: string
          name_vi: string
        }
        Insert: {
          id: string
          name: string
          name_vi: string
        }
        Update: {
          id?: string
          name?: string
          name_vi?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _local_date: { Args: { p_tz: string }; Returns: string }
      _progress_summary: {
        Args: { p_tz: string; p_user: string }
        Returns: Json
      }
      _require_user: { Args: never; Returns: string }
      _safe_tz: { Args: { p_tz: string }; Returns: string }
      _touch_streak: {
        Args: { p_day: string; p_user: string }
        Returns: undefined
      }
      _unlock_achievements: { Args: { p_user: string }; Returns: string[] }
      complete_lesson: {
        Args: { p_lesson_id: string; p_op_id: string; p_tz?: string }
        Returns: Json
      }
      get_progress_summary: { Args: { p_tz?: string }; Returns: Json }
      grade_answer: {
        Args: {
          p_answer: Json
          p_correct_option: string
          p_payload: Json
          p_type: string
        }
        Returns: boolean
      }
      matches_any: {
        Args: { p_accepted: Json; p_input: string }
        Returns: boolean
      }
      normalize_answer: { Args: { t: string }; Returns: string }
      record_reviews: {
        Args: {
          p_duration_seconds: number
          p_op_id: string
          p_recalled: number
          p_reviewed: number
          p_tz?: string
        }
        Returns: Json
      }
      submit_assessment: {
        Args: {
          p_answers: Json
          p_assessment_id: string
          p_duration_seconds: number
          p_op_id: string
          p_tz?: string
        }
        Returns: Json
      }
      submit_exercise: {
        Args: {
          p_answers: Json
          p_duration_seconds: number
          p_exercise_id: string
          p_op_id: string
          p_tz?: string
        }
        Returns: Json
      }
      sync_vocabulary: {
        Args: { p_cards?: Json; p_deleted?: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
