import React from 'react';
import { useWhiteLabel } from '@/contexts/WhiteLabelContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Building2 } from 'lucide-react';

interface OrgLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export const OrgLogo: React.FC<OrgLogoProps> = ({ size = 'md', className = '' }) => {
  const { logoUrl } = useWhiteLabel();
  const { selectedOrganization } = useOrganization();

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={selectedOrganization?.name || 'Logo'}
        className={`${sizeMap[size]} rounded-md object-contain ${className}`}
      />
    );
  }

  // Fallback: icon + first letter
  const initial = selectedOrganization?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className={`${sizeMap[size]} rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg ${className}`}>
      {initial}
    </div>
  );
};
