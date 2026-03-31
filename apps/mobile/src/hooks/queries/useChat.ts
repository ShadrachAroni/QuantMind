import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  created_at?: string;
}

export function useChatHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['chat', 'history', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('oracle_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', eightHoursAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(m => ({
        id: m.id || m.created_at,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.created_at,
        created_at: m.created_at
      })) as Message[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
