import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import {
  fetchTicketById,
  fetchTicketActivities,
  addTicketActivity as addTicketActivityService,
  fetchBuildings,
  fetchOrganizations,
  updateTicket as updateTicketService,
  createTicket as createTicketService,
} from '@/services/tickets';
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

      let query = supabase
        .from('tickets')
        .select('*', { count: 'exact' })
        .order('last_interaction_at', { ascending: false });

      // Apply filters
      if (filters.status?.length) {
        query = query.in('status', filters.status);
      }
      
      if (filters.priority?.length) {
        query = query.in('priority', filters.priority);
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters.objectId) {
        query = query.eq('object_id', filters.objectId);
      }

      if (filters.assignedTo) {
        query = query.eq('assigned_to', filters.assignedTo);
      }

      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      if (filters.lastInteractionDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - filters.lastInteractionDays);
        query = query.gte('last_interaction_at', cutoffDate.toISOString());
      }

      if (filters.search) {
        const sanitized = filters.search
          .replace(/[\\%_]/g, c => `\\${c}`)
          .replace(/[,()]/g, '')
          .trim()
          .slice(0, 200);
        if (sanitized) {
          query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }
      }

      // Organization filtering
      if (filters.organizationId) {
        const { data: orgBuildings } = await supabase
          .from('buildings')
          .select('id')
          .eq('organization_id', filters.organizationId);

        const buildingIds = (orgBuildings || []).map(b => b.id);

        if (buildingIds.length > 0) {
          query = query.or(
            `organization_id.eq.${filters.organizationId},building_id.in.(${buildingIds.join(',')})`
          );
        } else {
          query = query.eq('organization_id', filters.organizationId);
        }
      }

      // Location filtering based on hierarchy
      if (filters.locationId) {
        query = query.contains('location', { element_id: filters.locationId });
      } else if (filters.groupId) {
        const { data: groupElements } = await (supabase as any)
          .from('location_elements')
          .select('id')
          .eq('parent_id', filters.groupId);
        
        if (groupElements?.length) {
          const elementIds = groupElements.map((ge: any) => ge.id);
          const ticketPromises = elementIds.map((elementId: string) =>
            supabase
              .from('tickets')
              .select('id')
              .contains('location', { element_id: elementId })
          );
          
          const ticketResults = await Promise.all(ticketPromises);
          const allTicketIds = ticketResults
            .filter(result => !result.error)
            .flatMap(result => result.data?.map(t => t.id) || []);
          
          if (allTicketIds.length > 0) {
            query = query.in('id', allTicketIds);
          }
        }
      } else if (filters.ensembleId) {
        const { data: ensembleGroups } = await (supabase as any)
          .from('location_groups')
          .select('id')
          .eq('parent_id', filters.ensembleId);
        
        if (ensembleGroups?.length) {
          const groupIds = ensembleGroups.map((eg: any) => eg.id);
          const { data: groupElements } = await (supabase as any)
            .from('location_elements')
            .select('id')
            .in('parent_id', groupIds);
          
          if (groupElements?.length) {
            const elementIds = groupElements.map((ge: any) => ge.id);
            const ticketPromises = elementIds.map((elementId: string) =>
              supabase
                .from('tickets')
                .select('id')
                .contains('location', { element_id: elementId })
            );
            
            const ticketResults = await Promise.all(ticketPromises);
            const allTicketIds = ticketResults
              .filter(result => !result.error)
              .flatMap(result => result.data?.map(t => t.id) || []);
            
            if (allTicketIds.length > 0) {
              query = query.in('id', allTicketIds);
            }
          }
        }
      }

      // Pagination
      query = query.range(page * limit, (page + 1) * limit - 1);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Transform the data to match our Ticket interface
      const transformedData: Ticket[] = (data || []).map(ticket => ({
        ...ticket,
        attachments: Array.isArray(ticket.attachments) ? ticket.attachments : 
                    (typeof ticket.attachments === 'string' ? JSON.parse(ticket.attachments) : [])
      }));

      // Enrich with building names via service
      const buildingIds = [...new Set(transformedData.map(t => t.building_id).filter(Boolean))] as string[];
      if (buildingIds.length > 0) {
        const buildings = await fetchBuildings(buildingIds);
        
        if (buildings) {
          const buildingMap = Object.fromEntries(buildings.map(b => [b.id, b]));
          
          const orgIds = [...new Set(buildings.map(b => b.organization_id).filter(Boolean))] as string[];
          let orgMap: Record<string, string> = {};
          if (orgIds.length > 0) {
            const orgs = await fetchOrganizations(orgIds);
            if (orgs) orgMap = Object.fromEntries(orgs.map(o => [o.id, o.name]));
          }

          for (const t of transformedData) {
            if (t.building_id && buildingMap[t.building_id]) {
              t.building_name = buildingMap[t.building_id].name;
              const orgId = buildingMap[t.building_id].organization_id;
              if (orgId && orgMap[orgId]) t.organization_name = orgMap[orgId];
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
