/**
 * /src/hooks/useUserTicketRole.ts
 *
 * Hook to determine the current user's ticket-related permissions.
 * REFACTORED: uses services/users for RPC call instead of direct supabase.
 */
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRoleView } from "@/contexts/RoleViewContext";
import { fetchUserPrimaryRole } from "@/services/users";
import { createLogger } from "@/lib/logger";

const log = createLogger("hook:useUserTicketRole");

const MANAGER_ROLES = ["admin_platform", "super_admin", "admin", "admin_org", "manager", "gestionnaire", "syndic"];
const PROVIDER_ROLES = ["prestataire", "technicien_prestataire", "technicien", "maintenance"];
const RESIDENT_ROLES = ["locataire", "proprietaire", "proprietaire_bailleur"];

export interface TicketPermissions {
  canViewAllOrgTickets: boolean;
  canViewOwnOnly: boolean;
  canViewAssignedOnly: boolean;
  canManageTicket: boolean;
  canAddPrivateNote: boolean;
  canMarkDuplicate: boolean;
  canDispatch: boolean;
  roleCode: string | null;
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
        const roleCode = await fetchUserPrimaryRole(user.id, selectedOrganization.id);
        setDbRoleCode(roleCode);
      } catch (err) {
        log.error("Failed to fetch user primary role", { error: err });
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, [user?.id, selectedOrganization?.id]);

  const activeRoleCode = useMemo(() => {
    if (isSimulating && simulatedRole) return simulatedRole.code;
    if (isplatformAdmin) return "admin_platform";
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
