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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          course_id: string | null
          created_at: string
          created_by: string
          id: string
          published_at: string | null
          scope: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          course_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          published_at?: string | null
          scope?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          course_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          published_at?: string | null
          scope?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      brotherhood_connections: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          is_locked: boolean
          is_pinned: boolean
          name: string
          sort_order: number
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          name: string
          sort_order?: number
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          name?: string
          sort_order?: number
          type?: string
        }
        Relationships: []
      }
      chat_dms: {
        Row: {
          created_at: string
          id: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      chat_flags: {
        Row: {
          created_at: string
          flagged_by: string
          id: string
          message_id: string
          reason: string | null
          status: string
        }
        Insert: {
          created_at?: string
          flagged_by: string
          id?: string
          message_id: string
          reason?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          flagged_by?: string
          id?: string
          message_id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_flags_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string
          dm_id: string | null
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string
          dm_id?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string
          dm_id?: string | null
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_dm_id_fkey"
            columns: ["dm_id"]
            isOneToOne: false
            referencedRelation: "chat_dms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_cursors: {
        Row: {
          channel_id: string | null
          dm_id: string | null
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          dm_id?: string | null
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          dm_id?: string | null
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_cursors_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_read_cursors_dm_id_fkey"
            columns: ["dm_id"]
            isOneToOne: false
            referencedRelation: "chat_dms"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          course_id: string
          id: string
          percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          order_index: number
          program_id: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          program_id?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          program_id?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_button_events: {
        Row: {
          created_at: string
          id: string
          selected_feeling: string | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          selected_feeling?: string | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          selected_feeling?: string | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      curriculum_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_viewed_at: string | null
          lesson_id: string
          percent: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          lesson_id: string
          percent?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          lesson_id?: string
          percent?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "curriculum_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_lessons: {
        Row: {
          audio_url: string | null
          content_json: Json
          created_at: string
          duration_minutes: number | null
          id: string
          order_index: number
          published_at: string | null
          slug: string
          status: string
          summary: string | null
          title: string
          unlock_day_offset: number | null
          unlock_rule: string
          updated_at: string
          video_url: string | null
          week_id: string
        }
        Insert: {
          audio_url?: string | null
          content_json?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index?: number
          published_at?: string | null
          slug: string
          status?: string
          summary?: string | null
          title: string
          unlock_day_offset?: number | null
          unlock_rule?: string
          updated_at?: string
          video_url?: string | null
          week_id: string
        }
        Update: {
          audio_url?: string | null
          content_json?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          order_index?: number
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          unlock_day_offset?: number | null
          unlock_rule?: string
          updated_at?: string
          video_url?: string | null
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_lessons_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_settings: {
        Row: {
          cover_image_url: string | null
          created_at: string
          drip_mode: string
          duration_label: string | null
          id: string
          status: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          drip_mode?: string
          duration_label?: string | null
          id?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          drip_mode?: string
          duration_label?: string | null
          id?: string
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      curriculum_versions: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          published: boolean
          published_at: string | null
          snapshot_json: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          published?: boolean
          published_at?: string | null
          snapshot_json: Json
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          published?: boolean
          published_at?: string | null
          snapshot_json?: Json
          version_number?: number
        }
        Relationships: []
      }
      daily_check_ins: {
        Row: {
          check_in_date: string
          created_at: string
          feelings: string[]
          id: string
          needs_support: boolean
          spirit_response: string | null
          user_id: string
        }
        Insert: {
          check_in_date?: string
          created_at?: string
          feelings?: string[]
          id?: string
          needs_support?: boolean
          spirit_response?: string | null
          user_id: string
        }
        Update: {
          check_in_date?: string
          created_at?: string
          feelings?: string[]
          id?: string
          needs_support?: boolean
          spirit_response?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_completions: {
        Row: {
          category: string
          completion_date: string
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          category: string
          completion_date?: string
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          category?: string
          completion_date?: string
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          active: boolean
          entitlement_type: string
          expires_at: string | null
          id: string
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          entitlement_type?: string
          expires_at?: string | null
          id?: string
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          entitlement_type?: string
          expires_at?: string | null
          id?: string
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["user_id"]
          },
        ]
      }
      evidence_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      freedom_streaks: {
        Row: {
          id: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gratitude_entries: {
        Row: {
          created_at: string
          entry_1: string
          entry_2: string
          entry_3: string
          entry_date: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_1: string
          entry_2: string
          entry_3: string
          entry_date?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_1?: string
          entry_2?: string
          entry_3?: string
          entry_date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_viewed_at: string | null
          lesson_id: string
          percent: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          lesson_id: string
          percent?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          lesson_id?: string
          percent?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          order_index: number
          storage_path: string | null
          title: string
          type: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          order_index?: number
          storage_path?: string | null
          title: string
          type?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
          storage_path?: string | null
          title?: string
          type?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          audio_url: string | null
          content_json: Json
          created_at: string
          duration_minutes: number | null
          id: string
          module_id: string
          order_index: number
          published_at: string | null
          slug: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content_json?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id: string
          order_index?: number
          published_at?: string | null
          slug: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content_json?: Json
          created_at?: string
          duration_minutes?: number | null
          id?: string
          module_id?: string
          order_index?: number
          published_at?: string | null
          slug?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_insights: {
        Row: {
          action_step: string
          created_at: string
          dismissed: boolean
          dismissed_at: string | null
          id: string
          message: string
          pattern_type: string
          scripture_reference: string
          scripture_text: string
          surfaced_at: string
          title: string
          user_id: string
        }
        Insert: {
          action_step: string
          created_at?: string
          dismissed?: boolean
          dismissed_at?: string | null
          id?: string
          message: string
          pattern_type: string
          scripture_reference: string
          scripture_text: string
          surfaced_at?: string
          title: string
          user_id: string
        }
        Update: {
          action_step?: string
          created_at?: string
          dismissed?: boolean
          dismissed_at?: string | null
          id?: string
          message?: string
          pattern_type?: string
          scripture_reference?: string
          scripture_text?: string
          surfaced_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["user_id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          currency: string
          interval: string
          name: string
          plan_key: string
          stripe_price_id: string
        }
        Insert: {
          active?: boolean
          amount?: number
          created_at?: string
          currency?: string
          interval: string
          name: string
          plan_key: string
          stripe_price_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          currency?: string
          interval?: string
          name?: string
          plan_key?: string
          stripe_price_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          first_name: string | null
          last_name: string | null
          last_seen_at: string | null
          must_change_password: boolean
          name: string | null
          onboarding_completed: boolean
          password_set: boolean
          phone: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          first_name?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          must_change_password?: boolean
          name?: string | null
          onboarding_completed?: boolean
          password_set?: boolean
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          first_name?: string | null
          last_name?: string | null
          last_seen_at?: string | null
          must_change_password?: boolean
          name?: string | null
          onboarding_completed?: boolean
          password_set?: boolean
          phone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          order_index: number
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      relapse_events: {
        Row: {
          created_at: string
          day_of_week: number | null
          id: string
          program_day: number | null
          recent_emotions: string[] | null
          relapsed_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          program_day?: number | null
          recent_emotions?: string[] | null
          relapsed_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          id?: string
          program_day?: number | null
          recent_emotions?: string[] | null
          relapsed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          status: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_action_items: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string | null
          text: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          text: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_action_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_declarations: {
        Row: {
          created_at: string
          declaration_text: string
          id: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          declaration_text: string
          id?: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          declaration_text?: string
          id?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_enrollments: {
        Row: {
          created_at: string
          enrolled_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enrolled_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enrolled_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_journal_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string | null
          prompt: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          prompt?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string | null
          prompt?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_journal_entries_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          error_message: string | null
          event_type: string
          processed_at: string | null
          received_at: string
          status: string
          stripe_event_id: string
        }
        Insert: {
          error_message?: string | null
          event_type: string
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_event_id: string
        }
        Update: {
          error_message?: string | null
          event_type?: string
          processed_at?: string | null
          received_at?: string
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      weeks: {
        Row: {
          created_at: string
          id: string
          order_index: number
          status: string
          summary: string | null
          title: string
          unlock_day_offset: number
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          status?: string
          summary?: string | null
          title: string
          unlock_day_offset?: number
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          status?: string
          summary?: string | null
          title?: string
          unlock_day_offset?: number
          updated_at?: string
          week_number?: number
        }
        Relationships: []
      }
      yield_logs: {
        Row: {
          created_at: string
          custom_text: string | null
          id: string
          user_id: string
          yield_type: string
        }
        Insert: {
          created_at?: string
          custom_text?: string | null
          id?: string
          user_id: string
          yield_type: string
        }
        Update: {
          created_at?: string
          custom_text?: string | null
          id?: string
          user_id?: string
          yield_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_directory: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          first_name: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          first_name?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          first_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      deactivate_expired_entitlements: { Args: never; Returns: number }
      get_community_armor_stats: { Args: never; Returns: Json }
      get_evidence_counts_by_user: {
        Args: never
        Returns: {
          evidence_count: number
          user_id: string
        }[]
      }
      has_active_entitlement: {
        Args: { _type?: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "moderator"],
    },
  },
} as const
