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
export async function updateRoleRequest(requestId: string, status: 'approved' | 'rejected', reviewedBy?: string) {
  const updates: Record<string, unknown> = { status, reviewed_at: new Date().toISOString() };
  if (reviewedBy) updates.reviewed_by = reviewedBy;
  const { error } = await supabase
    .from('role_requests')
    .update(updates)
    .eq('id', requestId);
  if (error) throw error;
  log.info('Role request updated', { requestId, status });
}

/** Fetch role requests with full details (profiles, roles, locations). */
export async function fetchRoleRequestsWithDetails(organizationId: string) {
  const { data, error } = await supabase
    .from('role_requests')
    .select(`
      *,
      profiles!role_requests_user_id_fkey(full_name),
      roles(code, label),
      location_elements(name),
      location_groups(name),
      location_ensembles(name)
    `)
    .eq('organization_id', organizationId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Fetch location names by IDs (for resolving location_memberships). */
export async function fetchLocationNames(ids: {
  elementIds: string[];
  groupIds: string[];
  ensembleIds: string[];
}): Promise<Record<string, string>> {
  const nameMap: Record<string, string> = {};
  const [elemRes, grpRes, ensRes] = await Promise.all([
    ids.elementIds.length ? supabase.from('location_elements').select('id, name').in('id', ids.elementIds) : { data: [] },
    ids.groupIds.length ? supabase.from('location_groups').select('id, name').in('id', ids.groupIds) : { data: [] },
    ids.ensembleIds.length ? supabase.from('location_ensembles').select('id, name').in('id', ids.ensembleIds) : { data: [] },
  ]);
  for (const row of (elemRes.data || [])) nameMap[row.id] = row.name;
  for (const row of (grpRes.data || [])) nameMap[row.id] = row.name;
  for (const row of (ensRes.data || [])) nameMap[row.id] = row.name;
  return nameMap;
}
