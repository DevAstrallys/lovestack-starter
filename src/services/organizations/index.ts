/**
 * Organizations service — CRUD and admin lookup.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:organizations');

/** Fetch all companies visible to the current user. */
export async function fetchCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, email, phone, address, city, tags');
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to fetch companies', { error: err });
    throw err;
  }
}

/** Fetch company_users for a specific user, with joined company data. */
export async function fetchCompanyUsersByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select('id, company_id, role, companies(id, name, email, phone, address, city, tags)')
      .eq('user_id', userId);
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to fetch company users', { userId, error: err });
    throw err;
  }
}

/** Update an organization's fields. */
export async function updateOrganization(
  organizationId: string,
  updates: Record<string, unknown>,
) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId)
      .select()
      .single();
    if (error) throw error;
    log.info('Organization updated', { organizationId });
    return data;
  } catch (err) {
    log.error('Failed to update organization', { organizationId, error: err });
    throw err;
  }
}

/** Fetch all organizations ordered by creation date. */
export async function fetchAllOrganizations() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to fetch all organizations', { error: err });
    throw err;
  }
}

/** Fetch active organizations (id, name). */
export async function fetchActiveOrganizations() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('is_active', true);
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to fetch active organizations', { error: err });
    throw err;
  }
}

/** Create a new organization. */
export async function createOrganization(params: {
  name: string;
  description?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  country?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert(params)
      .select()
      .single();
    if (error) throw error;
    log.info('Organization created', { name: params.name });
    return data;
  } catch (err) {
    log.error('Failed to create organization', { error: err });
    throw err;
  }
}

/** Toggle organization active status. */
export async function toggleOrganizationStatus(organizationId: string, isActive: boolean) {
  try {
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', organizationId);
    if (error) throw error;
    log.info('Organization status toggled', { organizationId, isActive });
  } catch (err) {
    log.error('Failed to toggle organization status', { organizationId, error: err });
    throw err;
  }
}

/** Search profiles by name. */
export async function searchProfiles(query: string, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', `%${query}%`)
      .limit(limit);
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to search profiles', { query, error: err });
    throw err;
  }
}

/** Fetch the admin membership for an organization. */
export async function fetchOrgAdmin(organizationId: string) {
  try {
    const { data: membership } = await supabase
      .from('memberships')
      .select('user_id, roles!inner(code)')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .like('roles.code', '%admin%')
      .limit(1);

    if (membership && membership.length > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', membership[0].user_id)
        .single();
      return profile?.full_name || null;
    }
    return null;
  } catch (err) {
    log.error('Failed to fetch org admin', { organizationId, error: err });
    return null;
  }
}

/** Fetch a single organization by ID. */
export async function fetchOrganizationById(organizationId: string) {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    log.error('Failed to fetch organization by ID', { organizationId, error: err });
    throw err;
  }
}

/** Fetch active organizations with visual identity fields. */
export async function fetchActiveOrganizationsWithBranding() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, description, is_active, primary_color, secondary_color, logo_url')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error('Failed to fetch active organizations with branding', { error: err });
    throw err;
  }
}

/** Check if user has platform admin membership. */
export async function checkPlatformAdminStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('id, roles!inner(code, is_platform_scope)')
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;
    return (data || []).some((m: Record<string, unknown>) => {
      const roles = m.roles as Record<string, unknown> | null;
      return roles && (roles.code === 'admin_platform' || roles.code === 'super_admin' || roles.is_platform_scope === true);
    });
  } catch (err) {
    log.error('Failed to check platform admin status', { userId, error: err });
    return false;
  }
}

/** Find the admin_org role ID. */
export async function findAdminOrgRoleId(): Promise<string | null> {
  try {
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'admin_org')
      .single();

    if (role) return role.id;

    const { data: fallback } = await supabase
      .from('roles')
      .select('id')
      .eq('is_platform_scope', false)
      .ilike('code', '%admin%')
      .limit(1);

    return fallback?.[0]?.id || null;
  } catch (err) {
    log.error('Failed to find admin_org role', { error: err });
    return null;
  }
}
