import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type DbTicket = Database['public']['Tables']['tickets']['Row'];
export type TicketStatus = Database['public']['Enums']['ticket_status'];
export type TicketPriority = Database['public']['Enums']['ticket_priority'];

export interface Ticket extends DbTicket {
  attachments: any[];
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
        // Escape special PostgREST characters to prevent injection
        const sanitized = filters.search
          .replace(/[\\%_]/g, c => `\\${c}`)  // escape wildcards
          .replace(/[,()]/g, '')               // strip PostgREST operators
          .trim()
          .slice(0, 200);                      // limit length
        if (sanitized) {
          query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
        }
      }

      // Organization filtering
      // IMPORTANT: QR-created tickets can have building_id NULL; in that case the org is stored in meta.organization_id.
      if (filters.organizationId) {
        const { data: orgBuildings } = await supabase
          .from('buildings')
          .select('id')
          .eq('organization_id', filters.organizationId);

        const buildingIds = (orgBuildings || []).map(b => b.id);

        if (buildingIds.length > 0) {
          // Include tickets for the organization's buildings OR QR tickets tagged with the organization in meta
          // PostgREST filter syntax supports JSON path access via ->>
          query = query.or(
            `building_id.in.(${buildingIds.join(',')}),and(source.eq.qr_code,meta->>organization_id.eq.${filters.organizationId})`
          );
        } else {
          // No buildings for this organization: still include QR-created tickets for that organization
          query = query
            .eq('source', 'qr_code')
            // JSONB contains match (meta has organization_id as a string)
            .contains('meta', { organization_id: filters.organizationId });
        }
      }

      // Location filtering based on hierarchy
      if (filters.locationId) {
        // Use basic JSON filtering for location element_id
        query = query.contains('location', { element_id: filters.locationId });
      } else if (filters.groupId) {
        // Get all elements in this group
        const { data: groupElements } = await supabase
          .from('location_group_elements')
          .select('element_id')
          .eq('group_id', filters.groupId);
        
        if (groupElements?.length) {
          const elementIds = groupElements.map(ge => ge.element_id);
          // Create individual location filters for each element
          const ticketPromises = elementIds.map(elementId =>
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
        // Get all groups in this ensemble, then all elements in those groups
        const { data: ensembleGroups } = await supabase
          .from('location_ensemble_groups')
          .select('group_id')
          .eq('ensemble_id', filters.ensembleId);
        
        if (ensembleGroups?.length) {
          const groupIds = ensembleGroups.map(eg => eg.group_id);
          const { data: groupElements } = await supabase
            .from('location_group_elements')
            .select('element_id')
            .in('group_id', groupIds);
          
          if (groupElements?.length) {
            const elementIds = groupElements.map(ge => ge.element_id);
            const ticketPromises = elementIds.map(elementId =>
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
      const transformedData = (data || []).map(ticket => ({
        ...ticket,
        attachments: Array.isArray(ticket.attachments) ? ticket.attachments : 
                    (typeof ticket.attachments === 'string' ? JSON.parse(ticket.attachments) : [])
      }));

      setTickets(transformedData);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  const createTicket = async (ticketData: Database['public']['Tables']['tickets']['Insert']) => {
    const { data, error: createError } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (createError) throw createError;
    
    // Refresh tickets list
    await loadTickets();
    return data;
  };

  const updateTicket = async (id: string, updates: Database['public']['Tables']['tickets']['Update']) => {
    const { data, error: updateError } = await supabase
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // Refresh tickets list
    await loadTickets();
    return data;
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

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('ticket_activities')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        // Transform metadata to any type
        const transformedData = (data || []).map(activity => ({
          ...activity,
          metadata: activity.metadata || {}
        }));

        setActivities(transformedData);
      } catch (err) {
        console.error('Error loading ticket activities:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des activités');
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      loadActivities();
    }
  }, [ticketId]);

  const addActivity = async (activity: Database['public']['Tables']['ticket_activities']['Insert']) => {
    const activityData = { ...activity, ticket_id: ticketId };
    const { data, error: createError } = await supabase
      .from('ticket_activities')
      .insert(activityData)
      .select()
      .single();

    if (createError) throw createError;
    
    // Transform and add to activities
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
    addActivity
  };
}