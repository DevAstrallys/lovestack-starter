/**
 * Users service — profile and membership management.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:users');

export async function fetchProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Failed to fetch profile', { userId, error: err });
    throw err;
  }
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    log.info('Profile updated', { userId });
    return data;
  } catch (err) {
    log.error('Failed to update profile', { userId, error: err });
    throw err;
  }
}

export async function fetchUserMemberships(userId: string) {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('*, roles(*), organizations(*)')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Failed to fetch memberships', { userId, error: err });
    throw err;
  }
}
