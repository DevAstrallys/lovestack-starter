import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('@/services/tickets', () => ({
  fetchTicketById: vi.fn(),
  fetchOrganizations: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { useTicketQuery } from '../useTicketsQuery';
import { fetchTicketById, fetchOrganizations } from '@/services/tickets';

const mockFetchTicketById = fetchTicketById as ReturnType<typeof vi.fn>;
const mockFetchOrganizations = fetchOrganizations as ReturnType<typeof vi.fn>;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useTicketQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne un EnrichedTicket pour un ID valide', async () => {
    const mockTicket = {
      id: 't-1',
      title: 'Test ticket',
      status: 'open',
      organization_id: null,
      attachments: [],
      location: null,
      meta: null,
    };
    mockFetchTicketById.mockResolvedValue(mockTicket);

    const { result } = renderHook(() => useTicketQuery('t-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({ id: 't-1', title: 'Test ticket' });
    expect(mockFetchTicketById).toHaveBeenCalledWith('t-1');
  });

  it('ne lance pas d\'appel si id est undefined', () => {
    const { result } = renderHook(() => useTicketQuery(undefined), { wrapper: createWrapper() });

    expect(result.current.isFetching).toBe(false);
    expect(mockFetchTicketById).not.toHaveBeenCalled();
  });

  it('enrichit avec le nom de l\'organisation', async () => {
    const mockTicket = {
      id: 't-2',
      title: 'Ticket org',
      status: 'open',
      organization_id: 'org-1',
      attachments: [],
      location: null,
      meta: null,
    };
    mockFetchTicketById.mockResolvedValue(mockTicket);
    mockFetchOrganizations.mockResolvedValue([{ id: 'org-1', name: 'Mon Org' }]);

    const { result } = renderHook(() => useTicketQuery('t-2'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.organization_name).toBe('Mon Org');
    expect(mockFetchOrganizations).toHaveBeenCalledWith(['org-1']);
  });

  it('parse les attachments string en JSON', async () => {
    const attachments = [{ name: 'file.jpg', url: 'https://x.com/f.jpg', type: 'image/jpeg', storagePath: '/f.jpg' }];
    const mockTicket = {
      id: 't-3',
      title: 'Ticket attachments',
      status: 'open',
      organization_id: null,
      attachments: JSON.stringify(attachments),
      location: null,
      meta: null,
    };
    mockFetchTicketById.mockResolvedValue(mockTicket);

    const { result } = renderHook(() => useTicketQuery('t-3'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.attachments).toEqual(attachments);
  });
});
