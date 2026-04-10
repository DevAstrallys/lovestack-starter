/**
 * /src/types/user.ts
 *
 * User, profile, membership, role and permission types.
 * Replaces inline definitions in:
 *   contexts/RoleViewContext.tsx, hooks/useUserTicketRole.ts,
 *   hooks/useSimulatedPermissions.ts, components/admin/UsersManagement.tsx,
 *   components/admin/RolesPermissions.tsx, components/admin/PermissionsManager.tsx,
 *   components/admin/AccessSecurityManager.tsx, components/locations/InviteUserDialog.tsx,
 *   components/locations/LocationUsersManagement.tsx
 */

import type { Json } from '@/integrations/supabase/types';

// ── Profile ──────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  communication_mode: string | null;
  locale: string | null;
  created_at: string;
  updated_at: string;
}

// ── Role ─────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  code: string;
  label: string | Json;
  description: string | null;
  is_active: boolean;
  is_platform_scope: boolean;
  parent_id: string | null;
  sort_order: number | null;
  created_at: string;
}

// ── Permission ───────────────────────────────────────────────────────

export interface Permission {
  id: string;
  code: string;
  label: string | Json;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
}

// ── Membership (org-level) ───────────────────────────────────────────

export interface Membership {
  id: string;
  user_id: string;
  role_id: string;
  organization_id: string | null;
  company_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  can_validate_user_requests: boolean;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// ── Location Membership (location-scoped) ────────────────────────────

export interface LocationMembership {
  id: string;
  user_id: string;
  role_id: string;
  organization_id: string;
  ensemble_id: string | null;
  group_id: string | null;
  element_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Resolved membership (used in RoleViewContext) ────────────────────

export interface UserLocationMembership {
  id: string;
  role_code: string;
  role_label: string;
  location_id: string;
  location_name: string;
  location_type: 'ensemble' | 'group' | 'element';
}

// ── Notification preferences ─────────────────────────────────────────

export interface NotificationPrefs {
  user_id: string;
  email: boolean | null;
  sms: boolean | null;
  push: boolean | null;
  locale: string | null;
}
