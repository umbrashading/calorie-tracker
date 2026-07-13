export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Confidence = "high" | "medium" | "low";

export type Sex = "male" | "female";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_emoji: string;
  age: number | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel;
  daily_calorie_target: number | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface IntakeEntry {
  id: string;
  user_id: string;
  logged_at: string;
  description: string;
  calories: number;
  confidence: Confidence;
  assumptions: string | null;
  image_path: string | null;
  raw_model_response: Record<string, unknown> | null;
  created_at: string;
}

export interface BurnEntry {
  id: string;
  user_id: string;
  logged_at: string;
  description: string;
  calories: number;
  confidence: Confidence;
  assumptions: string | null;
  exercise_type: string | null;
  duration_minutes: number | null;
  intensity: string | null;
  raw_model_response: Record<string, unknown> | null;
  created_at: string;
}

export interface DailySteps {
  user_id: string;
  entry_date: string;
  steps: number;
  updated_at: string;
}

export interface DailySummary {
  user_id: string;
  entry_date: string;
  display_name: string | null;
  avatar_emoji: string;
  calories_in: number;
  baseline_calories: number | null;
  steps: number;
  steps_calories: number;
  exercise_calories: number;
  calories_out_total: number | null;
  net_calories: number | null;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Omit<Profile, "created_at" | "updated_at">> & { id: string };
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      intake_entries: {
        Row: IntakeEntry;
        Insert: Omit<IntakeEntry, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<IntakeEntry, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      burn_entries: {
        Row: BurnEntry;
        Insert: Omit<BurnEntry, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<BurnEntry, "id" | "user_id" | "created_at">>;
        Relationships: [];
      };
      daily_steps: {
        Row: DailySteps;
        Insert: DailySteps;
        Update: Partial<Omit<DailySteps, "user_id" | "entry_date">>;
        Relationships: [];
      };
    };
    Views: {
      daily_summary: {
        Row: DailySummary;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
