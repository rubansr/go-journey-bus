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
      bookings: {
        Row: {
          boarding_point: string | null
          cancelled_at: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          dropping_point: string | null
          id: string
          passengers: Json
          payment_method: string
          pnr: string
          refund_amount: number
          refund_status: string
          seats: string[]
          status: string
          total_amount: number
          trip_id: string
          user_id: string
          wallet_amount: number
        }
        Insert: {
          boarding_point?: string | null
          cancelled_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          dropping_point?: string | null
          id?: string
          passengers?: Json
          payment_method?: string
          pnr?: string
          refund_amount?: number
          refund_status?: string
          seats: string[]
          status?: string
          total_amount: number
          trip_id: string
          user_id?: string
          wallet_amount?: number
        }
        Update: {
          boarding_point?: string | null
          cancelled_at?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          dropping_point?: string | null
          id?: string
          passengers?: Json
          payment_method?: string
          pnr?: string
          refund_amount?: number
          refund_status?: string
          seats?: string[]
          status?: string
          total_amount?: number
          trip_id?: string
          user_id?: string
          wallet_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      location_points: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          landmark: string
          lat: number | null
          lng: number | null
          location_id: string
          name_en: string
          name_ta: string
          point_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          landmark?: string
          lat?: number | null
          lng?: number | null
          location_id: string
          name_en: string
          name_ta?: string
          point_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          landmark?: string
          lat?: number | null
          lng?: number | null
          location_id?: string
          name_en?: string
          name_ta?: string
          point_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_points_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          aliases: string[]
          created_at: string
          district: string
          id: string
          is_active: boolean
          kind: string
          lat: number | null
          lng: number | null
          name_en: string
          name_ta: string
          state: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          district?: string
          id?: string
          is_active?: boolean
          kind?: string
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ta?: string
          state?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          district?: string
          id?: string
          is_active?: boolean
          kind?: string
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ta?: string
          state?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          created_at: string
          id: string
          name: string
          rating: number
          total_trips: number
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rating?: number
          total_trips?: number
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rating?: number
          total_trips?: number
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          language: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          phone?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          ac: boolean
          amenities: string[]
          arrive_at: string
          berth_type: string
          boarding_points: string[]
          booked_seats: string[]
          bus_number: string
          bus_type: string
          cancellation_policy: string
          created_at: string
          delay_mins: number
          demand_level: string
          depart_at: string
          dropping_points: string[]
          fare: number
          from_city: string
          from_location_id: string | null
          id: string
          live_tracking: boolean
          operator_id: string
          rating: number
          to_city: string
          to_location_id: string | null
          total_seats: number
          tracking_note: string | null
          trip_status: string
          updated_at: string
          women_safe: boolean
        }
        Insert: {
          ac?: boolean
          amenities?: string[]
          arrive_at: string
          berth_type?: string
          boarding_points?: string[]
          booked_seats?: string[]
          bus_number?: string
          bus_type: string
          cancellation_policy?: string
          created_at?: string
          delay_mins?: number
          demand_level?: string
          depart_at: string
          dropping_points?: string[]
          fare: number
          from_city: string
          from_location_id?: string | null
          id?: string
          live_tracking?: boolean
          operator_id: string
          rating?: number
          to_city: string
          to_location_id?: string | null
          total_seats?: number
          tracking_note?: string | null
          trip_status?: string
          updated_at?: string
          women_safe?: boolean
        }
        Update: {
          ac?: boolean
          amenities?: string[]
          arrive_at?: string
          berth_type?: string
          boarding_points?: string[]
          booked_seats?: string[]
          bus_number?: string
          bus_type?: string
          cancellation_policy?: string
          created_at?: string
          delay_mins?: number
          demand_level?: string
          depart_at?: string
          dropping_points?: string[]
          fare?: number
          from_city?: string
          from_location_id?: string | null
          id?: string
          live_tracking?: boolean
          operator_id?: string
          rating?: number
          to_city?: string
          to_location_id?: string | null
          total_seats?: number
          tracking_note?: string | null
          trip_status?: string
          updated_at?: string
          women_safe?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "trips_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_trip: {
        Args: {
          p_boarding: string
          p_contact_email: string
          p_contact_phone: string
          p_dropping: string
          p_passengers: Json
          p_payment_method: string
          p_seats: string[]
          p_trip_id: string
          p_use_wallet?: boolean
        }
        Returns: {
          boarding_point: string | null
          cancelled_at: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          dropping_point: string | null
          id: string
          passengers: Json
          payment_method: string
          pnr: string
          refund_amount: number
          refund_status: string
          seats: string[]
          status: string
          total_amount: number
          trip_id: string
          user_id: string
          wallet_amount: number
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bootstrap_admin: { Args: never; Returns: boolean }
      cancel_booking: {
        Args: { p_booking_id: string }
        Returns: {
          boarding_point: string | null
          cancelled_at: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          dropping_point: string | null
          id: string
          passengers: Json
          payment_method: string
          pnr: string
          refund_amount: number
          refund_status: string
          seats: string[]
          status: string
          total_amount: number
          trip_id: string
          user_id: string
          wallet_amount: number
        }
        SetofOptions: {
          from: "*"
          to: "bookings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      topup_wallet: {
        Args: { p_amount: number; p_method?: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "user"
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
    Enums: {
      app_role: ["admin", "operator", "user"],
    },
  },
} as const
