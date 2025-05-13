export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      bamboo_training_types: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cached_employees: {
        Row: {
          avatar: string | null
          cached_at: string
          department: string | null
          display_name: string | null
          division: string | null
          email: string | null
          first_name: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          last_name: string | null
          name: string
          position: string | null
          work_email: string | null
        }
        Insert: {
          avatar?: string | null
          cached_at?: string
          department?: string | null
          display_name?: string | null
          division?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id: string
          job_title?: string | null
          last_name?: string | null
          name: string
          position?: string | null
          work_email?: string | null
        }
        Update: {
          avatar?: string | null
          cached_at?: string
          department?: string | null
          display_name?: string | null
          division?: string | null
          email?: string | null
          first_name?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          name?: string
          position?: string | null
          work_email?: string | null
        }
        Relationships: []
      }
      cached_training_completions: {
        Row: {
          cached_at: string
          certificate_url: string | null
          completed: string | null
          employee_id: string
          expiration_date: string | null
          id: string | null
          instructor: string | null
          notes: string | null
          score: number | null
          status: string | null
          type: string
        }
        Insert: {
          cached_at?: string
          certificate_url?: string | null
          completed?: string | null
          employee_id: string
          expiration_date?: string | null
          id?: string | null
          instructor?: string | null
          notes?: string | null
          score?: number | null
          status?: string | null
          type: string
        }
        Update: {
          cached_at?: string
          certificate_url?: string | null
          completed?: string | null
          employee_id?: string
          expiration_date?: string | null
          id?: string | null
          instructor?: string | null
          notes?: string | null
          score?: number | null
          status?: string | null
          type?: string
        }
        Relationships: []
      }
      cached_trainings: {
        Row: {
          cached_at: string
          category: string | null
          description: string | null
          duration_hours: number | null
          id: string
          required_for: string[] | null
          title: string
          type: string | null
        }
        Insert: {
          cached_at?: string
          category?: string | null
          description?: string | null
          duration_hours?: number | null
          id: string
          required_for?: string[] | null
          title: string
          type?: string | null
        }
        Update: {
          cached_at?: string
          category?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          required_for?: string[] | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      employee_mappings: {
        Row: {
          avatar: string | null
          bamboo_employee_id: string
          created_at: string | null
          department: string | null
          display_name: string | null
          division: string | null
          email: string
          first_name: string | null
          hire_date: string | null
          id: string
          job_title: string | null
          last_name: string | null
          last_sync: string | null
          name: string | null
          position: string | null
          status: string | null
          updated_at: string | null
          work_email: string | null
        }
        Insert: {
          avatar?: string | null
          bamboo_employee_id: string
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          division?: string | null
          email: string
          first_name?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          last_sync?: string | null
          name?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          work_email?: string | null
        }
        Update: {
          avatar?: string | null
          bamboo_employee_id?: string
          created_at?: string | null
          department?: string | null
          display_name?: string | null
          division?: string | null
          email?: string
          first_name?: string | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          last_name?: string | null
          last_sync?: string | null
          name?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          work_email?: string | null
        }
        Relationships: []
      }
      employee_training_completions: {
        Row: {
          completion_date: string
          created_at: string
          employee_id: number
          id: string
          instructor: string | null
          notes: string | null
          training_id: number
          updated_at: string
        }
        Insert: {
          completion_date: string
          created_at?: string
          employee_id: number
          id?: string
          instructor?: string | null
          notes?: string | null
          training_id: number
          updated_at?: string
        }
        Update: {
          completion_date?: string
          created_at?: string
          employee_id?: number
          id?: string
          instructor?: string | null
          notes?: string | null
          training_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          avfrd_requirements: string[]
          county_requirements: string[]
          created_at: string
          department: string | null
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          avfrd_requirements?: string[]
          county_requirements?: string[]
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          avfrd_requirements?: string[]
          county_requirements?: string[]
          created_at?: string
          department?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          details: Json | null
          error: string | null
          id: string
          last_sync: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          details?: Json | null
          error?: string | null
          id: string
          last_sync?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          details?: Json | null
          error?: string | null
          id?: string
          last_sync?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_selections: {
        Row: {
          created_at: string
          id: string
          is_selected: boolean
          training_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_selected?: boolean
          training_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_selected?: boolean
          training_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      welcome_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      training_completions_stats: {
        Row: {
          earliest_completion: string | null
          employees_with_completions: number | null
          latest_completion: string | null
          latest_record_created: string | null
          latest_record_updated: string | null
          total_completions: number | null
          unique_trainings: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_admin_access: {
        Args: { admin_email: string }
        Returns: boolean
      }
      check_edge_function_version: {
        Args: { function_name: string }
        Returns: Json
      }
      diagnostic_training_completions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_bamboohr_trainings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      sync_employee_mappings_job: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_auth_keys_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      trigger_bamboohr_sync: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      trigger_training_completions_sync: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_welcome_messages: {
        Args: { messages: string[] }
        Returns: {
          created_at: string
          id: string
          message: string
          updated_at: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
