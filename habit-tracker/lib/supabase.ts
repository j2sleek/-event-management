import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          age: number | null
          gender: string | null
          height: number | null
          weight: number | null
          activity_level: string | null
          sleep_hours: number | null
          stress_level: number | null
          location: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          activity_level?: string | null
          sleep_hours?: number | null
          stress_level?: number | null
          location?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          age?: number | null
          gender?: string | null
          height?: number | null
          weight?: number | null
          activity_level?: string | null
          sleep_hours?: number | null
          stress_level?: number | null
          location?: string | null
          timezone?: string | null
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          type: "start" | "stop"
          category: string | null
          difficulty: string | null
          action_items: string[]
          streak: number
          completion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          type: "start" | "stop"
          category?: string | null
          difficulty?: string | null
          action_items?: string[]
          streak?: number
          completion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          type?: "start" | "stop"
          category?: string | null
          difficulty?: string | null
          action_items?: string[]
          streak?: number
          completion_rate?: number
          updated_at?: string
        }
      }
      habit_progress: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          date: string
          completed: boolean
          mood: string | null
          rating: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          date: string
          completed: boolean
          mood?: string | null
          rating?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          date?: string
          completed?: boolean
          mood?: string | null
          rating?: number | null
          notes?: string | null
        }
      }
      ai_tips: {
        Row: {
          id: string
          user_id: string
          habit_id: string | null
          tip_content: string
          tip_type: string
          generated_at: string
          is_read: boolean
        }
        Insert: {
          id?: string
          user_id: string
          habit_id?: string | null
          tip_content: string
          tip_type: string
          generated_at?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          habit_id?: string | null
          tip_content?: string
          tip_type?: string
          generated_at?: string
          is_read?: boolean
        }
      }
    }
  }
}
