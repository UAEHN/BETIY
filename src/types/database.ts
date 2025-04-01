export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      add_contact: {
        Args: {
          contact_user_id: string
        }
        Returns: boolean
      }
      find_users_to_add: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          name: string
          username: string
          display_name: string
          avatar_url: string
          is_contact: boolean
        }[]
      }
      get_contacts: {
        Args: Record<string, never>
        Returns: {
          id: string
          name: string
          username: string
          display_name: string
          avatar_url: string
          created_at: string
        }[]
      }
      remove_contact: {
        Args: {
          contact_user_id: string
        }
        Returns: boolean
      }
    }
  }
} 