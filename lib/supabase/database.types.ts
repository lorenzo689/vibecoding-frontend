// Synchronized from ../backend/types/database.types.ts at backend dev 1bf6374.
// Keep this copy local so the standalone frontend CI does not depend on a sibling checkout.
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
          course_id: string | null
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          kind: string
          owner_id: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind: string
          owner_id: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          kind?: string
          owner_id?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
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
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
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
          id: string
          input_tokens: number | null
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
          id?: string
          input_tokens?: number | null
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
          id?: string
          input_tokens?: number | null
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
      can_upload_learning_file: { Args: { p_path: string }; Returns: boolean }
      chat_exchange: {
        Args: { p_conversation_id: string; p_request_id: string }
        Returns: Json
      }
      chat_exchange_payload: { Args: { p_message_id: string }; Returns: Json }
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
      finish_document_indexing: {
        Args: {
          p_chunks?: Json
          p_document_id: string
          p_error_code?: string
          p_lease_token: string
          p_total_chunks?: number
        }
        Returns: boolean
      }
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
      match_document_chunks: {
        Args: {
          p_course_id: string
          p_embedding: string
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
      reserve_chat_request: {
        Args: {
          p_concurrent_responses: number
          p_conversation_id: string
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
      search_document_chunks: {
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

