/**
 * /src/services/admin/index.ts
 *
 * Admin service — edge function invocations and admin-only operations.
 * Absorbs direct supabase.functions.invoke() calls from:
 *   components/admin/OrganizationsManagement.tsx (create-user)
 *   components/admin/UsersManagement.tsx (update-user-email, delete-user)
 *   components/locations/InviteUserDialog.tsx (create-user)
 *   components/locations/LocationUsersManagement.tsx (delete-user)
 *   components/tickets/TicketDetailDialog.tsx (send-email)
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:admin');

// ── User management via edge functions ───────────────────────────────

interface CreateUserParams {
  email: string;
  password: string;
  full_name: string;
  organizationName?: string;
  loginUrl?: string;
}

export async function createUser(params: CreateUserParams) {
  try {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: params,
    });
    if (error) throw error;
    log.info('User created via edge function', { email: params.email });
    return data;
  } catch (err) {
    log.error('Create user failed', { email: params.email, error: err });
    throw err;
  }
}

export async function updateUserEmail(userId: string, newEmail: string) {
  try {
    const { data, error } = await supabase.functions.invoke('update-user-email', {
      body: { userId, newEmail },
    });
    if (error) throw error;
    log.info('User email updated', { userId });
    return data;
  } catch (err) {
    log.error('Update user email failed', { userId, error: err });
    throw err;
  }
}

export async function deleteUser(userId: string) {
  try {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });
    if (error) throw error;
    log.info('User deleted', { userId });
    return data;
  } catch (err) {
    log.error('Delete user failed', { userId, error: err });
    throw err;
  }
}

// ── Membership management ────────────────────────────────────────────

interface CreateMembershipParams {
  user_id: string;
  role_id: string;
  organization_id: string;
  is_active?: boolean;
}

export async function createMembership(params: CreateMembershipParams) {
  try {
    const { error } = await supabase.from('memberships').insert({
      user_id: params.user_id,
      role_id: params.role_id,
      organization_id: params.organization_id,
      is_active: params.is_active ?? true,
    });
    if (error) throw error;
    log.info('Membership created', { userId: params.user_id, roleId: params.role_id });
  } catch (err) {
    log.error('Create membership failed', { error: err });
    throw err;
  }
}

interface CreateLocationMembershipParams {
  user_id: string;
  role_id: string;
  organization_id: string;
  ensemble_id?: string | null;
  group_id?: string | null;
  element_id?: string | null;
}

export async function createLocationMembership(params: CreateLocationMembershipParams) {
  try {
    const { error } = await supabase.from('location_memberships').insert({
      user_id: params.user_id,
      role_id: params.role_id,
      organization_id: params.organization_id,
      ensemble_id: params.ensemble_id ?? null,
      group_id: params.group_id ?? null,
      element_id: params.element_id ?? null,
    });
    if (error) throw error;
    log.info('Location membership created', {
      userId: params.user_id,
      roleId: params.role_id,
    });
  } catch (err) {
    log.error('Create location membership failed', { error: err });
    throw err;
  }
}
