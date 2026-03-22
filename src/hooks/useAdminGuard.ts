import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkAdminAccess } from '@/services/users';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook:adminGuard');

interface AdminGuardResult {
  /** Still checking permissions */
  loading: boolean;
  /** User has at least one admin role */
  isAdmin: boolean;
  /** Specific admin role codes the user holds */
  roles: string[];
}

/**
 * Verifies the current user has admin-level access via memberships.
 * Returns loading state so the caller can show a spinner (no flash).
 */
export function useAdminGuard(): AdminGuardResult {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AdminGuardResult>({
    loading: true,
    isAdmin: false,
    roles: [],
  });

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setState({ loading: false, isAdmin: false, roles: [] });
      return;
    }

    let cancelled = false;

    checkAdminAccess(user.id).then((result) => {
      if (cancelled) return;
      log.info('Admin guard check', { userId: user.id, isAdmin: result.isAdmin });
      setState({ loading: false, ...result });
    });

    return () => { cancelled = true; };
  }, [user, authLoading]);

  return state;
}
