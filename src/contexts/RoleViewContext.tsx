import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Role {
  id: string;
  code: string;
  label: { fr: string; en: string };
  parent_id: string | null;
  sort_order: number;
  is_platform_scope: boolean;
}

interface RoleViewContextType {
  simulatedRole: Role | null;
  setSimulatedRole: (role: Role | null) => void;
  availableRoles: Role[];
  isSimulating: boolean;
  resetToActualRole: () => void;
}

const RoleViewContext = createContext<RoleViewContextType>({
  simulatedRole: null,
  setSimulatedRole: () => {},
  availableRoles: [],
  isSimulating: false,
  resetToActualRole: () => {},
});

export const useRoleView = () => {
  const context = useContext(RoleViewContext);
  if (!context) {
    throw new Error('useRoleView must be used within a RoleViewProvider');
  }
  return context;
};

export const RoleViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [simulatedRole, setSimulatedRole] = useState<Role | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!user) return;

      try {
        const { data: roles, error } = await supabase
          .from('roles')
          .select('id, code, label, parent_id, sort_order, is_platform_scope')
          .eq('is_active', true)
          .order('sort_order')
          .order('code');

        if (error) {
          console.error('Error fetching roles:', error);
          return;
        }

        const typedRoles = (roles || []).map(role => ({
          ...role,
          label: role.label as { fr: string; en: string }
        }));
        
        setAvailableRoles(typedRoles);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchRoles();
  }, [user]);

  const resetToActualRole = () => {
    setSimulatedRole(null);
  };

  const isSimulating = simulatedRole !== null;

  const value = {
    simulatedRole,
    setSimulatedRole,
    availableRoles,
    isSimulating,
    resetToActualRole,
  };

  return (
    <RoleViewContext.Provider value={value}>
      {children}
    </RoleViewContext.Provider>
  );
};