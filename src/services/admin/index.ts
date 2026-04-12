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

/** Toggle membership active status. */
export async function toggleMembershipStatus(
  table: 'memberships' | 'location_memberships',
  id: string,
  isActive: boolean,
) {
  try {
    const { error } = await supabase
      .from(table)
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) throw error;
    log.info('Membership status toggled', { table, id, isActive });
  } catch (err) {
    log.error('Toggle membership status failed', { table, id, error: err });
    throw err;
  }
}

/** Add a membership with all fields. */
export async function addMembershipFull(params: {
  user_id: string;
  organization_id: string;
  role_id: string;
  is_active?: boolean;
  can_validate_user_requests?: boolean;
}) {
  try {
    const { error } = await supabase.from('memberships').insert({
      user_id: params.user_id,
      organization_id: params.organization_id,
      role_id: params.role_id,
      is_active: params.is_active ?? true,
      can_validate_user_requests: params.can_validate_user_requests ?? false,
    });
    if (error) throw error;
    log.info('Full membership created', { userId: params.user_id, roleId: params.role_id });
  } catch (err) {
    log.error('Add full membership failed', { error: err });
    throw err;
  }
}

/** Create multiple location memberships in bulk. */
export async function createBulkLocationMemberships(rows: Array<{
  user_id: string;
  organization_id: string;
  role_id: string;
  element_id?: string | null;
  group_id?: string | null;
  ensemble_id?: string | null;
  expires_at?: string | null;
}>) {
  try {
    const { error } = await supabase.from('location_memberships').insert(rows);
    if (error) throw error;
    log.info('Bulk location memberships created', { count: rows.length });
  } catch (err) {
    log.error('Create bulk location memberships failed', { error: err });
    throw err;
  }
}

/** Create a membership for an admin on a new organization. */
export async function createAdminMembership(userId: string, organizationId: string, roleId: string) {
  try {
    const { error } = await supabase.from('memberships').insert({
      user_id: userId,
      organization_id: organizationId,
      role_id: roleId,
      is_active: true,
    });
    if (error) throw error;
    log.info('Admin membership created', { userId, organizationId, roleId });
  } catch (err) {
    log.error('Create admin membership failed', { error: err });
    throw err;
  }
}
