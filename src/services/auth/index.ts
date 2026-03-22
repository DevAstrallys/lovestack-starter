/**
 * Auth service — all authentication-related Supabase calls.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:auth');

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    log.info('User signed in', { email });
    return data;
  } catch (err) {
    log.error('Sign-in failed', { email, error: err });
    throw err;
  }
}

export async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    log.info('User signed up', { email });
    return data;
  } catch (err) {
    log.error('Sign-up failed', { email, error: err });
    throw err;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    log.info('User signed out');
  } catch (err) {
    log.error('Sign-out failed', err);
    throw err;
  }
}

export async function getSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (err) {
    log.error('Get session failed', err);
    throw err;
  }
}

/**
 * Subscribe to auth state changes. Returns the subscription for cleanup.
 */
export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
