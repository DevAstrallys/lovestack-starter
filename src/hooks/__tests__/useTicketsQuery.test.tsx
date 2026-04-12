import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { useTicketsQuery, useCreateTicket, useUpdateTicket, useTicketActivitiesQuery, useAddActivity } from '../useTicketsQuery';

const mockFetchFilteredTickets = vi.fn();
const mockCreateTicket = vi.fn();
const mockUpdateTicket = vi.fn();
const mockFetchOrganizations = vi.fn();
const mockFetchTicketActivities = vi.fn();
const mockAddTicketActivity = vi.fn();
const mockFetchTicketIdsByElementIds = vi.fn();

vi.mock('@/services/tickets', () => ({
  fetchFilteredTickets: (...args: unknown[]) => mockFetchFilteredTickets(...args),
  createTicket: (...args: unknown[]) => mockCreateTicket(...args),
  updateTicket: (...args: unknown[]) => mockUpdateTicket(...args),
  fetchOrganizations: (...args: unknown[]) => mockFetchOrganizations(...args),
  fetchTicketActivities: (...args: unknown[]) => mockFetchTicketActivities(...args),
  addTicketActivity: (...args: unknown[]) => mockAddTicketActivity(...args),
  fetchTicketIdsByElementIds: (...args: unknown[]) => mockFetchTicketIdsByElementIds(...args),
}));

vi.mock('@/services/locations', () => ({
  fetchElementIdsByGroupId: vi.fn(),
  fetchElementIdsByEnsembleId: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useTicketsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne les tickets avec les filtres par défaut', async () => {
    mockFetchFilteredTickets.mockResolvedValue({
      data: [
        { id: 't1', title: 'Ticket 1', attachments: [], organization_id: null },
      ],
      count: 1,
    });

    const { result } = renderHook(() => useTicketsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.tickets).toHaveLength(1);
    expect(result.current.data?.tickets[0].id).toBe('t1');
    expect(result.current.data?.totalCount).toBe(1);
  });

  it('enrichit les tickets avec le nom de l\'organisation', async () => {
    mockFetchFilteredTickets.mockResolvedValue({
      data: [
        { id: 't2', title: 'Ticket 2', attachments: [], organization_id: 'org-1' },
      ],
      count: 1,
    });
    mockFetchOrganizations.mockResolvedValue([
      { id: 'org-1', name: 'Résidence Soleil' },
    ]);

    const { result } = renderHook(() => useTicketsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchOrganizations).toHaveBeenCalledWith(['org-1']);
    expect((result.current.data?.tickets[0] as unknown as Record<string, unknown>).organization_name).toBe('Résidence Soleil');
  });

  it('passe les filtres de statut au service', async () => {
    mockFetchFilteredTickets.mockResolvedValue({ data: [], count: 0 });

    const filters = { status: ['open' as const, 'in_progress' as const] };
    const { result } = renderHook(() => useTicketsQuery(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockFetchFilteredTickets).toHaveBeenCalledWith(
      expect.objectContaining({ status: ['open', 'in_progress'] }),
      0,
      20,
    );
  });

  it('parse les attachments JSON string', async () => {
    mockFetchFilteredTickets.mockResolvedValue({
      data: [
        {
          id: 't3',
          title: 'Ticket 3',
          attachments: JSON.stringify([{ name: 'photo.jpg', url: '/img', type: 'image', storagePath: '/s' }]),
          organization_id: null,
        },
      ],
      count: 1,
    });

    const { result } = renderHook(() => useTicketsQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.tickets[0].attachments).toHaveLength(1);
    expect(result.current.data?.tickets[0].attachments![0].name).toBe('photo.jpg');
  });
});

describe('useCreateTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle createTicket et invalide le cache', async () => {
    const created = { id: 'new-1', title: 'Nouveau ticket' };
    mockCreateTicket.mockResolvedValue(created);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreateTicket(), { wrapper });

    result.current.mutate({ title: 'Nouveau ticket', status: 'open' } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateTicket).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nouveau ticket' }),
    );
  });
});

describe('useUpdateTicket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appelle updateTicket avec l\'id et les updates', async () => {
    mockUpdateTicket.mockResolvedValue([{ id: 'u1', status: 'resolved' }]);

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUpdateTicket(), { wrapper });

    result.current.mutate({ id: 'u1', updates: { status: 'resolved' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdateTicket).toHaveBeenCalledWith('u1', { status: 'resolved' });
  });
});

describe('useTicketActivitiesQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne les activités d\'un ticket', async () => {
    mockFetchTicketActivities.mockResolvedValue([
      { id: 'a1', ticket_id: 't1', activity_type: 'comment', metadata: { from: 'user1' } },
    ]);

    const { result } = renderHook(() => useTicketActivitiesQuery('t1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].metadata?.from).toBe('user1');
  });

  it('ne fetch pas si ticketId est vide', () => {
    const { result } = renderHook(() => useTicketActivitiesQuery(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchTicketActivities).not.toHaveBeenCalled();
  });
});

describe('useAddActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ajoute une activité et invalide le cache', async () => {
    mockAddTicketActivity.mockResolvedValue({ id: 'a2', ticket_id: 't1', activity_type: 'note' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useAddActivity('t1'), { wrapper });

    result.current.mutate({ ticket_id: 't1', activity_type: 'note' } as never);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockAddTicketActivity).toHaveBeenCalledWith(
      expect.objectContaining({ ticket_id: 't1', activity_type: 'note' }),
    );
  });
});
