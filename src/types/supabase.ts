export type Database = {
  light: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          image: string | null
          role: "ADMIN" | "MANAGER" | "USER"
          manager_id: string | null
          work_schedule: import("./index").WorkSchedule | null
          monday_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          image?: string | null
          role?: "ADMIN" | "MANAGER" | "USER"
          manager_id?: string | null
          work_schedule?: import("./index").WorkSchedule | null
          monday_user_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string | null
          image?: string | null
          role?: "ADMIN" | "MANAGER" | "USER"
          manager_id?: string | null
          work_schedule?: import("./index").WorkSchedule | null
          monday_user_id?: string | null
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          provider: string
          provider_account_id: string
          access_token: string | null
          refresh_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          provider_account_id: string
          access_token?: string | null
          refresh_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
        }
        Update: Record<string, never>
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          expires: string
        }
        Insert: {
          id?: string
          user_id: string
          session_token: string
          expires: string
        }
        Update: {
          expires?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          deadline: string | null
          color: string | null
          monday_item_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          deadline?: string | null
          color?: string | null
          monday_item_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          deadline?: string | null
          color?: string | null
          monday_item_id?: string | null
        }
      }
      monday_sub_tasks: {
        Row: {
          id: string
          project_id: string
          name: string
          monday_sub_item_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          monday_sub_item_id?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          monday_sub_item_id?: string | null
        }
      }
      project_allocations: {
        Row: {
          id: string
          user_id: string
          project_id: string
          planned_hours: number
          week_start: string
          created_by_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          planned_hours: number
          week_start: string
          created_by_id: string
          created_at?: string
        }
        Update: {
          planned_hours?: number
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          logged_by_id: string
          project_id: string
          monday_sub_task_id: string | null
          date: string
          hours: number
          note: string | null
          monday_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          logged_by_id: string
          project_id: string
          monday_sub_task_id?: string | null
          date: string
          hours: number
          note?: string | null
          monday_synced_at?: string | null
          created_at?: string
        }
        Update: {
          hours?: number
          note?: string | null
          monday_synced_at?: string | null
        }
      }
      google_calendar_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          watch_channel_id: string | null
          watch_resource_id: string | null
          watch_expiry: string | null
          watch_sync_token: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          watch_channel_id?: string | null
          watch_resource_id?: string | null
          watch_expiry?: string | null
          watch_sync_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          watch_channel_id?: string | null
          watch_resource_id?: string | null
          watch_expiry?: string | null
          watch_sync_token?: string | null
          updated_at?: string
        }
      }
      monday_config: {
        Row: {
          id: string
          board_id: string
          hours_column_id: string | null
          webhook_secret: string | null
          last_synced_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          hours_column_id?: string | null
          webhook_secret?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
        Update: {
          board_id?: string
          hours_column_id?: string | null
          webhook_secret?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      capacity_conflicts: {
        Row: {
          user_id: string
          week_start: string
          allocated_hours: number
          rn: number
        }
      }
    }
    Functions: Record<string, never>
  }
}
