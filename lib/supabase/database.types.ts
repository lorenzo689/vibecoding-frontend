export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      chat_conversations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          owner_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_conversations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_sources: {
        Row: {
          assistant_role: string
          chunk_id: string | null
          created_at: string
          id: string
          message_id: string
          page_number: number | null
          quoted_excerpt: string
          rank: number
          similarity: number
        }
        Insert: {
          assistant_role?: never
          chunk_id?: string | null
          created_at?: string
          id?: string
          message_id: string
          page_number?: number | null
          quoted_excerpt: string
          rank: number
          similarity: number
        }
        Update: {
          assistant_role?: never
          chunk_id?: string | null
          created_at?: string
          id?: string
          message_id?: string
          page_number?: number | null
          quoted_excerpt?: string
          rank?: number
          similarity?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_sources_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_sources_message_id_assistant_role_fkey"
            columns: ["message_id", "assistant_role"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id", "role"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          error_code: string | null
          id: string
          input_tokens: number | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          role: string
          status: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          role: string
          status: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          input_tokens?: number | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: string | null
          file_id: string
          id: string
          metadata: Json
          page_number: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: string | null
          file_id: string
          id?: string
          metadata?: Json
          page_number?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: string | null
          file_id?: string
          id?: string
          metadata?: Json
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chunks_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      content_references: {
        Row: {
          created_at: string
          document_id: string | null
          flashcard_id: string | null
          id: string
          presentation_slide_id: string | null
          source_chunk_id: string
          summary_id: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          flashcard_id?: string | null
          id?: string
          presentation_slide_id?: string | null
          source_chunk_id: string
          summary_id?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          flashcard_id?: string | null
          id?: string
          presentation_slide_id?: string | null
          source_chunk_id?: string
          summary_id?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_references_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_references_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_references_presentation_slide_id_fkey"
            columns: ["presentation_slide_id"]
            isOneToOne: false
            referencedRelation: "presentation_slides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_references_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_references_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: Json
          created_at: string
          document_type: string
          id: string
          material_id: string
          material_type: string | null
          source_file_id: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          document_type: string
          id?: string
          material_id: string
          material_type?: string | null
          source_file_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          document_type?: string
          id?: string
          material_id?: string
          material_type?: string | null
          source_file_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_material_type_fkey"
            columns: ["material_id", "material_type"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id", "type"]
          },
          {
            foreignKeyName: "documents_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_processing_jobs: {
        Row: {
          attempts: number
          available_at: string
          created_at: string
          file_id: string
          id: string
          last_error: string | null
          locked_at: string | null
          max_attempts: number
          status: string
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          attempts?: number
          available_at?: string
          created_at?: string
          file_id: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          attempts?: number
          available_at?: string
          created_at?: string
          file_id?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          max_attempts?: number
          status?: string
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_processing_jobs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      file_processing_staging_chunks: {
        Row: {
          chunk_index: number
          content: string
          embedding: string
          job_id: string
          metadata: Json
          page_number: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          embedding: string
          job_id: string
          metadata?: Json
          page_number?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          embedding?: string
          job_id?: string
          metadata?: Json
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "file_processing_staging_chunks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "file_processing_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      file_cleanup_jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          file_id: string
          last_error: string | null
          next_attempt_at: string
          owner_id: string
          storage_path: string
          upload_key: string | null
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          file_id: string
          last_error?: string | null
          next_attempt_at?: string
          owner_id: string
          storage_path: string
          upload_key?: string | null
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          file_id?: string
          last_error?: string | null
          next_attempt_at?: string
          owner_id?: string
          storage_path?: string
          upload_key?: string | null
        }
        Relationships: []
      }
      files: {
        // Manually patched against supabase/migrations/20260913160000_file_lifecycle.sql —
        // regenerate via `npm run gen:types` against a migrated DB and remove this note.
        Row: {
          course_id: string
          created_at: string
          error_code: string | null
          id: string
          mime_type: string
          original_filename: string
          processed_at: string | null
          processing_error: string | null
          processing_status: string
          size_bytes: number
          status: string
          storage_bucket: string
          storage_path: string
          updated_at: string
          upload_key: string | null
          uploaded_by: string
        }
        Insert: {
          course_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          mime_type: string
          original_filename: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          size_bytes: number
          status?: string
          storage_bucket: string
          storage_path: string
          updated_at?: string
          upload_key?: string | null
          uploaded_by: string
        }
        Update: {
          course_id?: string
          created_at?: string
          error_code?: string | null
          id?: string
          mime_type?: string
          original_filename?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_status?: string
          size_bytes?: number
          status?: string
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
          upload_key?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          material_id: string
          material_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          material_id: string
          material_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          material_id?: string
          material_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_decks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_decks_material_type_fkey"
            columns: ["material_id", "material_type"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id", "type"]
          },
        ]
      }
      flashcards: {
        Row: {
          additional_content: Json | null
          answer: string
          created_at: string
          deck_id: string
          id: string
          question: string
          updated_at: string
        }
        Insert: {
          additional_content?: Json | null
          answer: string
          created_at?: string
          deck_id: string
          id?: string
          question: string
          updated_at?: string
        }
        Update: {
          additional_content?: Json | null
          answer?: string
          created_at?: string
          deck_id?: string
          id?: string
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          course_id: string
          created_at: string
          created_by: string
          description: string | null
          file_id: string | null
          id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          file_id?: string | null
          id?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          file_id?: string | null
          id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      presentation_slides: {
        Row: {
          content: Json
          created_at: string
          id: string
          presentation_id: string
          slide_number: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          presentation_id: string
          slide_number: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          presentation_id?: string
          slide_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentation_slides_presentation_id_fkey"
            columns: ["presentation_id"]
            isOneToOne: false
            referencedRelation: "presentations"
            referencedColumns: ["id"]
          },
        ]
      }
      presentations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          material_id: string
          material_type: string | null
          source_file_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          material_id: string
          material_type?: string | null
          source_file_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          material_id?: string
          material_type?: string | null
          source_file_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presentations_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presentations_material_type_fkey"
            columns: ["material_id", "material_type"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id", "type"]
          },
          {
            foreignKeyName: "presentations_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          content: Json
          created_at: string
          id: string
          material_id: string
          material_type: string | null
          source_file_id: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          material_id: string
          material_type?: string | null
          source_file_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          material_id?: string
          material_type?: string | null
          source_file_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summaries_material_type_fkey"
            columns: ["material_id", "material_type"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id", "type"]
          },
          {
            foreignKeyName: "summaries_source_file_id_fkey"
            columns: ["source_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_file_processing_job: {
        Args: { p_lease_seconds?: number; p_worker_id: string }
        Returns: {
          attempt: number
          file_id: string
          job_id: string
          max_attempts: number
          mime_type: string
          size_bytes: number
          storage_bucket: string
          storage_path: string
        }[]
      }
      complete_file_processing_job: {
        Args: { p_embedding_model: string; p_job_id: string; p_worker_id: string }
        Returns: undefined
      }
      fail_file_processing_job: {
        Args: {
          p_error_code: string
          p_job_id: string
          p_retry_after_seconds?: number
          p_retryable: boolean
          p_worker_id: string
        }
        Returns: undefined
      }
      renew_file_processing_lease: {
        Args: { p_job_id: string; p_worker_id: string }
        Returns: boolean
      }
      retry_file_processing: {
        Args: { p_file_id: string }
        Returns: undefined
      }
      stage_file_processing_chunks: {
        Args: { p_chunks: Json; p_job_id: string; p_worker_id: string }
        Returns: undefined
      }
      can_upload_learning_file: { Args: { p_path: string }; Returns: boolean }
      configure_file_cleanup: {
        Args: { p_api_url: string; p_service_key: string }
        Returns: undefined
      }
      complete_chat_response: {
        Args: {
          p_content: string
          p_input_tokens: number
          p_message_id: string
          p_output_tokens: number
          p_sources?: Json
        }
        Returns: undefined
      }
      expire_file_uploads: { Args: never; Returns: undefined }
      file_extension: { Args: { p_mime: string }; Returns: string }
      fail_chat_response: {
        Args: {
          p_cancelled?: boolean
          p_error_code: string | null
          p_message_id: string
          p_partial_content?: string
        }
        Returns: undefined
      }
      prepare_file_upload: {
        Args: {
          p_course_id: string
          p_filename: string
          p_mime: string
          p_size: number
          p_upload_key: string
        }
        Returns: {
          course_id: string
          created_at: string
          error_code: string | null
          id: string
          mime_type: string
          original_filename: string
          size_bytes: number
          status: string
          storage_bucket: string
          storage_path: string
          updated_at: string
          upload_key: string | null
          uploaded_by: string
        }
        SetofOptions: {
          from: "*"
          to: "files"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      match_course_chunks: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          requested_course_id: string
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          content: string
          file_id: string
          metadata: Json
          page_number: number | null
          similarity: number
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

