import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createChainMock } from '@/test/mocks/supabase';

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { fetchActiveRoles, toggleRolePermission, fetchLocationMemberships } from '../index';

describe('roles service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchActiveRoles', () => {
    it('retourne les rôles triés par sort_order', async () => {
      const mockRoles = [
        { id: '1', code: 'admin', sort_order: 1, is_active: true },
        { id: '2', code: 'user', sort_order: 10, is_active: true },
      ];
      mockSupabase.from.mockReturnValue(createChainMock({ data: mockRoles, error: null }));

      const result = await fetchActiveRoles();

      expect(mockSupabase.from).toHaveBeenCalledWith('roles');
      expect(result).toEqual(mockRoles);
    });

    it('retourne un tableau vide si data est null', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchActiveRoles();

      expect(result).toEqual([]);
    });

    it('throw si supabase retourne une erreur', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: { message: 'DB error' } }));

      await expect(fetchActiveRoles()).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('toggleRolePermission', () => {
    it('appelle delete quand exists=true', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: null }));

      await toggleRolePermission('role-1', 'perm-1', true);

      expect(mockSupabase.from).toHaveBeenCalledWith('role_permissions');
    });

    it('appelle insert quand exists=false', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: null }));

      await toggleRolePermission('role-1', 'perm-1', false);

      expect(mockSupabase.from).toHaveBeenCalledWith('role_permissions');
    });

    it('throw si suppression échoue', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: { message: 'delete failed' } }));

      await expect(toggleRolePermission('role-1', 'perm-1', true)).rejects.toEqual({ message: 'delete failed' });
    });
  });

  describe('fetchLocationMemberships', () => {
    it('retourne les memberships avec filtre userId', async () => {
      const mockData = [
        { id: 'lm-1', user_id: 'u1', role_id: 'r1', roles: { code: 'admin' } },
      ];
      mockSupabase.from.mockReturnValue(createChainMock({ data: mockData, error: null }));

      const result = await fetchLocationMemberships({ userId: 'u1' });

      expect(mockSupabase.from).toHaveBeenCalledWith('location_memberships');
      expect(result).toEqual(mockData);
    });

    it('retourne un tableau vide sans filtre', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: [], error: null }));

      const result = await fetchLocationMemberships();

      expect(result).toEqual([]);
    });

    it('throw si erreur supabase', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: { message: 'access denied' } }));

      await expect(fetchLocationMemberships({ userId: 'u1' })).rejects.toEqual({ message: 'access denied' });
    });
  });
});
