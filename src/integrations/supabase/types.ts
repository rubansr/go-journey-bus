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
      bus_locations: {
        Row: {
          accuracy_m: number | null
          heading: number
          id: string
          lat: number
          lng: number
          recorded_at: string
          recorded_by: string | null
          source: string
          speed_kmph: number
          trip_id: string
        }
        Insert: {
          accuracy_m?: number | null
          heading?: number
          id?: string
          lat: number
          lng: number
          recorded_at?: string
          recorded_by?: string | null
          source?: string
          speed_kmph?: number
          trip_id: string
        }
        Update: {
          accuracy_m?: number | null
          heading?: number
          id?: string
          lat?: number
          lng?: number
          recorded_at?: string
          recorded_by?: string | null
          source?: string
          speed_kmph?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bus_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          name: string
          phone: string
          relation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone: string
          relation?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone?: string
          relation?: string
          user_id?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          display_name: string
          family_id: string
          id: string
          invited_email: string | null
          role: string
          share_location: boolean
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string
          family_id: string
          id?: string
          invited_email?: string | null
          role?: string
          share_location?: boolean
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          family_id?: string
          id?: string
          invited_email?: string | null
          role?: string
          share_location?: boolean
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
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
      notifications: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      operators: {
        Row: {
          created_at: string
          id: string
          name: string
          rating: number
          review_count: number
          total_trips: number
          trust_score: number
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rating?: number
          review_count?: number
          total_trips?: number
          trust_score?: number
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rating?: number
          review_count?: number
          total_trips?: number
          trust_score?: number
          verified?: boolean
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          amount: number
          attempts: number
          boarding_point: string
          booking_id: string | null
          contact_email: string
          contact_phone: string
          created_at: string
          dropping_point: string
          id: string
          last_error: string
          passengers: Json
          payment_method: string
          seats: string[]
          status: string
          trip_id: string
          updated_at: string
          use_wallet: boolean
          user_id: string
        }
        Insert: {
          amount?: number
          attempts?: number
          boarding_point?: string
          booking_id?: string | null
          contact_email?: string
          contact_phone?: string
          created_at?: string
          dropping_point?: string
          id?: string
          last_error?: string
          passengers?: Json
          payment_method?: string
          seats: string[]
          status?: string
          trip_id: string
          updated_at?: string
          use_wallet?: boolean
          user_id?: string
        }
        Update: {
          amount?: number
          attempts?: number
          boarding_point?: string
          booking_id?: string | null
          contact_email?: string
          contact_phone?: string
          created_at?: string
          dropping_point?: string
          id?: string
          last_error?: string
          passengers?: Json
          payment_method?: string
          seats?: string[]
          status?: string
          trip_id?: string
          updated_at?: string
          use_wallet?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
      recovery_cases: {
        Row: {
          amount: number
          attempt_id: string | null
          booking_id: string | null
          created_at: string
          duplicate_of: string | null
          id: string
          money_debited: boolean
          reference: string
          resolution: string
          status: string
          timeline: Json
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          attempt_id?: string | null
          booking_id?: string | null
          created_at?: string
          duplicate_of?: string | null
          id?: string
          money_debited?: boolean
          reference?: string
          resolution?: string
          status?: string
          timeline?: Json
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          attempt_id?: string | null
          booking_id?: string | null
          created_at?: string
          duplicate_of?: string | null
          id?: string
          money_debited?: boolean
          reference?: string
          resolution?: string
          status?: string
          timeline?: Json
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_cases_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "payment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_cases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_cases_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          cleanliness: number | null
          comfort: number | null
          comment: string | null
          created_at: string
          id: string
          operator_id: string | null
          punctuality: number | null
          rating: number
          reviewer_name: string | null
          staff: number | null
          status: string
          tags: string[]
          trip_id: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          cleanliness?: number | null
          comfort?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          operator_id?: string | null
          punctuality?: number | null
          rating: number
          reviewer_name?: string | null
          staff?: number | null
          status?: string
          tags?: string[]
          trip_id?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          cleanliness?: number | null
          comfort?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          operator_id?: string | null
          punctuality?: number | null
          rating?: number
          reviewer_name?: string | null
          staff?: number | null
          status?: string
          tags?: string[]
          trip_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_accounts: {
        Row: {
          lifetime_points: number
          points: number
          referral_code: string
          referred_by: string | null
          tier: string
          trips_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          lifetime_points?: number
          points?: number
          referral_code?: string
          referred_by?: string | null
          tier?: string
          trips_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          lifetime_points?: number
          points?: number
          referral_code?: string
          referred_by?: string | null
          tier?: string
          trips_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_campaigns: {
        Row: {
          bonus_points: number
          created_at: string
          description: string
          ends_at: string
          id: string
          is_active: boolean
          multiplier: number
          starts_at: string
          title: string
        }
        Insert: {
          bonus_points?: number
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          multiplier?: number
          starts_at?: string
          title: string
        }
        Update: {
          bonus_points?: number
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          multiplier?: number
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      reward_events: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          kind: string
          note: string
          points: number
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          kind: string
          note?: string
          points: number
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          note?: string
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_reports: {
        Row: {
          booking_id: string | null
          category: string
          created_at: string
          id: string
          message: string
          status: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          user_id?: string
        }
        Update: {
          booking_id?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_passengers: {
        Row: {
          age: number
          created_at: string
          gender: string
          id: string
          name: string
          phone: string
          relation: string
          user_id: string
        }
        Insert: {
          age?: number
          created_at?: string
          gender?: string
          id?: string
          name: string
          phone?: string
          relation?: string
          user_id?: string
        }
        Update: {
          age?: number
          created_at?: string
          gender?: string
          id?: string
          name?: string
          phone?: string
          relation?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          kind: string
          message: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          status?: string
          subject: string
          user_id?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string
          status?: string
          subject?: string
          user_id?: string
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
      accept_family_invite: { Args: { p_family: string }; Returns: undefined }
      advance_recovery_case: {
        Args: {
          p_booking?: string
          p_case: string
          p_note?: string
          p_status: string
        }
        Returns: {
          amount: number
          attempt_id: string | null
          booking_id: string | null
          created_at: string
          duplicate_of: string | null
          id: string
          money_debited: boolean
          reference: string
          resolution: string
          status: string
          timeline: Json
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "recovery_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      can_review_booking: { Args: { p_booking_id: string }; Returns: boolean }
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
      family_invites_for_me: { Args: never; Returns: string[] }
      grant_reward_points: {
        Args: {
          p_booking?: string
          p_kind: string
          p_note?: string
          p_points: number
          p_user: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_family_ids: { Args: never; Returns: string[] }
      open_recovery_case: {
        Args: {
          p_amount: number
          p_attempt?: string
          p_error?: string
          p_money_debited?: boolean
          p_trip: string
        }
        Returns: {
          amount: number
          attempt_id: string | null
          booking_id: string | null
          created_at: string
          duplicate_of: string | null
          id: string
          money_debited: boolean
          reference: string
          resolution: string
          status: string
          timeline: Json
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "recovery_cases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_reward_points: { Args: { p_points: number }; Returns: number }
      reward_leaderboard: {
        Args: never
        Returns: {
          is_me: boolean
          label: string
          lifetime_points: number
          rank: number
          tier: string
        }[]
      }
      reward_tier: { Args: { p_points: number }; Returns: string }
      shares_family: { Args: { p_other: string }; Returns: boolean }
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
