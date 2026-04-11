/**
 * /src/hooks/useSimulatedPermissions.ts
 *
 * Hook for fetching permissions of a simulated role.
 * REFACTORED: uses services/users instead of direct supabase calls.
 */
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleView } from "@/contexts/RoleViewContext";
import { fetchPermissionsByRoleId } from "@/services/users";
import { createLogger } from "@/lib/logger";
import type { Permission } from "@/types";

const log = createLogger("hook:useSimulatedPermissions");

interface PermissionWithLabel extends Permission {
  label: { fr: string; en: string };
}

export const useSimulatedPermissions = () => {
  const { user } = useAuth();
  const { simulatedRole, isSimulating } = useRoleView();
  const [simulatedPermissions, setSimulatedPermissions] = useState<PermissionWithLabel[]>([]);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!isSimulating || !simulatedRole || !user) {
        setSimulatedPermissions([]);
        return;
      }

      try {
        const permissions = await fetchPermissionsByRoleId(simulatedRole.id);
        setSimulatedPermissions(
          permissions.map((p) => ({
            ...p,
            label: p.label as { fr: string; en: string },
          })),
        );
      } catch (err) {
        log.error("Error fetching simulated permissions", { roleId: simulatedRole.id, error: err });
      }
    };

    loadPermissions();
  }, [isSimulating, simulatedRole, user]);

  const hasSimulatedPermission = (permissionCode: string): boolean => {
    if (!isSimulating) return false;
    return simulatedPermissions.some((perm) => perm.code === permissionCode);
  };

  return {
    simulatedPermissions,
    hasSimulatedPermission,
    isSimulating,
  };
};
