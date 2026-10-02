// Generated from backend local migrations. Keep in sync with backend/types/database.types.ts.
// Includes learning artifacts, atomic course/deck RPCs and the learning workflow (lectures, notes, suggestions).

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
      calendar_events: {
        Row: {
          all_day: boolean
          assessment_id: string | null
          course_id: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          kind: string
          owner_id: string
          source_suggestion_id: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          assessment_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind: string
          owner_id: string
          source_suggestion_id?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          assessment_id?: string | null
          course_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          owner_id?: string
          source_suggestion_id?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "grade_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_source_suggestion_id_fkey"
            columns: ["source_suggestion_id"]
            isOneToOne: true
            referencedRelation: "document_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_admission: {
        Row: {
          starts: string[]
          user_id: string
        }
        Insert: {
          starts?: string[]
          user_id: string
        }
        Update: {
          starts?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_admission_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          source_material_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          source_material_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          source_material_id?: string | null
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
            foreignKeyName: "chat_conversations_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_execution_leases: {
        Row: {
          lease_token: string
          lease_until: string
          user_id: string
        }
        Insert: {
          lease_token: string
          lease_until: string
          user_id: string
        }
        Update: {
          lease_token?: string
          lease_until?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_execution_leases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history_summaries: {
        Row: {
          content: string
          conversation_id: string
          through_seq: number
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          through_seq: number
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          through_seq?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_history_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_sources: {
        Row: {
          chunk_id: string | null
          citation_no: number
          created_at: string
          excerpt: string
          id: string
          material_id: string | null
          material_title: string
          message_id: string
          message_role: string | null
          page_number: number | null
          similarity: number
          source_document_id: string | null
        }
        Insert: {
          chunk_id?: string | null
          citation_no: number
          created_at?: string
          excerpt: string
          id?: string
          material_id?: string | null
          material_title: string
          message_id: string
          message_role?: string | null
          page_number?: number | null
          similarity: number
          source_document_id?: string | null
        }
        Update: {
          chunk_id?: string | null
          citation_no?: number
          created_at?: string
          excerpt?: string
          id?: string
          material_id?: string | null
          material_title?: string
          message_id?: string
          message_role?: string | null
          page_number?: number | null
          similarity?: number
          source_document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_sources_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_sources_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_sources_message_id_message_role_fkey"
            columns: ["message_id", "message_role"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id", "role"]
          },
          {
            foreignKeyName: "chat_message_sources_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          helpful: boolean | null
          helpful_at: string | null
          id: string
          input_tokens: number | null
          material_ids: string[] | null
          model: string | null
          output_tokens: number | null
          provider: string | null
          request_id: string | null
          role: string
          seq: number
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          helpful?: boolean | null
          helpful_at?: string | null
          id?: string
          input_tokens?: number | null
          material_ids?: string[] | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          request_id?: string | null
          role: string
          seq: number
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          helpful?: boolean | null
          helpful_at?: string | null
          id?: string
          input_tokens?: number | null
          material_ids?: string[] | null
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          request_id?: string | null
          role?: string
          seq?: number
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
      chat_requests: {
        Row: {
          attempts: number
          conversation_id: string
          error_code: string | null
          input_tokens: number | null
          lease_token: string
          lease_until: string
          material_ids: string[] | null
          model: string
          output_tokens: number | null
          provider: string
          question_hash: string
          request_id: string
          stage: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          conversation_id: string
          error_code?: string | null
          input_tokens?: number | null
          lease_token: string
          lease_until: string
          material_ids?: string[] | null
          model: string
          output_tokens?: number | null
          provider: string
          question_hash: string
          request_id: string
          stage?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          conversation_id?: string
          error_code?: string | null
          input_tokens?: number | null
          lease_token?: string
          lease_until?: string
          material_ids?: string[] | null
          model?: string
          output_tokens?: number | null
          provider?: string
          question_hash?: string
          request_id?: string
          stage?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          lecturer: string | null
          owner_id: string
          semester: string | null
          target_grade: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lecturer?: string | null
          owner_id: string
          semester?: string | null
          target_grade?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lecturer?: string | null
          owner_id?: string
          semester?: string | null
          target_grade?: number | null
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
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          embedding: string
          embedding_model: string
          embedding_provider: string
          id: string
          metadata: Json
          page_number: number | null
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          embedding: string
          embedding_model?: string
          embedding_provider?: string
          id?: string
          metadata?: Json
          page_number?: number | null
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string
          embedding_model?: string
          embedding_provider?: string
          id?: string
          metadata?: Json
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_indexing_jobs: {
        Row: {
          attempts: number
          available_at: string
          document_id: string
          lease_token: string | null
          lease_until: string | null
          next_index: number
          total_chunks: number | null
        }
        Insert: {
          attempts?: number
          available_at?: string
          document_id: string
          lease_token?: string | null
          lease_until?: string | null
          next_index?: number
          total_chunks?: number | null
        }
        Update: {
          attempts?: number
          available_at?: string
          document_id?: string
          lease_token?: string | null
          lease_until?: string | null
          next_index?: number
          total_chunks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_indexing_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          material_id: string
          page_number: number
          quote: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          kind: string
          material_id: string
          page_number: number
          quote?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          material_id?: string
          page_number?: number
          quote?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_notes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_processing_jobs: {
        Row: {
          attempts: number
          available_at: string
          document_id: string
          file_id: string
          lease_token: string | null
          lease_until: string | null
        }
        Insert: {
          attempts?: number
          available_at?: string
          document_id: string
          file_id: string
          lease_token?: string | null
          lease_until?: string | null
        }
        Update: {
          attempts?: number
          available_at?: string
          document_id?: string
          file_id?: string
          lease_token?: string | null
          lease_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_processing_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_processing_jobs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: true
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      document_suggestions: {
        Row: {
          all_day: boolean
          created_at: string
          detail: string | null
          fingerprint: string
          id: string
          kind: string
          material_id: string
          page_number: number | null
          quote: string | null
          starts_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          detail?: string | null
          fingerprint: string
          id?: string
          kind: string
          material_id: string
          page_number?: number | null
          quote?: string | null
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          detail?: string | null
          fingerprint?: string
          id?: string
          kind?: string
          material_id?: string
          page_number?: number | null
          quote?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_suggestions_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_summaries: {
        Row: {
          content: string
          created_at: string
          id: string
          source_material_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          source_material_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          source_material_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_summaries_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: true
            referencedRelation: "materials"
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
        Row: {
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
        Insert: {
          course_id: string
          created_at?: string
          error_code?: string | null
          id?: string
          mime_type: string
          original_filename: string
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
          creation_key: string | null
          description: string | null
          id: string
          material_id: string
          material_type: string | null
          source_material_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creation_key?: string | null
          description?: string | null
          id?: string
          material_id: string
          material_type?: string | null
          source_material_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creation_key?: string | null
          description?: string | null
          id?: string
          material_id?: string
          material_type?: string | null
          source_material_id?: string | null
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
          {
            foreignKeyName: "flashcard_decks_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_progress: {
        Row: {
          card_id: string
          due_at: string | null
          interval_days: number
          known: boolean | null
          repetition_count: number
          reviewed_at: string | null
          starred: boolean
          user_id: string
        }
        Insert: {
          card_id: string
          due_at?: string | null
          interval_days?: number
          known?: boolean | null
          repetition_count?: number
          reviewed_at?: string | null
          starred?: boolean
          user_id: string
        }
        Update: {
          card_id?: string
          due_at?: string | null
          interval_days?: number
          known?: boolean | null
          repetition_count?: number
          reviewed_at?: string | null
          starred?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_progress_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_review_events: {
        Row: {
          card_id: string
          id: string
          known: boolean
          reviewed_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          id?: string
          known: boolean
          reviewed_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          id?: string
          known?: boolean
          reviewed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_review_events_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_review_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      grade_assessments: {
        Row: {
          assessment_date: string | null
          course_id: string
          created_at: string
          ects_credits: number
          grade: number | null
          id: string
          kind: string
          notes: string | null
          points_earned: number | null
          points_max: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_date?: string | null
          course_id: string
          created_at?: string
          ects_credits: number
          grade?: number | null
          id?: string
          kind: string
          notes?: string | null
          points_earned?: number | null
          points_max?: number | null
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_date?: string | null
          course_id?: string
          created_at?: string
          ects_credits?: number
          grade?: number | null
          id?: string
          kind?: string
          notes?: string | null
          points_earned?: number | null
          points_max?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_artifact_sources: {
        Row: {
          chunk_id: string | null
          deck_id: string | null
          excerpt: string
          id: string
          material_title: string
          page_number: number | null
          quiz_id: string | null
          source_document_id: string | null
          summary_id: string | null
        }
        Insert: {
          chunk_id?: string | null
          deck_id?: string | null
          excerpt: string
          id?: string
          material_title: string
          page_number?: number | null
          quiz_id?: string | null
          source_document_id?: string | null
          summary_id?: string | null
        }
        Update: {
          chunk_id?: string | null
          deck_id?: string | null
          excerpt?: string
          id?: string
          material_title?: string
          page_number?: number | null
          quiz_id?: string | null
          source_document_id?: string | null
          summary_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_artifact_sources_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_artifact_sources_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_artifact_sources_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "learning_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_artifact_sources_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_artifact_sources_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "document_summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_drafts: {
        Row: {
          kind: string
          payload: Json
          source_material_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          kind: string
          payload: Json
          source_material_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          kind?: string
          payload?: Json
          source_material_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_drafts_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_quiz_attempts: {
        Row: {
          answers: Json
          created_at: string
          id: string
          quiz_id: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          quiz_id?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "learning_quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_quizzes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          questions: Json
          source_material_id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          questions: Json
          source_material_id: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          questions?: Json
          source_material_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_quizzes_source_material_id_fkey"
            columns: ["source_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures: {
        Row: {
          course_id: string
          created_at: string
          held_on: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          held_on?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          held_on?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lectures_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
          lecture_id: string | null
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
          lecture_id?: string | null
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
          lecture_id?: string | null
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
          {
            foreignKeyName: "materials_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures"
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
      source_documents: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          extracted_text: string | null
          id: string
          indexing_error: string | null
          indexing_status: string
          material_id: string
          material_type: string | null
          page_count: number | null
          pages: Json | null
          processing_status: string
          started_at: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          extracted_text?: string | null
          id?: string
          indexing_error?: string | null
          indexing_status?: string
          material_id: string
          material_type?: string | null
          page_count?: number | null
          pages?: Json | null
          processing_status?: string
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          extracted_text?: string | null
          id?: string
          indexing_error?: string | null
          indexing_status?: string
          material_id?: string
          material_type?: string | null
          page_count?: number | null
          pages?: Json | null
          processing_status?: string
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: true
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_material_id_material_type_fkey"
            columns: ["material_id", "material_type"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id", "type"]
          },
        ]
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
      accept_document_suggestion: {
        Args: {
          p_all_day?: boolean
          p_event_kind?: string
          p_id: string
          p_starts_at?: string
          p_title?: string
        }
        Returns: Json
      }
      append_chat_exchange: {
        Args: {
          p_answer: string
          p_conversation_id: string
          p_model: string
          p_question: string
          p_request_id: string
          p_sources?: Json
        }
        Returns: Json
      }
      assessment_event_kind: { Args: { p_kind: string }; Returns: string }
      can_upload_learning_file: { Args: { p_path: string }; Returns: boolean }
      chat_exchange: {
        Args: {
          p_conversation_id: string
          p_material_ids?: string[]
          p_request_id: string
        }
        Returns: Json
      }
      chat_exchange_payload: { Args: { p_message_id: string }; Returns: Json }
      chat_feedback_stats: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          helpful_count: number
          model: string
          not_helpful_count: number
          provider: string
        }[]
      }
      claim_document_indexing: {
        Args: { p_document_id: string }
        Returns: Json
      }
      claim_document_processing: {
        Args: { p_document_id: string }
        Returns: Json
      }
      complete_chat_request: {
        Args: {
          p_answer: string
          p_conversation_id: string
          p_input_tokens: number
          p_lease_token: string
          p_model: string
          p_output_tokens: number
          p_question: string
          p_request_id: string
          p_sources: Json
          p_user_id: string
        }
        Returns: Json
      }
      complete_file_upload: {
        Args: { p_file_id: string; p_owner_id: string }
        Returns: Json
      }
      configure_document_processing: {
        Args: { p_api_url: string; p_service_key: string }
        Returns: undefined
      }
      configure_file_cleanup: {
        Args: { p_api_url: string; p_service_key: string }
        Returns: undefined
      }
      create_learning_deck: {
        Args: {
          p_cards: Json
          p_course: string
          p_creation_key: string
          p_source_material: string
          p_sources?: Json
          p_title: string
        }
        Returns: Json
      }
      create_manual_deck: {
        Args: { p_course: string; p_creation_key: string; p_title: string }
        Returns: Json
      }
      expire_file_uploads: { Args: never; Returns: undefined }
      fail_chat_request: {
        Args: {
          p_cancelled?: boolean
          p_conversation_id: string
          p_error_code: string
          p_input_tokens?: number
          p_lease_token: string
          p_output_tokens?: number
          p_request_id: string
          p_stage: string
        }
        Returns: boolean
      }
      file_extension: { Args: { p_mime: string }; Returns: string }
      finish_document_indexing_batch: {
        Args: {
          p_chunks?: Json
          p_document_id: string
          p_embedding_dimensions: number
          p_embedding_model: string
          p_embedding_provider: string
          p_error_code?: string
          p_lease_token: string
          p_total_chunks?: number
        }
        Returns: boolean
      }
      finish_document_processing: {
        Args: {
          p_document_id: string
          p_error_code?: string
          p_lease_token: string
          p_pages?: Json
          p_text?: string
        }
        Returns: boolean
      }
      insert_learning_sources: {
        Args: {
          p_kind: string
          p_material: string
          p_sources: Json
          p_target: string
        }
        Returns: undefined
      }
      learning_deck_progress_counts: {
        Args: { p_material_ids: string[] }
        Returns: {
          due: number
          known: number
          material_id: string
          reviewed: number
        }[]
      }
      normalize_chat_material_ids: {
        Args: { p_material_ids: string[] }
        Returns: string[]
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
      record_flashcard_review: {
        Args: { p_card: string; p_known: boolean }
        Returns: undefined
      }
      rename_learning_deck: {
        Args: { p_material: string; p_title: string }
        Returns: undefined
      }
      reserve_chat_request: {
        Args: {
          p_concurrent_responses: number
          p_conversation_id: string
          p_material_ids?: string[]
          p_model: string
          p_provider: string
          p_question: string
          p_questions_per_minute: number
          p_request_id: string
          p_user_id: string
        }
        Returns: Json
      }
      retry_document_indexing: {
        Args: { p_document_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          extracted_text: string | null
          id: string
          indexing_error: string | null
          indexing_status: string
          material_id: string
          material_type: string | null
          page_count: number | null
          pages: Json | null
          processing_status: string
          started_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "source_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      retry_document_processing: {
        Args: { p_document_id: string }
        Returns: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          extracted_text: string | null
          id: string
          indexing_error: string | null
          indexing_status: string
          material_id: string
          material_type: string | null
          page_count: number | null
          pages: Json | null
          processing_status: string
          started_at: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "source_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_document_suggestion: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      save_chat_history_summary: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_lease_token: string
          p_previous_seq: number
          p_request_id: string
          p_through_seq: number
          p_user_id: string
        }
        Returns: boolean
      }
      save_course_summary: {
        Args: { p_course: string; p_text: string; p_title: string }
        Returns: Json
      }
      save_document_suggestions: {
        Args: { p_items: Json; p_material: string }
        Returns: number
      }
      save_document_summary: {
        Args: {
          p_content: string
          p_source_material: string
          p_sources?: Json
          p_title: string
        }
        Returns: string
      }
      save_learning_quiz: {
        Args: {
          p_course: string
          p_questions: Json
          p_source_material: string
          p_sources?: Json
          p_title: string
        }
        Returns: string
      }
      search_document_chunks:
        | {
            Args: {
              p_course_id: string
              p_embedding: string
              p_embedding_dimensions: number
              p_embedding_model: string
              p_embedding_provider: string
              p_limit?: number
              p_min_similarity?: number
            }
            Returns: {
              chunk_index: number
              content: string
              document_id: string
              id: string
              material_id: string
              metadata: Json
              page_number: number
              similarity: number
            }[]
          }
        | {
            Args: {
              p_course_id: string
              p_embedding: string
              p_embedding_dimensions: number
              p_embedding_model: string
              p_embedding_provider: string
              p_limit: number
              p_material_ids: string[]
              p_min_similarity: number
            }
            Returns: {
              chunk_index: number
              content: string
              document_id: string
              id: string
              material_id: string
              metadata: Json
              page_number: number
              similarity: number
            }[]
          }
        | {
            Args: {
              p_course_id: string
              p_embedding: string
              p_embedding_dimensions: number
              p_embedding_model: string
              p_embedding_provider: string
              p_limit: number
              p_min_similarity: number
              p_query: string
            }
            Returns: {
              chunk_index: number
              content: string
              document_id: string
              id: string
              material_id: string
              metadata: Json
              page_number: number
              similarity: number
            }[]
          }
        | {
            Args: {
              p_course_id: string
              p_embedding: string
              p_embedding_dimensions: number
              p_embedding_model: string
              p_embedding_provider: string
              p_limit: number
              p_material_ids: string[]
              p_min_similarity: number
              p_query: string
            }
            Returns: {
              chunk_index: number
              content: string
              document_id: string
              id: string
              material_id: string
              metadata: Json
              page_number: number
              similarity: number
            }[]
          }
      sync_assessment_calendar: {
        Args: { p_assessment: string; p_enabled: boolean }
        Returns: string
      }
      update_learning_deck: {
        Args: { p_description: string; p_material: string; p_title: string }
        Returns: undefined
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

