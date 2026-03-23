import { supabase } from './supabase';

export type SystemEventType = 'system' | 'security' | 'upgrade' | 'achievement';

/**
 * Logs a system-level event to the database for real-time notification.
 * @param message The human-readable notification message
 * @param event_type The category of the event
 */
export async function logSystemEvent(message: string, event_type: SystemEventType = 'system') {
  try {
    const { error } = await supabase
      .from('system_events')
      .insert([
        { 
          message: message, 
          event_type: event_type,
          created_at: new Date().toISOString(),
          is_read: false
        }
      ]);
    
    if (error) {
      console.error('Error logging system event:', error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Unexpected error logging system event:', err);
    return false;
  }
}
