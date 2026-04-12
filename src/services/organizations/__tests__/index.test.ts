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

import { fetchAllOrganizations, fetchActiveOrganizations, updateOrganization } from '../index';

describe('organizations service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAllOrganizations', () => {
    it('retourne les organisations triées par date', async () => {
      const mockOrgs = [
        { id: 'org-1', name: 'Org A', is_active: true, created_at: '2026-01-01' },
        { id: 'org-2', name: 'Org B', is_active: true, created_at: '2025-06-01' },
      ];
      mockSupabase.from.mockReturnValue(createChainMock({ data: mockOrgs, error: null }));

      const result = await fetchAllOrganizations();

      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
      expect(result).toEqual(mockOrgs);
    });

    it('retourne un tableau vide si data est null', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: null }));

      const result = await fetchAllOrganizations();

      expect(result).toEqual([]);
    });

    it('throw si supabase retourne une erreur', async () => {
      const dbError = { message: 'connection refused' };
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: dbError }));

      await expect(fetchAllOrganizations()).rejects.toEqual(dbError);
    });
  });

  describe('fetchActiveOrganizations', () => {
    it('retourne uniquement les orgs actives', async () => {
      const mockOrgs = [{ id: 'org-1', name: 'Active Org' }];
      mockSupabase.from.mockReturnValue(createChainMock({ data: mockOrgs, error: null }));

      const result = await fetchActiveOrganizations();

      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
      expect(result).toEqual(mockOrgs);
    });
  });

  describe('updateOrganization', () => {
    it('met à jour et retourne l\'org modifiée', async () => {
      const updated = { id: 'org-1', name: 'Updated' };
      mockSupabase.from.mockReturnValue(createChainMock({ data: updated, error: null }));

      const result = await updateOrganization('org-1', { name: 'Updated' });

      expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
      expect(result).toEqual(updated);
    });

    it('throw si update échoue', async () => {
      mockSupabase.from.mockReturnValue(createChainMock({ data: null, error: { message: 'update failed' } }));

      await expect(updateOrganization('org-1', { name: 'X' })).rejects.toEqual({ message: 'update failed' });
    });
  });
});
