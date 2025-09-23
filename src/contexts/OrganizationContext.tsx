import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isplatformAdmin, setIsplatformAdmin] = useState(false);

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
      const { data: memberships, error } = await supabase
        .from('memberships')
        .select(`
          id,
          roles!inner(code, is_platform_scope)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error checking platform admin:', error);
        return;
      }

      const isPlatformAdmin = memberships?.some(m => 
        m.roles && (m.roles.code === 'admin_platform' || m.roles.code === 'super_admin' || m.roles.is_platform_scope)
      ) || false;

      setIsplatformAdmin(isPlatformAdmin);
    } catch (error) {
      console.error('Error checking platform admin:', error);
    }
  };

  const loadOrganizations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Si c'est un admin plateforme, récupérer toutes les organisations
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error loading organizations:', error);
        return;
      }

      setOrganizations(data || []);
      
      // Sélectionner automatiquement la première organisation si aucune n'est sélectionnée
      if (data && data.length > 0 && !selectedOrganization) {
        setSelectedOrganization(data[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
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