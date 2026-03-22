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

/**
 * Invoke the RGPD edge function (export or delete user data).
 */
export async function invokeRgpd(action: 'export' | 'delete') {
  try {
    const { data, error } = await supabase.functions.invoke('rgpd', { body: { action } });
    if (error) throw error;
    log.info('RGPD action completed', { action });
    return data;
  } catch (err) {
    log.error('RGPD action failed', { action, error: err });
    throw err;
  }
}

/**
 * Check if a user has admin-level access (platform or org admin).
 * Returns the list of admin role codes the user holds.
 */
export async function checkAdminAccess(userId: string) {
  const ADMIN_ROLES = [
    'admin_platform', 'super_admin', 'admin',
    'gestionnaire_logiciel', 'tech_logiciel', 'admin_org',
  ];

  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('id, roles!inner(code, is_platform_scope)')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const adminRoles = (data || [])
      .filter((m: any) => m.roles && ADMIN_ROLES.includes(m.roles.code))
      .map((m: any) => m.roles.code as string);

    return { isAdmin: adminRoles.length > 0, roles: adminRoles };
  } catch (err) {
    log.error('Failed to check admin access', { userId, error: err });
    return { isAdmin: false, roles: [] };
  }
}
