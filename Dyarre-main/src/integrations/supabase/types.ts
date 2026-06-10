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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bot_sessions: {
        Row: {
          chat_id: string
          created_at: string
          draft: Json
          id: string
          image_paths: string[]
          last_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          draft?: Json
          id?: string
          image_paths?: string[]
          last_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          draft?: Json
          id?: string
          image_paths?: string[]
          last_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          property_id: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          property_id?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          property_id?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      furnishing_options: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          city: string
          created_at: string
          id: string
          zone: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          zone: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          zone?: string
        }
        Relationships: []
      }
      media_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          bucket: string | null
          created_at: string
          details: Json
          id: string
          image_id: string | null
          path: string | null
          property_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          bucket?: string | null
          created_at?: string
          details?: Json
          id?: string
          image_id?: string | null
          path?: string | null
          property_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          bucket?: string | null
          created_at?: string
          details?: Json
          id?: string
          image_id?: string | null
          path?: string | null
          property_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          country: string | null
          created_at: string
          id: string
          ip_address: string | null
          page_path: string
          referrer: string | null
          session_duration: number | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          page_path: string
          referrer?: string | null
          session_duration?: number | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          page_path?: string
          referrer?: string | null
          session_duration?: number | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          bathrooms: number
          bedrooms: number
          city: string
          completion_status: string
          created_at: string
          created_by: string | null
          description: string | null
          developer: string | null
          display_id: number
          expiry_date: string | null
          features: string[] | null
          furnishing: string
          google_map_url: string | null
          id: string
          is_visible: boolean
          price: number
          reference_number: string | null
          size: number
          status: string
          title: string
          type: string
          updated_at: string
          whatsapp_number: string | null
          zone: string
        }
        Insert: {
          bathrooms?: number
          bedrooms?: number
          city: string
          completion_status?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          developer?: string | null
          display_id?: number
          expiry_date?: string | null
          features?: string[] | null
          furnishing?: string
          google_map_url?: string | null
          id?: string
          is_visible?: boolean
          price?: number
          reference_number?: string | null
          size?: number
          status?: string
          title: string
          type: string
          updated_at?: string
          whatsapp_number?: string | null
          zone: string
        }
        Update: {
          bathrooms?: number
          bedrooms?: number
          city?: string
          completion_status?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          developer?: string | null
          display_id?: number
          expiry_date?: string | null
          features?: string[] | null
          furnishing?: string
          google_map_url?: string | null
          id?: string
          is_visible?: boolean
          price?: number
          reference_number?: string | null
          size?: number
          status?: string
          title?: string
          type?: string
          updated_at?: string
          whatsapp_number?: string | null
          zone?: string
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string
          original_path: string | null
          property_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url: string
          original_path?: string | null
          property_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string
          original_path?: string | null
          property_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_statuses: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      property_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watermark_presets: {
        Row: {
          anchor: string
          color: string
          content_type: string
          created_at: string
          font_weight: string
          id: string
          is_enabled: boolean
          logo_url: string | null
          name: string
          offset_x: number
          offset_y: number
          opacity: number
          percent_x: number
          percent_y: number
          position_mode: string
          rotation: number
          sequence: number
          size_pct: number
          stroke_color: string | null
          stroke_width: number
          text_value: string | null
          updated_at: string
        }
        Insert: {
          anchor?: string
          color?: string
          content_type: string
          created_at?: string
          font_weight?: string
          id?: string
          is_enabled?: boolean
          logo_url?: string | null
          name: string
          offset_x?: number
          offset_y?: number
          opacity?: number
          percent_x?: number
          percent_y?: number
          position_mode?: string
          rotation?: number
          sequence?: number
          size_pct?: number
          stroke_color?: string | null
          stroke_width?: number
          text_value?: string | null
          updated_at?: string
        }
        Update: {
          anchor?: string
          color?: string
          content_type?: string
          created_at?: string
          font_weight?: string
          id?: string
          is_enabled?: boolean
          logo_url?: string | null
          name?: string
          offset_x?: number
          offset_y?: number
          opacity?: number
          percent_x?: number
          percent_y?: number
          position_mode?: string
          rotation?: number
          sequence?: number
          size_pct?: number
          stroke_color?: string | null
          stroke_width?: number
          text_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
