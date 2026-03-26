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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          journey_id: string | null
          student_id: string
          total_points: number
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          journey_id?: string | null
          student_id: string
          total_points?: number
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          journey_id?: string | null
          student_id?: string
          total_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "workout_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_scores: {
        Row: {
          challenge_id: string
          description: string | null
          earned_at: string
          id: string
          participant_id: string
          points: number
          score_type: string
        }
        Insert: {
          challenge_id: string
          description?: string | null
          earned_at?: string
          id?: string
          participant_id: string
          points?: number
          score_type: string
        }
        Update: {
          challenge_id?: string
          description?: string | null
          earned_at?: string
          id?: string
          participant_id?: string
          points?: number
          score_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_scores_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_scores_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          id: string
          invite_code: string
          name: string
          points_per_checkin: number
          points_streak_bonus: number
          points_weekly_bonus: number
          professor_id: string
          source_journey_id: string | null
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          invite_code?: string
          name: string
          points_per_checkin?: number
          points_streak_bonus?: number
          points_weekly_bonus?: number
          professor_id: string
          source_journey_id?: string | null
          start_date?: string
          status?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          id?: string
          invite_code?: string
          name?: string
          points_per_checkin?: number
          points_streak_bonus?: number
          points_weekly_bonus?: number
          professor_id?: string
          source_journey_id?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_source_journey_id_fkey"
            columns: ["source_journey_id"]
            isOneToOne: false
            referencedRelation: "workout_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          id: string
          name: string
          periodicity: string
          price: number
          professor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          periodicity?: string
          price?: number
          professor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          periodicity?: string
          price?: number
          professor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          must_change_password: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          must_change_password?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          must_change_password?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      student_bioimpedance: {
        Row: {
          age: number | null
          basal_metabolism: number | null
          bmi: number | null
          body_fat_pct: number | null
          body_water_pct: number | null
          bone_mass: number | null
          cellular_age: number | null
          created_at: string
          extracellular_water: number | null
          fat_mass: number | null
          file_url: string | null
          height: number | null
          hydration_index: number | null
          id: string
          intracellular_water: number | null
          intracellular_water_pct: number | null
          lean_mass: number | null
          lean_mass_pct: number | null
          measured_at: string
          muscle_fat_ratio: number | null
          muscle_mass: number | null
          muscle_mass_pct: number | null
          notes: string | null
          phase_angle: number | null
          professor_id: string
          student_id: string
          total_body_water: number | null
          visceral_fat: number | null
          water_lean_mass_abs_pct: number | null
          water_lean_mass_pct: number | null
          weight: number | null
        }
        Insert: {
          age?: number | null
          basal_metabolism?: number | null
          bmi?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass?: number | null
          cellular_age?: number | null
          created_at?: string
          extracellular_water?: number | null
          fat_mass?: number | null
          file_url?: string | null
          height?: number | null
          hydration_index?: number | null
          id?: string
          intracellular_water?: number | null
          intracellular_water_pct?: number | null
          lean_mass?: number | null
          lean_mass_pct?: number | null
          measured_at?: string
          muscle_fat_ratio?: number | null
          muscle_mass?: number | null
          muscle_mass_pct?: number | null
          notes?: string | null
          phase_angle?: number | null
          professor_id: string
          student_id: string
          total_body_water?: number | null
          visceral_fat?: number | null
          water_lean_mass_abs_pct?: number | null
          water_lean_mass_pct?: number | null
          weight?: number | null
        }
        Update: {
          age?: number | null
          basal_metabolism?: number | null
          bmi?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass?: number | null
          cellular_age?: number | null
          created_at?: string
          extracellular_water?: number | null
          fat_mass?: number | null
          file_url?: string | null
          height?: number | null
          hydration_index?: number | null
          id?: string
          intracellular_water?: number | null
          intracellular_water_pct?: number | null
          lean_mass?: number | null
          lean_mass_pct?: number | null
          measured_at?: string
          muscle_fat_ratio?: number | null
          muscle_mass?: number | null
          muscle_mass_pct?: number | null
          notes?: string | null
          phase_angle?: number | null
          professor_id?: string
          student_id?: string
          total_body_water?: number | null
          visceral_fat?: number | null
          water_lean_mass_abs_pct?: number | null
          water_lean_mass_pct?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_bioimpedance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_daily_records: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          bmi: number | null
          created_at: string
          height: number | null
          hydration_level: string | null
          id: string
          notes: string | null
          oxygen_saturation: number | null
          professor_id: string
          recorded_at: string
          resting_bpm: number | null
          sleep_hours: number | null
          student_id: string
          weight: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          created_at?: string
          height?: number | null
          hydration_level?: string | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          professor_id: string
          recorded_at?: string
          resting_bpm?: number | null
          sleep_hours?: number | null
          student_id: string
          weight?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          bmi?: number | null
          created_at?: string
          height?: number | null
          hydration_level?: string | null
          id?: string
          notes?: string | null
          oxygen_saturation?: number | null
          professor_id?: string
          recorded_at?: string
          resting_bpm?: number | null
          sleep_hours?: number | null
          student_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_daily_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          professor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          professor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          professor_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          group_id: string | null
          id: string
          payment_day: number | null
          phone: string | null
          plan: string | null
          plan_id: string | null
          professor_id: string
          registration_date: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          group_id?: string | null
          id?: string
          payment_day?: number | null
          phone?: string | null
          plan?: string | null
          plan_id?: string | null
          professor_id: string
          registration_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          group_id?: string | null
          id?: string
          payment_day?: number | null
          phone?: string | null
          plan?: string | null
          plan_id?: string | null
          professor_id?: string
          registration_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "student_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_checkins: {
        Row: {
          checked_in_at: string
          checked_in_by: string
          created_at: string
          id: string
          journey_id: string
          notes: string | null
          professor_id: string
          student_id: string
          workout_id: string
        }
        Insert: {
          checked_in_at?: string
          checked_in_by: string
          created_at?: string
          id?: string
          journey_id: string
          notes?: string | null
          professor_id: string
          student_id: string
          workout_id: string
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string
          created_at?: string
          id?: string
          journey_id?: string
          notes?: string | null
          professor_id?: string
          student_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_checkins_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "workout_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_checkins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_checkins_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_journeys: {
        Row: {
          created_at: string
          end_date: string
          format: string
          hide_on_expire: boolean | null
          hide_until_start: boolean | null
          id: string
          level: string
          name: string
          objective: string
          orientations: string | null
          professor_id: string
          start_date: string
          status: string | null
          student_can_view: boolean | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string
          format?: string
          hide_on_expire?: boolean | null
          hide_until_start?: boolean | null
          id?: string
          level?: string
          name: string
          objective?: string
          orientations?: string | null
          professor_id: string
          start_date?: string
          status?: string | null
          student_can_view?: boolean | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          format?: string
          hide_on_expire?: boolean | null
          hide_until_start?: boolean | null
          id?: string
          level?: string
          name?: string
          objective?: string
          orientations?: string | null
          professor_id?: string
          start_date?: string
          status?: string | null
          student_can_view?: boolean | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_journeys_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_feedback: {
        Row: {
          calories_burned: number | null
          checkin_time: string | null
          checkout_time: string | null
          created_at: string
          fatigue_scale: number | null
          feedback_type: string
          id: string
          mood_scale: number | null
          muscle_soreness_scale: number | null
          notes: string | null
          pain_scale_eva: number | null
          perceived_exertion_scale: number | null
          post_recovery_scale: number | null
          professor_id: string
          recovery_perception_scale: number | null
          session_date: string
          sleep_quality_scale: number | null
          stress_level_scale: number | null
          student_id: string
          urine_color_scale: number | null
          workout_bpm_avg: number | null
          workout_bpm_max: number | null
          workout_checkin_id: string | null
        }
        Insert: {
          calories_burned?: number | null
          checkin_time?: string | null
          checkout_time?: string | null
          created_at?: string
          fatigue_scale?: number | null
          feedback_type: string
          id?: string
          mood_scale?: number | null
          muscle_soreness_scale?: number | null
          notes?: string | null
          pain_scale_eva?: number | null
          perceived_exertion_scale?: number | null
          post_recovery_scale?: number | null
          professor_id: string
          recovery_perception_scale?: number | null
          session_date?: string
          sleep_quality_scale?: number | null
          stress_level_scale?: number | null
          student_id: string
          urine_color_scale?: number | null
          workout_bpm_avg?: number | null
          workout_bpm_max?: number | null
          workout_checkin_id?: string | null
        }
        Update: {
          calories_burned?: number | null
          checkin_time?: string | null
          checkout_time?: string | null
          created_at?: string
          fatigue_scale?: number | null
          feedback_type?: string
          id?: string
          mood_scale?: number | null
          muscle_soreness_scale?: number | null
          notes?: string | null
          pain_scale_eva?: number | null
          perceived_exertion_scale?: number | null
          post_recovery_scale?: number | null
          professor_id?: string
          recovery_perception_scale?: number | null
          session_date?: string
          sleep_quality_scale?: number | null
          stress_level_scale?: number | null
          student_id?: string
          urine_color_scale?: number | null
          workout_bpm_avg?: number | null
          workout_bpm_max?: number | null
          workout_checkin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_feedback_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_feedback_workout_checkin_id_fkey"
            columns: ["workout_checkin_id"]
            isOneToOne: false
            referencedRelation: "workout_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          day_label: string
          exercises_data: Json | null
          id: string
          journey_id: string
          name: string
          orientations: string | null
          professor_id: string
          sort_order: number | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_label?: string
          exercises_data?: Json | null
          id?: string
          journey_id: string
          name: string
          orientations?: string | null
          professor_id: string
          sort_order?: number | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_label?: string
          exercises_data?: Json | null
          id?: string
          journey_id?: string
          name?: string
          orientations?: string | null
          professor_id?: string
          sort_order?: number | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "workout_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
