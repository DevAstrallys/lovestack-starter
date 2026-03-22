import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Loader2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

/**
 * Route wrapper that blocks non-admin users.
 * Shows a centered spinner while checking permissions — no white flash.
 */
export const ProtectedAdminRoute: React.FC<Props> = ({ children }) => {
  const { loading, isAdmin } = useAdminGuard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
