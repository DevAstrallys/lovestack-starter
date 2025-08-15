import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleView } from '@/contexts/RoleViewContext';

interface Permission {
  code: string;
  label: { fr: string; en: string };
}

export const useSimulatedPermissions = () => {
  const { user } = useAuth();
  const { simulatedRole, isSimulating } = useRoleView();
  const [simulatedPermissions, setSimulatedPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    const fetchSimulatedPermissions = async () => {
      if (!isSimulating || !simulatedRole || !user) {
        setSimulatedPermissions([]);
        return;
      }

      try {
        const { data: permissions, error } = await supabase
          .from('role_permissions')
          .select(`
            permission_id,
            permissions!inner(code, label)
          `)
          .eq('role_id', simulatedRole.id);

        if (error) {
          console.error('Error fetching simulated permissions:', error);
          return;
        }

        const permissionsList = (permissions || []).map(rp => ({
          ...rp.permissions,
          label: rp.permissions.label as { fr: string; en: string }
        }));
        setSimulatedPermissions(permissionsList);
      } catch (error) {
        console.error('Error fetching simulated permissions:', error);
      }
    };

    fetchSimulatedPermissions();
  }, [isSimulating, simulatedRole, user]);

  const hasSimulatedPermission = (permissionCode: string): boolean => {
    if (!isSimulating) return false;
    return simulatedPermissions.some(perm => perm.code === permissionCode);
  };

  return {
    simulatedPermissions,
    hasSimulatedPermission,
    isSimulating,
  };
};