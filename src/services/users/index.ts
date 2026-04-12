/**
 * Users service — profile and membership management.
 */
import { supabase } from "@/integrations/supabase/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("service:users");

export async function fetchProfile(userId: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) throw error;
    return data;
  } catch (err) {
    log.error("Failed to fetch profile", { userId, error: err });
    throw err;
  }
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();
    if (error) throw error;
    log.info("Profile updated", { userId });
    return data;
  } catch (err) {
    log.error("Failed to update profile", { userId, error: err });
    throw err;
  }
}

export async function fetchUserMemberships(userId: string) {
  try {
    const { data, error } = await supabase
      .from("memberships")
      .select("*, roles(*), organizations(*)")
      .eq("user_id", userId)
      .eq("is_active", true);
    if (error) throw error;
    return data;
  } catch (err) {
    log.error("Failed to fetch memberships", { userId, error: err });
    throw err;
  }
}

/**
 * Invoke the RGPD edge function (export or delete user data).
 */
export async function invokeRgpd(action: "export" | "delete") {
  try {
    const { data, error } = await supabase.functions.invoke("rgpd", { body: { action } });
    if (error) throw error;
    log.info("RGPD action completed", { action });
    return data;
  } catch (err) {
    log.error("RGPD action failed", { action, error: err });
    throw err;
  }
}

/**
 * Check if a user has admin-level access (platform or org admin).
 * Returns the list of admin role codes the user holds.
 */
export async function checkAdminAccess(userId: string) {
  const ADMIN_ROLES = ["admin_platform", "super_admin", "admin", "gestionnaire_logiciel", "tech_logiciel", "admin_org"];

  try {
    const { data, error } = await supabase
      .from("memberships")
      .select("id, roles!inner(code, is_platform_scope)")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (error) throw error;

    const adminRoles = (data || [])
      .filter((m: { roles: { code: string; is_platform_scope: boolean } | null }) => m.roles && ADMIN_ROLES.includes(m.roles.code))
      .map((m: { roles: { code: string; is_platform_scope: boolean } | null }) => m.roles!.code);

    return { isAdmin: adminRoles.length > 0, roles: adminRoles };
  } catch (err) {
    log.error("Failed to check admin access", { userId, error: err });
    return { isAdmin: false, roles: [] };
  }
}

/**
 * Fetch all active roles, optionally filtered to non-platform scope.
 */
export async function fetchRoles(options?: { platformScope?: boolean }) {
  try {
    let query = supabase.from("roles").select("*").eq("is_active", true);
    if (options?.platformScope === false) {
      query = query.eq("is_platform_scope", false);
    }
    const { data, error } = await query.order("sort_order");
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error("Failed to fetch roles", { error: err });
    throw err;
  }
}

/**
 * Fetch memberships with joined roles, organizations and profiles.
 */
export async function fetchMembershipsWithDetails(filters: { organizationId?: string }) {
  try {
    let query = supabase
      .from("memberships")
      .select(
        `
        id, user_id, role_id, is_active, expires_at, created_at, organization_id,
        roles (code, label, description),
        organizations (name),
        profiles:user_id (full_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters.organizationId) {
      query = query.eq("organization_id", filters.organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error("Failed to fetch memberships with details", { filters, error: err });
    throw err;
  }
}

/**
 * Fetch location memberships with joined roles and location names.
 */
export async function fetchLocationMembershipsWithDetails(filters: { organizationId?: string }) {
  try {
    let query = supabase
      .from("location_memberships")
      .select(
        `
        id, user_id, role_id, is_active, expires_at, created_at, organization_id,
        ensemble_id, group_id, element_id,
        roles (code, label, description),
        location_ensembles:ensemble_id (name),
        location_groups:group_id (name),
        location_elements:element_id (name)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters.organizationId) {
      query = query.eq("organization_id", filters.organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error("Failed to fetch location memberships with details", { filters, error: err });
    throw err;
  }
}
/**
 * Fetch permissions for a given role ID.
 */
export async function fetchPermissionsByRoleId(roleId: string) {
  try {
    const { data, error } = await supabase
      .from("role_permissions")
      .select(
        `
        permission_id,
        permissions!inner(id, code, label)
      `,
      )
      .eq("role_id", roleId);
    if (error) throw error;
    return (data || []).map((rp: Record<string, unknown>) => {
      const perm = rp.permissions as Record<string, unknown>;
      return {
        id: perm.id as string,
        code: perm.code as string,
        label: perm.label as Record<string, string>,
      };
    });
  } catch (err) {
    log.error("Failed to fetch permissions by role", { roleId, error: err });
    return [];
  }
}

/**
 * Get the primary role code for a user within an organization.
 */
export async function fetchUserPrimaryRole(userId: string, organizationId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("fn_get_user_primary_role", {
      uid: userId,
      org_id: organizationId,
    });
    if (error) throw error;
    return data?.[0]?.role_code ?? null;
  } catch (err) {
    log.error("Failed to fetch user primary role", { userId, organizationId, error: err });
    return null;
  }
}

/**
 * Fetch a user's profile name and phone.
 */
export async function fetchProfileSummary(userId: string) {
  try {
    const { data, error } = await supabase.from("profiles").select("full_name, phone").eq("id", userId).single();
    if (error) throw error;
    return data;
  } catch (err) {
    log.error("Failed to fetch profile summary", { userId, error: err });
    return null;
  }
}

/** Fetch all profiles with their memberships (admin view). */
export async function fetchProfilesWithMemberships() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        *,
        memberships (
          id,
          organization_id,
          role_id,
          is_active,
          can_validate_user_requests,
          organizations (name),
          roles (code, label)
        )
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    log.error("Failed to fetch profiles with memberships", { error: err });
    throw err;
  }
}
