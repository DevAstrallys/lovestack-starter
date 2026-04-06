import { useState, useEffect, useCallback } from 'react';
import { Database } from '@/integrations/supabase/types';
import {
  fetchTicketById,
  fetchTicketActivities,
  addTicketActivity as addTicketActivityService,
  fetchOrganizations,
  updateTicket as updateTicketService,
  createTicket as createTicketService,
  fetchFilteredTickets,
  fetchTicketIdsByElementIds,
  type TicketQueryFilters,
} from '@/services/tickets';
import {
  fetchElementIdsByGroupId,
  fetchElementIdsByEnsembleId,
} from '@/services/locations';
import { createLogger } from '@/lib/logger';

const log = createLogger('hook:tickets');

type DbTicket = Database['public']['Tables']['tickets']['Row'];
export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];

export interface Ticket extends DbTicket {
  attachments: any[];
  building_name?: string;
  organization_name?: string;
}

export interface TicketFilters {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  locationId?: string;
  groupId?: string;
  ensembleId?: string;
  categoryId?: string;
  objectId?: string;
  assignedTo?: string;
  createdBy?: string;
  organizationId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  lastInteractionDays?: number;
  search?: string;
}

type DbTicketActivity = Database['public']['Tables']['ticket_activities']['Row'];

export interface TicketActivity extends Omit<DbTicketActivity, 'metadata'> {
  metadata: any;
}

export function useTickets(filters: TicketFilters = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Serialize filters to avoid infinite re-renders when object reference changes
  const filtersKey = JSON.stringify(filters);

  const loadTickets = useCallback(async (page = 0, limit = 20) => {
    try {
      setLoading(true);
      setError(null);

      // Resolve location hierarchy into a ticket ID whitelist if needed
      let ticketIdWhitelist: string[] | undefined;

      if (filters.groupId) {
        const elementIds = await fetchElementIdsByGroupId(filters.groupId);
        if (elementIds.length > 0) {
          ticketIdWhitelist = await fetchTicketIdsByElementIds(elementIds);
          if (ticketIdWhitelist.length === 0) {
            setTickets([]);
            setTotalCount(0);
            return;
          }
        }
      } else if (filters.ensembleId) {
        const elementIds = await fetchElementIdsByEnsembleId(filters.ensembleId);
        if (elementIds.length > 0) {
          ticketIdWhitelist = await fetchTicketIdsByElementIds(elementIds);
          if (ticketIdWhitelist.length === 0) {
            setTickets([]);
            setTotalCount(0);
            return;
          }
        }
      }

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
        locationElementId: filters.locationId,
        ticketIdWhitelist,
      };

      const { data, count } = await fetchFilteredTickets(serviceFilters, page, limit);

      // Transform the data to match our Ticket interface
      const transformedData: Ticket[] = (data || []).map(ticket => ({
        ...ticket,
        attachments: Array.isArray(ticket.attachments) ? ticket.attachments : 
                    (typeof ticket.attachments === 'string' ? JSON.parse(ticket.attachments) : [])
      }));

      // Enrich with organization names via service
      const orgIdsFromTickets = [...new Set(transformedData.map(t => t.organization_id).filter(Boolean))] as string[];
      if (orgIdsFromTickets.length > 0) {
        const orgs = await fetchOrganizations(orgIdsFromTickets);
        if (orgs) {
          const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));
          for (const t of transformedData) {
            if (t.organization_id && orgMap[t.organization_id]) {
              t.organization_name = orgMap[t.organization_id];
            }
          }
        }
      }

      // Enrich remaining tickets with org name from organization_id or meta
      const missingOrgTickets = transformedData.filter(t => !t.organization_name && (t.organization_id || (t.meta as any)?.organization_id));
      const missingOrgIds = [...new Set(missingOrgTickets.map(t => t.organization_id || (t.meta as any)?.organization_id).filter(Boolean))] as string[];
      if (missingOrgIds.length > 0) {
        const orgs = await fetchOrganizations(missingOrgIds);
        if (orgs) {
          const orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));
          for (const t of missingOrgTickets) {
            const oid = t.organization_id || (t.meta as any)?.organization_id;
            if (oid && orgMap[oid]) t.organization_name = orgMap[oid];
          }
        }
      }

      setTickets(transformedData);
      setTotalCount(count || 0);
    } catch (err) {
      log.error('Error loading tickets', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const createTicket = async (ticketData: Database['public']['Tables']['tickets']['Insert']) => {
    const data = await createTicketService(ticketData);
    await loadTickets();
    return data;
  };

  const updateTicket = async (id: string, updates: Database['public']['Tables']['tickets']['Update']) => {
    // Optimistic update for instant UI feedback
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } as Ticket : t));

    const data = await updateTicketService(id, updates);

    if (!data || data.length === 0) {
      // RLS blocked the update – revert and inform
      await loadTickets();
      throw new Error('Mise à jour refusée (permissions insuffisantes)');
    }
    
    return data[0];
  };

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return {
    tickets,
    loading,
    error,
    totalCount,
    loadTickets,
    createTicket,
    updateTicket,
    refresh: () => loadTickets()
  };
}

export function useTicketActivities(ticketId: string) {
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!ticketId) return;
    try {
      setLoading(true);
      setError(null);

      const data = await fetchTicketActivities(ticketId);

      const transformedData = (data || []).map(activity => ({
        ...activity,
        metadata: activity.metadata || {}
      }));

      setActivities(transformedData);
    } catch (err) {
      log.error('Error loading ticket activities', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    if (ticketId) {
      loadActivities();
    }
  }, [ticketId, loadActivities]);

  const addActivity = async (activity: Database['public']['Tables']['ticket_activities']['Insert']) => {
    const activityData = { ...activity, ticket_id: ticketId };
    const data = await addTicketActivityService(activityData);
    
    const transformedActivity = {
      ...data,
      metadata: data.metadata || {}
    };
    
    setActivities(prev => [transformedActivity, ...prev]);
    return transformedActivity;
  };

  return {
    activities,
    loading,
    error,
    addActivity,
    refresh: loadActivities,
  };
}
