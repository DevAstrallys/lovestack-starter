import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchActiveOrganizationsWithBranding, checkPlatformAdminStatus } from '@/services/organizations';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/lib/logger';

const log = createLogger('context:organization');

interface Organization {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface OrganizationContextType {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  setSelectedOrganization: (org: Organization | null) => void;
  loading: boolean;
  isplatformAdmin: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  selectedOrganization: null,
  setSelectedOrganization: () => {},
  loading: true,
  isplatformAdmin: false,
});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, _setSelectedOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isplatformAdmin, setIsplatformAdmin] = useState(false);
  const hasInitialized = React.useRef(false);

  const setSelectedOrganization = React.useCallback((org: Organization | null) => {
    hasInitialized.current = true;
    _setSelectedOrganization(org);
  }, []);
  
  useEffect(() => {
    if (user) {
      checkPlatformAdmin();
      loadOrganizations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkPlatformAdmin = async () => {
    if (!user) return;
    try {
      const isPlatformAdmin = await checkPlatformAdminStatus(user.id);
      setIsplatformAdmin(isPlatformAdmin);
    } catch (error) {
      log.error('Error checking platform admin', { error });
    }
  };

  const loadOrganizations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await fetchActiveOrganizationsWithBranding();
      setOrganizations(data || []);
      
      if (data && data.length > 0 && !hasInitialized.current) {
        setSelectedOrganization(data[0]);
      }
    } catch (error) {
      log.error('Error loading organizations', { error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <OrganizationContext.Provider 
      value={{ 
        organizations, 
        selectedOrganization, 
        setSelectedOrganization, 
        loading,
        isplatformAdmin
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};