import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mocks are available when vi.mock factory runs
const { mockFrom, mockSelect, mockInsert, mockUpdate, mockEq, mockIn, mockOrder, mockRange, mockSingle } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockEq: vi.fn(),
  mockIn: vi.fn(),
  mockOrder: vi.fn(),
  mockRange: vi.fn(),
  mockSingle: vi.fn(),
}));

function chainable(resolveWith: Record<string, unknown> = { data: [], error: null, count: 0 }) {
  const chain: Record<string, any> = {};
  const methods = ['select', 'insert', 'update', 'eq', 'in', 'or', 'gte', 'lte', 'contains', 'order', 'range', 'single', 'maybeSingle', 'delete'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.range = mockRange.mockImplementation(() => Promise.resolve(resolveWith));
  chain.single = mockSingle.mockImplementation(() => Promise.resolve(resolveWith));
  chain.maybeSingle = vi.fn().mockImplementation(() => Promise.resolve(resolveWith));
  chain.select = mockSelect.mockReturnValue(chain);
  chain.insert = mockInsert.mockReturnValue(chain);
  chain.update = mockUpdate.mockReturnValue(chain);
  chain.eq = mockEq.mockReturnValue(chain);
  chain.in = mockIn.mockReturnValue(chain);
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
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.png' } }),
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

import { fetchFilteredTickets, createTicket, updateTicket } from '../index';

describe('tickets service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchFilteredTickets', () => {
    it('returns data and count with empty filters', async () => {
      const mockData = [
        { id: '1', title: 'Ticket 1', status: 'open' },
        { id: '2', title: 'Ticket 2', status: 'closed' },
      ];
      const chain = chainable({ data: mockData, error: null, count: 2 });
      mockFrom.mockReturnValue(chain);

      const result = await fetchFilteredTickets({});

      expect(mockFrom).toHaveBeenCalledWith('tickets');
      expect(result.data).toEqual(mockData);
      expect(result.count).toBe(2);
    });

    it('applies status filter via .in()', async () => {
      const chain = chainable({ data: [], error: null, count: 0 });
      mockFrom.mockReturnValue(chain);

      await fetchFilteredTickets({ status: ['open', 'in_progress'] as any });

      expect(mockIn).toHaveBeenCalledWith('status', ['open', 'in_progress']);
    });

    it('returns empty when ticketIdWhitelist is empty', async () => {
      const result = await fetchFilteredTickets({ ticketIdWhitelist: [] });

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('createTicket', () => {
    it('calls insert and returns created ticket', async () => {
      const newTicket = { title: 'New ticket', description: 'desc', status: 'open' as const };
      const createdTicket = { id: 'new-id', ...newTicket };
      const chain = chainable({ data: createdTicket, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await createTicket(newTicket as any);

      expect(mockFrom).toHaveBeenCalledWith('tickets');
      expect(mockInsert).toHaveBeenCalledWith(newTicket);
      expect(result).toEqual(createdTicket);
    });

    it('throws on supabase error', async () => {
      const chain = chainable({ data: null, error: { message: 'insert failed' } });
      mockFrom.mockReturnValue(chain);

      await expect(createTicket({ title: 'fail' } as any)).rejects.toEqual({ message: 'insert failed' });
    });
  });

  describe('updateTicket', () => {
    it('calls update with correct id and fields', async () => {
      const updates = { status: 'resolved' as const };
      const updatedTicket = [{ id: 'ticket-1', status: 'resolved' }];
      // updateTicket uses .select() (no .single()), which is thenable
      const chain = chainable({ data: updatedTicket, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await updateTicket('ticket-1', updates);

      expect(mockFrom).toHaveBeenCalledWith('tickets');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('id', 'ticket-1');
    });
  });
});
