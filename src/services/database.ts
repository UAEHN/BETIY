import { supabase, ShoppingItem, Message, User } from '@/lib/supabase';
import { categorizeItem } from '@/lib/utils';

export const ShoppingService = {
  async getItems() {
    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching shopping items:', error);
      return { data: null, error };
    }
  },
  
  async addItem(item: string) {
    try {
      const category = categorizeItem(item);
      const { data, error } = await supabase
        .from('shopping_list')
        .insert([{ item, category, completed: false }])
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error adding item:', error);
      return { data: null, error };
    }
  },
  
  async toggleComplete(id: number, completed: boolean) {
    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .update({ completed: !completed })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating item:', error);
      return { data: null, error };
    }
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('shopping_list_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shopping_list' }, 
        callback
      )
      .subscribe();
  }
};

export const ChatService = {
  async getMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      
      const formattedMessages = data?.map(message => ({
        ...message,
        user: message.users as unknown as User
      })) || [];
      
      return { data: formattedMessages, error: null };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return { data: null, error };
    }
  },
  
  async sendMessage(userId: string, message: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{ user_id: userId, message }])
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error sending message:', error);
      return { data: null, error };
    }
  },

  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user:', error);
      return { data: null, error };
    }
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('messages_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        callback
      )
      .subscribe();
  }
};

export const UserService = {
  async getCurrentUser() {
    // For demo purposes, return a mock user
    // In a real app, this would come from authentication
    return {
      data: {
        id: 'user-1',
        name: 'أنت'
      },
      error: null
    };
  }
};
