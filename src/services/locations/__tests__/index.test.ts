import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockUpdate, mockEq, mockSelect, mockOrder } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
  mockSelect: vi.fn(),
  mockOrder: vi.fn(),
}));

function chainable(resolveWith: Record<string, unknown> = { data: [], error: null }) {
  const chain: Record<string, any> = {};
  const methods = ['select', 'update', 'eq', 'in', 'or', 'order', 'delete', 'insert', 'single', 'maybeSingle'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.select = mockSelect.mockReturnValue(chain);
  chain.update = mockUpdate.mockReturnValue(chain);
  chain.eq = mockEq.mockReturnValue(chain);
  chain.order = mockOrder.mockReturnValue(chain);
  // Final resolution
  chain.then = (resolve: (v: unknown) => void) => resolve(resolveWith);
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    rpc: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      }),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { fetchOrganizationLocations, deactivateQRCodesForLocation } from '../index';

describe('locations service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOrganizationLocations', () => {
    it('returns elements, groups, and ensembles', async () => {
      const elements = [{ id: 'e1', name: 'Apt 1' }];
      const groups = [{ id: 'g1', name: 'Bât A' }];
      const ensembles = [{ id: 'en1', name: 'Résidence' }];

      let callIdx = 0;
      mockFrom.mockImplementation(() => {
        const datasets = [
          { data: elements, error: null },
          { data: groups, error: null },
          { data: ensembles, error: null },
        ];
        const result = datasets[callIdx % 3];
        callIdx++;
        return chainable(result);
      });

      const result = await fetchOrganizationLocations('org-1');

      expect(result.elements).toEqual(elements);
      expect(result.groups).toEqual(groups);
      expect(result.ensembles).toEqual(ensembles);
      expect(mockFrom).toHaveBeenCalledWith('location_elements');
      expect(mockFrom).toHaveBeenCalledWith('location_groups');
      expect(mockFrom).toHaveBeenCalledWith('location_ensembles');
    });
  });

  describe('deactivateQRCodesForLocation', () => {
    it('filters by location_element_id', async () => {
      const chain = chainable({ data: [{ id: 'qr1' }], error: null });
      mockFrom.mockReturnValue(chain);

      const count = await deactivateQRCodesForLocation({ location_element_id: 'el-1' });

      expect(mockFrom).toHaveBeenCalledWith('qr_codes');
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(mockEq).toHaveBeenCalledWith('location_element_id', 'el-1');
      expect(count).toBe(1);
    });

    it('returns 0 when no location target provided', async () => {
      const count = await deactivateQRCodesForLocation({});

      expect(count).toBe(0);
    });

    it('filters by location_group_id', async () => {
      const chain = chainable({ data: [{ id: 'qr1' }, { id: 'qr2' }], error: null });
      mockFrom.mockReturnValue(chain);

      const count = await deactivateQRCodesForLocation({ location_group_id: 'gr-1' });

      expect(mockEq).toHaveBeenCalledWith('location_group_id', 'gr-1');
      expect(count).toBe(2);
    });
  });
});
