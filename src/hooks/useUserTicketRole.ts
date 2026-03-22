/**
 * Hook to determine the current user's ticket-related permissions.
 * Uses fn_get_user_primary_role + simulated role to gate actions.
 */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useRoleView } from '@/contexts/RoleViewContext';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook:user-ticket-role');

// Roles that get full management access
const MANAGER_ROLES = ['admin_platform', 'super_admin', 'admin', 'admin_org', 'manager', 'gestionnaire', 'syndic'];
const PROVIDER_ROLES = ['prestataire', 'technicien_prestataire', 'technicien', 'maintenance'];
const RESIDENT_ROLES = ['locataire', 'proprietaire', 'proprietaire_bailleur'];

export interface TicketPermissions {
  /** Can see all org tickets (managers) */
  canViewAllOrgTickets: boolean;
  /** Can only see own tickets (residents) */
  canViewOwnOnly: boolean;
  /** Can only see assigned tickets (providers) */
  canViewAssignedOnly: boolean;
  /** Can change status, priority, assignment */
  canManageTicket: boolean;
  /** Can add private notes */
  canAddPrivateNote: boolean;
  /** Can mark as duplicate */
  canMarkDuplicate: boolean;
  /** Can use dispatcher */
  canDispatch: boolean;
  /** The resolved role code */
  roleCode: string | null;
  /** Loading state */
  loading: boolean;
}

export function useUserTicketRole(): TicketPermissions {
  const { user } = useAuth();
  const { selectedOrganization, isplatformAdmin } = useOrganization();
  const { simulatedRole, isSimulating } = useRoleView();
  const [dbRoleCode, setDbRoleCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user || !selectedOrganization) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc('fn_get_user_primary_role', {
          uid: user.id,
          org_id: selectedOrganization.id,
        });
        if (error) throw error;
        setDbRoleCode(data?.[0]?.role_code || null);
      } catch (err) {
        log.error('Failed to fetch user primary role', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [user?.id, selectedOrganization?.id]);

  const activeRoleCode = useMemo(() => {
    if (isSimulating && simulatedRole) return simulatedRole.code;
    if (isplatformAdmin) return 'admin_platform';
    return dbRoleCode;
  }, [isSimulating, simulatedRole, isplatformAdmin, dbRoleCode]);

  return useMemo(() => {
    const isManager = activeRoleCode ? MANAGER_ROLES.includes(activeRoleCode) : false;
    const isProvider = activeRoleCode ? PROVIDER_ROLES.includes(activeRoleCode) : false;
    const isResident = activeRoleCode ? RESIDENT_ROLES.includes(activeRoleCode) : false;

    return {
      canViewAllOrgTickets: isManager,
      canViewOwnOnly: isResident || (!isManager && !isProvider),
      canViewAssignedOnly: isProvider,
      canManageTicket: isManager,
      canAddPrivateNote: isManager,
      canMarkDuplicate: isManager,
      canDispatch: isManager,
      roleCode: activeRoleCode,
      loading,
    };
  }, [activeRoleCode, loading]);
}
