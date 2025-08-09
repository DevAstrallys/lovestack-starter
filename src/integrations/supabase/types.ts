export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          data: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          data?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          data?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      building_blocks: {
        Row: {
          building_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          building_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          building_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_blocks_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      building_modules: {
        Row: {
          building_id: string
          config: Json | null
          is_enabled: boolean
          module_id: string
        }
        Insert: {
          building_id: string
          config?: Json | null
          is_enabled?: boolean
          module_id: string
        }
        Update: {
          building_id?: string
          config?: Json | null
          is_enabled?: boolean
          module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "building_modules_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "building_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          timezone: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          timezone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          timezone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      channels_outbox: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          error: string | null
          id: string
          payload: Json | null
          sent_at: string | null
          status: string
          subject: string | null
          to_ref: Json
        }
        Insert: {
          body?: string | null
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_ref: Json
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          to_ref?: Json
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          rating: number | null
          siret: string | null
          tags: string[] | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          rating?: number | null
          siret?: string | null
          tags?: string[] | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          rating?: number | null
          siret?: string | null
          tags?: string[] | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          building_id: string
          company_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          sla_json: Json | null
          start_date: string
          title: string
        }
        Insert: {
          building_id: string
          company_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          sla_json?: Json | null
          start_date: string
          title: string
        }
        Update: {
          building_id?: string
          company_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          sla_json?: Json | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      document_links: {
        Row: {
          document_id: string
          ticket_id: string
        }
        Insert: {
          document_id: string
          ticket_id: string
        }
        Update: {
          document_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_links_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          building_id: string | null
          created_at: string
          created_by: string | null
          id: string
          storage_path: string
          tags: string[] | null
          title: string
          visibility: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          storage_path: string
          tags?: string[] | null
          title: string
          visibility?: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          storage_path?: string
          tags?: string[] | null
          title?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entrances: {
        Row: {
          block_id: string | null
          building_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          block_id?: string | null
          building_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          block_id?: string | null
          building_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entrances_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "building_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entrances_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          building_id: string
          created_at: string
          id: string
          location: Json | null
          ref: string | null
          type_code: string | null
        }
        Insert: {
          building_id: string
          created_at?: string
          id?: string
          location?: Json | null
          ref?: string | null
          type_code?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string
          id?: string
          location?: Json | null
          ref?: string | null
          type_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_contracts: {
        Row: {
          contract_id: string
          equipment_id: string
        }
        Insert: {
          contract_id: string
          equipment_id: string
        }
        Update: {
          contract_id?: string
          equipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_contracts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_contracts_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          building_id: string
          created_at: string
          entrance_id: string | null
          id: string
          level: number
          updated_at: string
        }
        Insert: {
          building_id: string
          created_at?: string
          entrance_id?: string | null
          id?: string
          level: number
          updated_at?: string
        }
        Update: {
          building_id?: string
          created_at?: string
          entrance_id?: string | null
          id?: string
          level?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floors_entrance_id_fkey"
            columns: ["entrance_id"]
            isOneToOne: false
            referencedRelation: "entrances"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          block_id: string | null
          building_id: string
          company_id: string | null
          created_at: string
          entrance_id: string | null
          floor_id: string | null
          id: string
          is_active: boolean
          meta: Json | null
          role_id: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          block_id?: string | null
          building_id: string
          company_id?: string | null
          created_at?: string
          entrance_id?: string | null
          floor_id?: string | null
          id?: string
          is_active?: boolean
          meta?: Json | null
          role_id: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          block_id?: string | null
          building_id?: string
          company_id?: string | null
          created_at?: string
          entrance_id?: string | null
          floor_id?: string | null
          id?: string
          is_active?: boolean
          meta?: Json | null
          role_id?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "building_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_entrance_id_fkey"
            columns: ["entrance_id"]
            isOneToOne: false
            referencedRelation: "entrances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          code: string
          created_at: string
          id: string
          label: Json
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          label: Json
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          label?: Json
        }
        Relationships: []
      }
      notifications_prefs: {
        Row: {
          email: boolean | null
          locale: string | null
          push: boolean | null
          sms: boolean | null
          user_id: string
        }
        Insert: {
          email?: boolean | null
          locale?: string | null
          push?: boolean | null
          sms?: boolean | null
          user_id: string
        }
        Update: {
          email?: boolean | null
          locale?: string | null
          push?: boolean | null
          sms?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          id: string
          label: Json
        }
        Insert: {
          code: string
          id?: string
          label: Json
        }
        Update: {
          code?: string
          id?: string
          label?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      qr_codes: {
        Row: {
          building_id: string
          created_at: string
          display_label: string | null
          id: string
          is_active: boolean
          location: Json | null
          target_slug: string | null
        }
        Insert: {
          building_id: string
          created_at?: string
          display_label?: string | null
          id?: string
          is_active?: boolean
          location?: Json | null
          target_slug?: string | null
        }
        Update: {
          building_id?: string
          created_at?: string
          display_label?: string | null
          id?: string
          is_active?: boolean
          location?: Json | null
          target_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          building_id: string
          config: Json
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          building_id: string
          config: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          building_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          id: string
          is_platform_scope: boolean
          label: Json
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_platform_scope?: boolean
          label: Json
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_platform_scope?: boolean
          label?: Json
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          id: string
          is_active: boolean
          last_run_at: string | null
          report_id: string
          schedule: string
          target: Json
        }
        Insert: {
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          report_id: string
          schedule: string
          target: Json
        }
        Update: {
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          report_id?: string
          schedule?: string
          target?: Json
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          id: string
          kind: string
          label: Json
          options: Json | null
          position: number
          survey_id: string
        }
        Insert: {
          id?: string
          kind: string
          label: Json
          options?: Json | null
          position?: number
          survey_id: string
        }
        Update: {
          id?: string
          kind?: string
          label?: Json
          options?: Json | null
          position?: number
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          answers: Json
          created_at: string
          id: string
          survey_id: string
          user_id: string | null
        }
        Insert: {
          answers: Json
          created_at?: string
          id?: string
          survey_id: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          survey_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          building_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          target: Json | null
          title: string
        }
        Insert: {
          building_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          target?: Json | null
          title: string
        }
        Update: {
          building_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          target?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomies: {
        Row: {
          code: string
          id: string
          is_active: boolean
          kind: string
          label: Json
        }
        Insert: {
          code: string
          id?: string
          is_active?: boolean
          kind: string
          label: Json
        }
        Update: {
          code?: string
          id?: string
          is_active?: boolean
          kind?: string
          label?: Json
        }
        Relationships: []
      }
      ticket_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          filename: string | null
          id: string
          storage_path: string
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          filename?: string | null
          id?: string
          storage_path: string
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          filename?: string | null
          id?: string
          storage_path?: string
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_events: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json | null
          id: string
          kind: string
          ticket_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          kind: string
          ticket_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          kind?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_followers: {
        Row: {
          ticket_id: string
          user_id: string
        }
        Insert: {
          ticket_id: string
          user_id: string
        }
        Update: {
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_followers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_followers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          building_id: string
          category_code: string | null
          closed_at: string | null
          communication_mode: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duplicate_of: string | null
          first_response_at: string | null
          id: string
          location: Json | null
          meta: Json | null
          nature_code: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          sla_due_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          building_id: string
          category_code?: string | null
          closed_at?: string | null
          communication_mode?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duplicate_of?: string | null
          first_response_at?: string | null
          id?: string
          location?: Json | null
          meta?: Json | null
          nature_code?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          sla_due_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          building_id?: string
          category_code?: string | null
          closed_at?: string | null
          communication_mode?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duplicate_of?: string | null
          first_response_at?: string | null
          id?: string
          location?: Json | null
          meta?: Json | null
          nature_code?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          sla_due_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area_m2: number | null
          building_id: string
          created_at: string
          entrance_id: string | null
          floor_id: string | null
          id: string
          is_private: boolean | null
          lot_number: string | null
          ref: string | null
          updated_at: string
        }
        Insert: {
          area_m2?: number | null
          building_id: string
          created_at?: string
          entrance_id?: string | null
          floor_id?: string | null
          id?: string
          is_private?: boolean | null
          lot_number?: string | null
          ref?: string | null
          updated_at?: string
        }
        Update: {
          area_m2?: number | null
          building_id?: string
          created_at?: string
          entrance_id?: string | null
          floor_id?: string | null
          id?: string
          is_private?: boolean | null
          lot_number?: string | null
          ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_entrance_id_fkey"
            columns: ["entrance_id"]
            isOneToOne: false
            referencedRelation: "entrances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          building_id: string | null
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          secret: string | null
          url: string
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          events: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          url: string
        }
        Update: {
          building_id?: string | null
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fn_has_perm: {
        Args: { uid: string; bld: string; perm_code: string }
        Returns: boolean
      }
    }
    Enums: {
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "waiting"
        | "resolved"
        | "closed"
        | "canceled"
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
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "waiting",
        "resolved",
        "closed",
        "canceled",
      ],
    },
  },
} as const
