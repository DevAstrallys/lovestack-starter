import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock supabase ---
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();

function chainable(resolveWith: Record<string, unknown> = { data: [], error: null }) {
  const chain: Record<string, any> = {
    select: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveWith)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveWith)),
    then: (resolve: (v: unknown) => void) => resolve(resolveWith),
  };
  // Make each method return the chain
  for (const key of Object.keys(chain)) {
    if (key === 'then' || key === 'single' || key === 'maybeSingle') continue;
    chain[key] = vi.fn().mockReturnValue(chain);
  }
  // Wire outer refs
  chain.select = mockSelect.mockReturnValue(chain);
  chain.update = mockUpdate.mockReturnValue(chain);
  chain.eq = mockEq.mockReturnValue(chain);
  chain.order = mockOrder.mockReturnValue(chain);
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

      // 3 parallel calls to supabase.from()
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
      expect(mockFrom).not.toHaveBeenCalled();
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
