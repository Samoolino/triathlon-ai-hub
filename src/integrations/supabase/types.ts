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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_invocations: {
        Row: {
          completion_tokens: number | null
          created_at: string
          id: string
          meta: Json
          model: string
          prompt_tokens: number | null
          provider: string
          run_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string
          id?: string
          meta?: Json
          model: string
          prompt_tokens?: number | null
          provider: string
          run_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string
          id?: string
          meta?: Json
          model?: string
          prompt_tokens?: number | null
          provider?: string
          run_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      agent_requests: {
        Row: {
          assignee_email: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          assignee_email?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          assignee_email?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          invited_by: string | null
          note: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          invited_by?: string | null
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          invited_by?: string | null
          note?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          actor: string
          actor_type: string
          id: number
          payload: Json | null
          subject: string | null
          ts: string
        }
        Insert: {
          action: string
          actor: string
          actor_type?: string
          id?: number
          payload?: Json | null
          subject?: string | null
          ts?: string
        }
        Update: {
          action?: string
          actor?: string
          actor_type?: string
          id?: number
          payload?: Json | null
          subject?: string | null
          ts?: string
        }
        Relationships: []
      }
      cex_accounts: {
        Row: {
          created_at: string
          daily_cap_usdc: number
          exchange: string
          hard_stop_pct: number
          id: string
          label: string | null
          spread_threshold_bps: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_cap_usdc?: number
          exchange: string
          hard_stop_pct?: number
          id?: string
          label?: string | null
          spread_threshold_bps?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_cap_usdc?: number
          exchange?: string
          hard_stop_pct?: number
          id?: string
          label?: string | null
          spread_threshold_bps?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      events_log: {
        Row: {
          created_at: string
          event_code: string | null
          id: string
          kind: string
          payload: Json
        }
        Insert: {
          created_at?: string
          event_code?: string | null
          id?: string
          kind: string
          payload?: Json
        }
        Update: {
          created_at?: string
          event_code?: string | null
          id?: string
          kind?: string
          payload?: Json
        }
        Relationships: []
      }
      gri_disclosures: {
        Row: {
          citations: string[]
          created_at: string
          disclosure_type: string
          event_code: string
          gri_code: string
          id: string
          narrative: string | null
          status: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          citations?: string[]
          created_at?: string
          disclosure_type?: string
          event_code: string
          gri_code: string
          id?: string
          narrative?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          citations?: string[]
          created_at?: string
          disclosure_type?: string
          event_code?: string
          gri_code?: string
          id?: string
          narrative?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      gri_external_facts: {
        Row: {
          fetched_at: string
          key: string
          payload: Json
          source: string
        }
        Insert: {
          fetched_at?: string
          key: string
          payload: Json
          source: string
        }
        Update: {
          fetched_at?: string
          key?: string
          payload?: Json
          source?: string
        }
        Relationships: []
      }
      media_jobs: {
        Row: {
          aspect_ratio: string | null
          created_at: string
          created_by: string | null
          error: string | null
          id: string
          kind: string
          prompt: string
          result_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          kind: string
          prompt: string
          result_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string
          created_by?: string | null
          error?: string | null
          id?: string
          kind?: string
          prompt?: string
          result_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      narrative_entries: {
        Row: {
          body: string | null
          citations: Json
          created_at: string
          event_code: string | null
          headline: string
          id: string
          kind: string
          meta: Json
          source: string
        }
        Insert: {
          body?: string | null
          citations?: Json
          created_at?: string
          event_code?: string | null
          headline: string
          id?: string
          kind: string
          meta?: Json
          source: string
        }
        Update: {
          body?: string | null
          citations?: Json
          created_at?: string
          event_code?: string | null
          headline?: string
          id?: string
          kind?: string
          meta?: Json
          source?: string
        }
        Relationships: []
      }
      operational_figures: {
        Row: {
          captured_at: string | null
          citation: Json | null
          event_code: string | null
          id: string
          key: string
          requested_at: string
          source_agent: string | null
          status: string
          unit: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          captured_at?: string | null
          citation?: Json | null
          event_code?: string | null
          id?: string
          key: string
          requested_at?: string
          source_agent?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          captured_at?: string | null
          citation?: Json | null
          event_code?: string | null
          id?: string
          key?: string
          requested_at?: string
          source_agent?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      orderbook_snapshots: {
        Row: {
          ask: number
          bid: number
          exchange: string
          id: number
          symbol: string
          ts: string
        }
        Insert: {
          ask: number
          bid: number
          exchange: string
          id?: number
          symbol: string
          ts?: string
        }
        Update: {
          ask?: number
          bid?: number
          exchange?: string
          id?: number
          symbol?: string
          ts?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          connection_id: string | null
          created_at: string
          event_code: string | null
          handle: string | null
          id: string
          platform: string
          requested_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          event_code?: string | null
          handle?: string | null
          id?: string
          platform: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          event_code?: string | null
          handle?: string | null
          id?: string
          platform?: string
          requested_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          account_id: string | null
          approval_state: string
          caption: string | null
          created_at: string
          created_by: string | null
          event_code: string
          generated_media_url: string | null
          id: string
          kind: string
          prompt: string | null
          remote_url: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          approval_state?: string
          caption?: string | null
          created_at?: string
          created_by?: string | null
          event_code: string
          generated_media_url?: string | null
          id?: string
          kind?: string
          prompt?: string | null
          remote_url?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          approval_state?: string
          caption?: string | null
          created_at?: string
          created_by?: string | null
          event_code?: string
          generated_media_url?: string | null
          id?: string
          kind?: string
          prompt?: string | null
          remote_url?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_trade_budget: {
        Row: {
          task_class: string
          updated_at: string
          usdc_per_completion: number
        }
        Insert: {
          task_class: string
          updated_at?: string
          usdc_per_completion?: number
        }
        Update: {
          task_class?: string
          updated_at?: string
          usdc_per_completion?: number
        }
        Relationships: []
      }
      trade_fills: {
        Row: {
          exchange: string
          fee_usdc: number
          id: string
          intent_id: string | null
          price: number
          qty: number
          remote_order_id: string | null
          side: string
          symbol: string
          ts: string
        }
        Insert: {
          exchange: string
          fee_usdc?: number
          id?: string
          intent_id?: string | null
          price: number
          qty: number
          remote_order_id?: string | null
          side: string
          symbol: string
          ts?: string
        }
        Update: {
          exchange?: string
          fee_usdc?: number
          id?: string
          intent_id?: string | null
          price?: number
          qty?: number
          remote_order_id?: string | null
          side?: string
          symbol?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_fills_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "trade_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_intents: {
        Row: {
          allocated_usdc: number
          buy_exchange: string | null
          created_at: string
          expected_spread_bps: number | null
          id: string
          note: string | null
          sell_exchange: string | null
          source_event_code: string | null
          source_task_id: string | null
          status: string
          symbol: string
          updated_at: string
        }
        Insert: {
          allocated_usdc: number
          buy_exchange?: string | null
          created_at?: string
          expected_spread_bps?: number | null
          id?: string
          note?: string | null
          sell_exchange?: string | null
          source_event_code?: string | null
          source_task_id?: string | null
          status?: string
          symbol: string
          updated_at?: string
        }
        Update: {
          allocated_usdc?: number
          buy_exchange?: string | null
          created_at?: string
          expected_spread_bps?: number | null
          id?: string
          note?: string | null
          sell_exchange?: string | null
          source_event_code?: string | null
          source_task_id?: string | null
          status?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_pnl_daily: {
        Row: {
          allocated_usdc: number
          date: string
          realised_usdc: number
          status: string
          unrealised_usdc: number
          updated_at: string
        }
        Insert: {
          allocated_usdc?: number
          date?: string
          realised_usdc?: number
          status?: string
          unrealised_usdc?: number
          updated_at?: string
        }
        Update: {
          allocated_usdc?: number
          date?: string
          realised_usdc?: number
          status?: string
          unrealised_usdc?: number
          updated_at?: string
        }
        Relationships: []
      }
      trade_positions: {
        Row: {
          current_floor: number
          entry_fees_usdc: number
          entry_price: number
          exchange: string
          id: string
          qty: number
          symbol: string
          updated_at: string
        }
        Insert: {
          current_floor?: number
          entry_fees_usdc?: number
          entry_price?: number
          exchange: string
          id?: string
          qty?: number
          symbol: string
          updated_at?: string
        }
        Update: {
          current_floor?: number
          entry_fees_usdc?: number
          entry_price?: number
          exchange?: string
          id?: string
          qty?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      trade_universe: {
        Row: {
          base: string
          created_at: string
          enabled: boolean
          esg_tag: string | null
          exchanges: string[]
          id: string
          quote: string
          symbol: string
        }
        Insert: {
          base: string
          created_at?: string
          enabled?: boolean
          esg_tag?: string | null
          exchanges?: string[]
          id?: string
          quote?: string
          symbol: string
        }
        Update: {
          base?: string
          created_at?: string
          enabled?: boolean
          esg_tag?: string | null
          exchanges?: string[]
          id?: string
          quote?: string
          symbol?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      x402_settlements: {
        Row: {
          approved_by: string | null
          created_at: string
          endpoint: string
          id: string
          meta: Json
          price_usdc: number
          status: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          endpoint: string
          id?: string
          meta?: Json
          price_usdc: number
          status: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          meta?: Json
          price_usdc?: number
          status?: string
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
      app_role: "admin" | "editor" | "actor" | "viewer"
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
      app_role: ["admin", "editor", "actor", "viewer"],
    },
  },
} as const
