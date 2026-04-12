/**
 * /src/services/roles/index.ts
 * Roles, permissions, and role-permission assignments.
 * Absorbs direct supabase calls from:
 *   components/admin/RolesPermissions.tsx
 *   components/admin/PermissionsManager.tsx
 *   components/admin/AccessSecurityManager.tsx
 *   contexts/RoleViewContext.tsx
 *   components/locations/RequestRoleDialog.tsx
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

const log = createLogger('service:roles');

type RoleRow = Database['public']['Tables']['roles']['Row'];

/** Fetch all active roles ordered by sort_order. */
export async function fetchActiveRoles(): Promise<RoleRow[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
    .order('code');
  if (error) throw error;
  return data ?? [];
}

/** Fetch all permissions. */
export async function fetchPermissions() {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('code');
  if (error) throw error;
  return data ?? [];
}

/** Fetch role-permission assignments. */
export async function fetchRolePermissions() {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('*');
  if (error) throw error;
  return data ?? [];
}

/** Toggle a role-permission assignment. */
export async function toggleRolePermission(roleId: string, permissionId: string, exists: boolean) {
  if (exists) {
    const { error } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);
    if (error) throw error;
    log.info('Role permission removed', { roleId, permissionId });
  } else {
    const { error } = await supabase
      .from('role_permissions')
      .insert({ role_id: roleId, permission_id: permissionId });
    if (error) throw error;
    log.info('Role permission added', { roleId, permissionId });
  }
}

/** Fetch all roles (active and inactive). */
export async function fetchAllRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('sort_order')
    .order('code');
  if (error) throw error;
  return data ?? [];
}

/** Update a role's active status. */
export async function updateRoleStatus(roleId: string, isActive: boolean) {
  const { error } = await supabase
    .from('roles')
    .update({ is_active: isActive })
    .eq('id', roleId);
  if (error) throw error;
  log.info('Role status updated', { roleId, isActive });
}

/** Fetch user memberships (org-level). */
export async function fetchMemberships(filters?: { userId?: string; organizationId?: string }) {
  let query = supabase.from('memberships').select('*');
  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.organizationId) query = query.eq('organization_id', filters.organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Fetch location memberships. */
export async function fetchLocationMemberships(filters?: { userId?: string; organizationId?: string }) {
  let query = supabase.from('location_memberships')
    .select('*, roles(id, code, label, parent_id, sort_order, is_platform_scope)');
  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.organizationId) query = query.eq('organization_id', filters.organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Fetch role requests. */
export async function fetchRoleRequests(organizationId?: string) {
  let query = supabase.from('role_requests')
    .select('*, profiles(full_name), roles(code, label)')
    .order('created_at', { ascending: false });
  if (organizationId) query = query.eq('organization_id', organizationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Create a role request. */
export async function createRoleRequest(params: {
  user_id: string;
  role_id: string;
  organization_id: string;
  element_id?: string | null;
  group_id?: string | null;
  ensemble_id?: string | null;
  message?: string | null;
}) {
  const { error } = await supabase.from('role_requests').insert(params);
  if (error) throw error;
  log.info('Role request created', { userId: params.user_id, roleId: params.role_id });
}

/** Approve or reject a role request. */
export async function updateRoleRequest(requestId: string, status: 'approved' | 'rejected') {
  const { error } = await supabase
    .from('role_requests')
    .update({ status })
    .eq('id', requestId);
  if (error) throw error;
  log.info('Role request updated', { requestId, status });
}
