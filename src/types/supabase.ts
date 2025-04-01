// Import Database types from Supabase
import { User as AuthUser } from '@supabase/supabase-js';
import { User as AppUser } from '@/types';

// Re-export the User type from our main types file for convenience
export type { AppUser as User };

// Define types for Supabase database schema
export type Tables = {
  users: {
    Row: {
      id: string;
      name: string | null;
      username: string | null;
      avatar_url: string | null;
      email: string | null;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['users']['Row'], 'created_at' | 'updated_at'> & {
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables['users']['Insert']>;
  };
  
  messages: {
    Row: {
      id: number;
      user_id: string;
      message: string;
      group_id: string;
      timestamp: string;
      message_type: string;
      product_list?: any;
      is_read: boolean;
      read_by?: string[];
    };
    Insert: Omit<Tables['messages']['Row'], 'id'> & {
      id?: number;
    };
    Update: Partial<Tables['messages']['Insert']>;
  };
  
  groups: {
    Row: {
      id: string;
      name: string;
      created_by: string;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['groups']['Row'], 'created_at' | 'updated_at'> & {
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables['groups']['Insert']>;
  };
  
  group_members: {
    Row: {
      id: string;
      group_id: string;
      user_id: string;
      role: 'admin' | 'member';
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['group_members']['Row'], 'created_at' | 'updated_at'> & {
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Tables['group_members']['Insert']>;
  };
}; 