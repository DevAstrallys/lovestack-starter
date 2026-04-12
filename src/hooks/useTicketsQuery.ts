/**
 * /src/hooks/useTicketsQuery.ts
 *
 * React Query wrappers for ticket operations.
 * Coexists with useTickets.ts during migration — consumers can adopt gradually.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchFilteredTickets,
  fetchTicketActivities,
  addTicketActivity,
  updateTicket as updateTicketService,
  createTicket as createTicketService,
  fetchOrganizations,
  fetchTicketIdsByElementIds,
  type TicketQueryFilters,
} from '@/services/tickets';
import {
  fetchElementIdsByGroupId,
  fetchElementIdsByEnsembleId,
} from '@/services/locations';
import type {
  Ticket,
  TicketAttachment,
  TicketActivity,
  TicketActivityMeta,
  TicketFilters,
} from '@/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook:tickets-query');

const TICKETS_KEY = 'tickets';
const ACTIVITIES_KEY = 'ticket-activities';

// ── List tickets with filters + pagination ──────────────────────────

export function useTicketsQuery(filters: TicketFilters = {}, page = 0, limit = 20) {
  return useQuery({
    queryKey: [TICKETS_KEY, filters, page, limit],
    queryFn: async () => {
      // Resolve location hierarchy into a ticket ID whitelist if needed
      let ticketIdWhitelist: string[] | undefined;

      if (filters.ticketIdWhitelist) {
        ticketIdWhitelist = filters.ticketIdWhitelist;
      }

      // Build service-level filters
      const serviceFilters: TicketQueryFilters = {
        status: filters.status,
        priority: filters.priority,
        categoryId: filters.categoryId,
        objectId: filters.objectId,
        assignedTo: filters.assignedTo,
        createdBy: filters.createdBy,
        organizationId: filters.organizationId,
        dateRange: filters.dateRange,
        lastInteractionDays: filters.lastInteractionDays,
        search: filters.search,
        locationElementId: filters.locationElementId,
        ticketIdWhitelist,
      };

      const { data, count } = await fetchFilteredTickets(serviceFilters, page, limit);

      // Transform attachments
      const transformedData: Ticket[] = (data || []).map(ticket => ({
        ...ticket,
        attachments: Array.isArray(ticket.attachments)
          ? (ticket.attachments as unknown as TicketAttachment[])
          : typeof ticket.attachments === 'string'
            ? JSON.parse(ticket.attachments)
            : [],
      })) as Ticket[];

      // Enrich with organization names
      const orgIds = [
        ...new Set(
          transformedData.map(t => t.organization_id).filter(Boolean),
        ),
      ] as string[];

      if (orgIds.length > 0) {
        const orgs = await fetchOrganizations(orgIds);
        if (orgs) {
          const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));
          for (const t of transformedData) {
            if (t.organization_id && orgMap[t.organization_id]) {
              (t as Ticket & { organization_name?: string }).organization_name =
                orgMap[t.organization_id];
            }
          }
        }
      }

      log.info('Tickets loaded via React Query', { count: transformedData.length, page });
      return { tickets: transformedData, totalCount: count ?? 0 };
    },
    staleTime: 30_000,
  });
}

// ── Single ticket activities ────────────────────────────────────────

export function useTicketActivitiesQuery(ticketId: string) {
  return useQuery({
    queryKey: [ACTIVITIES_KEY, ticketId],
    queryFn: async () => {
      const data = await fetchTicketActivities(ticketId);
      return (data || []).map(activity => ({
        ...activity,
        metadata: (activity.metadata || {}) as TicketActivityMeta,
      })) as TicketActivity[];
    },
    enabled: !!ticketId,
  });
}

// ── Create ticket ───────────────────────────────────────────────────

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTicketService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}

// ── Update ticket ───────────────────────────────────────────────────

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      updateTicketService(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TICKETS_KEY] });
    },
  });
}

// ── Add activity ────────────────────────────────────────────────────

export function useAddActivity(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addTicketActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACTIVITIES_KEY, ticketId] });
    },
  });
}

// ── Resolve hierarchy helpers (for consumers that need pre-resolution) ──

export function useTicketIdsByGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['ticket-ids-by-group', groupId],
    queryFn: async () => {
      const elementIds = await fetchElementIdsByGroupId(groupId!);
      if (elementIds.length === 0) return [];
      return fetchTicketIdsByElementIds(elementIds);
    },
    enabled: !!groupId,
    staleTime: 60_000,
  });
}

export function useTicketIdsByEnsemble(ensembleId: string | undefined) {
  return useQuery({
    queryKey: ['ticket-ids-by-ensemble', ensembleId],
    queryFn: async () => {
      const elementIds = await fetchElementIdsByEnsembleId(ensembleId!);
      if (elementIds.length === 0) return [];
      return fetchTicketIdsByElementIds(elementIds);
    },
    enabled: !!ensembleId,
    staleTime: 60_000,
  });
}
