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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          timezone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      location_category_overrides: {
        Row: {
          category_id: string
          enabled: boolean
          id: string
          location_id: string
        }
        Insert: {
          category_id: string
          enabled?: boolean
          id?: string
          location_id: string
        }
        Update: {
          category_id?: string
          enabled?: boolean
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_category_overrides_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_category_overrides_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_custom_objects: {
        Row: {
          category_id: string
          custom_label: string
          enabled: boolean
          id: string
          location_id: string
        }
        Insert: {
          category_id: string
          custom_label: string
          enabled?: boolean
          id?: string
          location_id: string
        }
        Update: {
          category_id?: string
          custom_label?: string
          enabled?: boolean
          id?: string
          location_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_custom_objects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_custom_objects_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_element_tags: {
        Row: {
          element_id: string
          tag_id: string
        }
        Insert: {
          element_id: string
          tag_id: string
        }
        Update: {
          element_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_element_tags_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "location_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_element_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "location_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      location_elements: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location_data: Json | null
          name: string
          organization_id: string | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location_data?: Json | null
          name: string
          organization_id?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location_data?: Json | null
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_elements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_elements_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "location_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      location_ensemble_groups: {
        Row: {
          ensemble_id: string
          group_id: string
        }
        Insert: {
          ensemble_id: string
          group_id: string
        }
        Update: {
          ensemble_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_ensemble_groups_ensemble_id_fkey"
            columns: ["ensemble_id"]
            isOneToOne: false
            referencedRelation: "location_ensembles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_ensemble_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "location_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      location_ensemble_tags: {
        Row: {
          ensemble_id: string
          tag_id: string
        }
        Insert: {
          ensemble_id: string
          tag_id: string
        }
        Update: {
          ensemble_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_ensemble_tags_ensemble_id_fkey"
            columns: ["ensemble_id"]
            isOneToOne: false
            referencedRelation: "location_ensembles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_ensemble_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "location_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      location_ensembles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_ensembles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      location_group_elements: {
        Row: {
          element_id: string
          group_id: string
        }
        Insert: {
          element_id: string
          group_id: string
        }
        Update: {
          element_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_group_elements_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "location_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_group_elements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "location_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      location_group_tags: {
        Row: {
          group_id: string
          tag_id: string
        }
        Insert: {
          group_id: string
          tag_id: string
        }
        Update: {
          group_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_group_tags_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "location_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_group_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "location_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      location_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "location_ensembles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_memberships: {
        Row: {
          created_at: string
          element_id: string | null
          ensemble_id: string | null
          group_id: string | null
          id: string
          is_active: boolean
          organization_id: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          ensemble_id?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          organization_id: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          element_id?: string | null
          ensemble_id?: string | null
          group_id?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_memberships_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "location_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_memberships_ensemble_id_fkey"
            columns: ["ensemble_id"]
            isOneToOne: false
            referencedRelation: "location_ensembles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "location_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      location_object_overrides: {
        Row: {
          enabled: boolean
          id: string
          location_id: string
          object_id: string
        }
        Insert: {
          enabled?: boolean
          id?: string
          location_id: string
          object_id: string
        }
        Update: {
          enabled?: boolean
          id?: string
          location_id?: string
          object_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_object_overrides_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_object_overrides_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "tax_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      location_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          can_validate_user_requests: boolean
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          meta: Json | null
          organization_id: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          can_validate_user_requests?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          meta?: Json | null
          organization_id?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          can_validate_user_requests?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          meta?: Json | null
          organization_id?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organizations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
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
          communication_mode: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          communication_mode?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          communication_mode?: string | null
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
          building_id: string | null
          created_at: string
          created_by: string | null
          display_label: string | null
          form_config: Json | null
          id: string
          is_active: boolean
          last_regenerated_at: string | null
          location: Json | null
          location_element_id: string | null
          location_ensemble_id: string | null
          location_group_id: string | null
          organization_id: string | null
          target_slug: string | null
          version: number | null
        }
        Insert: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          display_label?: string | null
          form_config?: Json | null
          id?: string
          is_active?: boolean
          last_regenerated_at?: string | null
          location?: Json | null
          location_element_id?: string | null
          location_ensemble_id?: string | null
          location_group_id?: string | null
          organization_id?: string | null
          target_slug?: string | null
          version?: number | null
        }
        Update: {
          building_id?: string | null
          created_at?: string
          created_by?: string | null
          display_label?: string | null
          form_config?: Json | null
          id?: string
          is_active?: boolean
          last_regenerated_at?: string | null
          location?: Json | null
          location_element_id?: string | null
          location_ensemble_id?: string | null
          location_group_id?: string | null
          organization_id?: string | null
          target_slug?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_qr_codes_location_element"
            columns: ["location_element_id"]
            isOneToOne: false
            referencedRelation: "location_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_location_ensemble_id_fkey"
            columns: ["location_ensemble_id"]
            isOneToOne: false
            referencedRelation: "location_ensembles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_location_group_id_fkey"
            columns: ["location_group_id"]
            isOneToOne: false
            referencedRelation: "location_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      role_requests: {
        Row: {
          created_at: string
          element_id: string | null
          ensemble_id: string | null
          group_id: string | null
          id: string
          message: string | null
          organization_id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          role_id: string
          status: Database["public"]["Enums"]["role_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          element_id?: string | null
          ensemble_id?: string | null
          group_id?: string | null
          id?: string
          message?: string | null
          organization_id: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_id: string
          status?: Database["public"]["Enums"]["role_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          element_id?: string | null
          ensemble_id?: string | null
          group_id?: string | null
          id?: string
          message?: string | null
          organization_id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_id?: string
          status?: Database["public"]["Enums"]["role_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_requests_element_id_fkey"
            columns: ["element_id"]
            isOneToOne: false
            referencedRelation: "location_elements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_ensemble_id_fkey"
            columns: ["ensemble_id"]
            isOneToOne: false
            referencedRelation: "location_ensembles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "location_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_platform_scope: boolean
          label: Json
          parent_id: string | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_platform_scope?: boolean
          label: Json
          parent_id?: string | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_platform_scope?: boolean
          label?: Json
          parent_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
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
      tax_actions: {
        Row: {
          id: string
          key: string
          label: string
        }
        Insert: {
          id?: string
          key: string
          label: string
        }
        Update: {
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      tax_categories: {
        Row: {
          action_id: string
          id: string
          key: string
          label: string
          label_i18n: Json | null
        }
        Insert: {
          action_id: string
          id?: string
          key: string
          label: string
          label_i18n?: Json | null
        }
        Update: {
          action_id?: string
          id?: string
          key?: string
          label?: string
          label_i18n?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_categories_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "tax_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_objects: {
        Row: {
          category_id: string
          id: string
          key: string
          label: string
          label_i18n: Json | null
        }
        Insert: {
          category_id: string
          id?: string
          key: string
          label: string
          label_i18n?: Json | null
        }
        Update: {
          category_id?: string
          id?: string
          key?: string
          label?: string
          label_i18n?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_objects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
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
      ticket_activities: {
        Row: {
          activity_type: string
          actor_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_internal: boolean | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          ticket_id: string
        }
        Insert: {
          activity_type: string
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
        }
        Update: {
          activity_type?: string
          actor_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_activities_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
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
          attachments: Json | null
          building_id: string | null
          category_code: string | null
          category_id: string | null
          closed_at: string | null
          communication_mode: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duplicate_of: string | null
          first_response_at: string | null
          id: string
          language: string | null
          last_interaction_at: string | null
          location: Json | null
          meta: Json | null
          nature_code: string | null
          object_id: string | null
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
          attachments?: Json | null
          building_id?: string | null
          category_code?: string | null
          category_id?: string | null
          closed_at?: string | null
          communication_mode?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duplicate_of?: string | null
          first_response_at?: string | null
          id?: string
          language?: string | null
          last_interaction_at?: string | null
          location?: Json | null
          meta?: Json | null
          nature_code?: string | null
          object_id?: string | null
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
          attachments?: Json | null
          building_id?: string | null
          category_code?: string | null
          category_id?: string | null
          closed_at?: string | null
          communication_mode?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duplicate_of?: string | null
          first_response_at?: string | null
          id?: string
          language?: string | null
          last_interaction_at?: string | null
          location?: Json | null
          meta?: Json | null
          nature_code?: string | null
          object_id?: string | null
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
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tax_categories"
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
          {
            foreignKeyName: "tickets_object_id_fkey"
            columns: ["object_id"]
            isOneToOne: false
            referencedRelation: "tax_objects"
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
      fn_context_covers: {
        Args: {
          membership_block_id: string
          membership_entrance_id: string
          membership_floor_id: string
          membership_unit_id: string
          ticket_location: Json
        }
        Returns: boolean
      }
      fn_get_user_primary_role: {
        Args: { org_id: string; uid: string }
        Returns: {
          location_id: string
          location_name: string
          location_type: string
          role_code: string
          role_name: string
        }[]
      }
      fn_has_org_perm: {
        Args: { org_id: string; perm_code: string; uid: string }
        Returns: boolean
      }
      fn_has_perm: {
        Args: { bld: string; perm_code: string; uid: string }
        Returns: boolean
      }
      regenerate_qr_code: { Args: { qr_id: string }; Returns: string }
    }
    Enums: {
      initiality_enum: "initial" | "relance"
      role_request_status: "pending" | "approved" | "rejected"
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
      initiality_enum: ["initial", "relance"],
      role_request_status: ["pending", "approved", "rejected"],
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
