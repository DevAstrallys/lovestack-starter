import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchActiveRoles, fetchLocationMemberships, fetchLocationNames } from '@/services/roles';
import { useAuth } from './AuthContext';
import { createLogger } from '@/lib/logger';

const log = createLogger('context:role-view');

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

interface MembershipRow {
  id: string;
  role_id: string;
  element_id: string | null;
  group_id: string | null;
  ensemble_id: string | null;
  organization_id: string;
  roles: {
    id: string;
    code: string;
    label: unknown;
    parent_id: string | null;
    sort_order: number;
    is_platform_scope: boolean;
  };
}

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
        const roles = await fetchActiveRoles();
        const typedRoles = (roles || []).map(role => ({
          ...role,
          sort_order: role.sort_order ?? 0,
          label: role.label as { fr: string; en: string }
        }));
        setAvailableRoles(typedRoles);

        const memberships = await fetchLocationMemberships({ userId: user.id });

        if (!memberships?.length) {
          setUserMemberships([]);
          return;
        }

        const typedMemberships = memberships as unknown as MembershipRow[];

        const elementIds = typedMemberships.filter(m => m.element_id).map(m => m.element_id as string);
        const groupIds = typedMemberships.filter(m => m.group_id).map(m => m.group_id as string);
        const ensembleIds = typedMemberships.filter(m => m.ensemble_id).map(m => m.ensemble_id as string);

        const nameMap = await fetchLocationNames({ elementIds, groupIds, ensembleIds });

        const resolved: UserLocationMembership[] = typedMemberships.map(m => {
          const locId = (m.ensemble_id || m.group_id || m.element_id) as string;
          const locType = m.ensemble_id ? 'ensemble' : m.group_id ? 'group' : 'element';
          return {
            id: m.id,
            role: { ...m.roles, sort_order: m.roles.sort_order ?? 0, label: m.roles.label as { fr: string; en: string } },
            location_type: locType,
            location_id: locId,
            location_name: nameMap[locId] || '—',
            organization_id: m.organization_id,
          };
        });

        setUserMemberships(resolved);
      } catch (error) {
        log.error('Error fetching roles/memberships', { error });
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