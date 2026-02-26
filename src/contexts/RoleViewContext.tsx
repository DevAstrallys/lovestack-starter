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

export interface UserLocationMembership {
  id: string;
  role: Role;
  location_type: 'element' | 'group' | 'ensemble';
  location_id: string;
  location_name: string;
  organization_id: string;
}

interface RoleViewContextType {
  simulatedRole: Role | null;
  setSimulatedRole: (role: Role | null) => void;
  availableRoles: Role[];
  isSimulating: boolean;
  resetToActualRole: () => void;
  userMemberships: UserLocationMembership[];
  activeMembership: UserLocationMembership | null;
  setActiveMembership: (m: UserLocationMembership | null) => void;
}

const RoleViewContext = createContext<RoleViewContextType>({
  simulatedRole: null,
  setSimulatedRole: () => {},
  availableRoles: [],
  isSimulating: false,
  resetToActualRole: () => {},
  userMemberships: [],
  activeMembership: null,
  setActiveMembership: () => {},
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
  const [userMemberships, setUserMemberships] = useState<UserLocationMembership[]>([]);
  const [activeMembership, setActiveMembership] = useState<UserLocationMembership | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRolesAndMemberships = async () => {
      try {
        // Fetch all roles
        const { data: roles } = await supabase
          .from('roles')
          .select('id, code, label, parent_id, sort_order, is_platform_scope')
          .eq('is_active', true)
          .order('sort_order')
          .order('code');

        const typedRoles = (roles || []).map(role => ({
          ...role,
          label: role.label as { fr: string; en: string }
        }));
        setAvailableRoles(typedRoles);

        // Fetch user's location memberships with role and location details
        const { data: memberships } = await (supabase as any)
          .from('location_memberships')
          .select('id, role_id, element_id, group_id, ensemble_id, organization_id, roles(id, code, label, parent_id, sort_order, is_platform_scope)')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!memberships?.length) {
          setUserMemberships([]);
          return;
        }

        // Resolve location names
        const elementIds = memberships.filter((m: any) => m.element_id).map((m: any) => m.element_id);
        const groupIds = memberships.filter((m: any) => m.group_id).map((m: any) => m.group_id);
        const ensembleIds = memberships.filter((m: any) => m.ensemble_id).map((m: any) => m.ensemble_id);

        const [elemRes, grpRes, ensRes] = await Promise.all([
          elementIds.length ? supabase.from('location_elements').select('id, name').in('id', elementIds) : { data: [] },
          groupIds.length ? (supabase as any).from('location_groups').select('id, name').in('id', groupIds) : { data: [] },
          ensembleIds.length ? (supabase as any).from('location_ensembles').select('id, name').in('id', ensembleIds) : { data: [] },
        ]);

        const nameMap: Record<string, string> = {};
        (elemRes.data || []).forEach((e: any) => { nameMap[e.id] = e.name; });
        (grpRes.data || []).forEach((g: any) => { nameMap[g.id] = g.name; });
        (ensRes.data || []).forEach((e: any) => { nameMap[e.id] = e.name; });

        const resolved: UserLocationMembership[] = memberships.map((m: any) => {
          const locId = m.ensemble_id || m.group_id || m.element_id;
          const locType = m.ensemble_id ? 'ensemble' : m.group_id ? 'group' : 'element';
          return {
            id: m.id,
            role: { ...m.roles, label: m.roles.label as { fr: string; en: string } },
            location_type: locType,
            location_id: locId,
            location_name: nameMap[locId] || '—',
            organization_id: m.organization_id,
          };
        });

        setUserMemberships(resolved);
      } catch (error) {
        console.error('Error fetching roles/memberships:', error);
      }
    };

    fetchRolesAndMemberships();
  }, [user]);

  const resetToActualRole = () => {
    setSimulatedRole(null);
    setActiveMembership(null);
  };

  const isSimulating = simulatedRole !== null;

  const value = {
    simulatedRole,
    setSimulatedRole,
    availableRoles,
    isSimulating,
    resetToActualRole,
    userMemberships,
    activeMembership,
    setActiveMembership,
  };

  return (
    <RoleViewContext.Provider value={value}>
      {children}
    </RoleViewContext.Provider>
  );
};
