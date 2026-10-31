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
  public: {
    Tables: {
      license_activations: {
        Row: {
          first_seen: string
          key_hash: string
          kind: string
          last_seen: string
          value: string
        }
        Insert: {
          first_seen?: string
          key_hash: string
          kind: string
          last_seen?: string
          value: string
        }
        Update: {
          first_seen?: string
          key_hash?: string
          kind?: string
          last_seen?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_activations_key_hash_fkey"
            columns: ["key_hash"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["key_hash"]
          },
        ]
      }
      license_failures: {
        Row: {
          at: string
          id: number
          ip: string
        }
        Insert: {
          at?: string
          id?: never
          ip: string
        }
        Update: {
          at?: string
          id?: never
          ip?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          created_at: string
          expires_at: string | null
          key_hash: string
          label: string | null
          last_seen_at: string | null
          max_accounts: number
          max_devices: number
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          key_hash: string
          label?: string | null
          last_seen_at?: string | null
          max_accounts?: number
          max_devices?: number
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          key_hash?: string
          label?: string | null
          last_seen_at?: string | null
          max_accounts?: number
          max_devices?: number
          status?: string
        }
        Relationships: []
      }
      web_license_secrets: {
        Row: {
          created_at: string
          license_key: string
          order_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          license_key: string
          order_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          license_key?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_license_secrets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "web_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      web_orders: {
        Row: {
          amount_satang: number
          created_at: string
          currency: string
          duration_days: number
          id: string
          license_key_hash: string | null
          order_number: string
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          plan_name: string
          plan_slug: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_satang: number
          created_at?: string
          currency?: string
          duration_days: number
          id?: string
          license_key_hash?: string | null
          order_number: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          plan_name: string
          plan_slug: string
          stripe_checkout_session_id: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_satang?: number
          created_at?: string
          currency?: string
          duration_days?: number
          id?: string
          license_key_hash?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          plan_name?: string
          plan_slug?: string
          stripe_checkout_session_id?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_orders_license_key_hash_fkey"
            columns: ["license_key_hash"]
            isOneToOne: true
            referencedRelation: "licenses"
            referencedColumns: ["key_hash"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_license: {
        Args: {
          p_account: string
          p_device: string
          p_ip: string
          p_key_hash: string
        }
        Returns: Json
      }
      create_license: {
        Args: {
          p_days?: number
          p_label: string
          p_max_accounts?: number
          p_max_devices?: number
        }
        Returns: {
          expires_at: string
          license_key: string
        }[]
      }
      extend_license: {
        Args: { p_days: number; p_key: string }
        Returns: string
      }
      issue_web_order_license: {
        Args: {
          p_payment_intent?: string
          p_payment_method?: string
          p_session_id: string
        }
        Returns: Json
      }
      license_hash: { Args: { p_key: string }; Returns: string }
      refund_web_order_by_payment_intent: {
        Args: { p_payment_intent: string }
        Returns: Json
      }
      reset_license: { Args: { p_key: string }; Returns: number }
      revoke_license: { Args: { p_key: string }; Returns: number }
      update_web_order_status: {
        Args: {
          p_payment_intent?: string
          p_payment_method?: string
          p_session_id: string
          p_status: string
        }
        Returns: boolean
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
  public: {
    Enums: {},
  },
} as const
