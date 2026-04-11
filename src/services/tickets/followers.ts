/**
 * /src/services/tickets/followers.ts
 *
 * Ticket follower operations.
 * Absorbs direct supabase calls from:
 *   pages/TicketDetail.tsx (checkFollow, handleToggleFollow)
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:tickets:followers');

/**
 * Check if a user is following a ticket.
 */
export async function isFollowingTicket(
  ticketId: string,
  userId: string,
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('ticket_followers')
      .select('user_id')
      .eq('ticket_id', ticketId)
      .eq('user_id', userId)
      .maybeSingle();
    return !!data;
  } catch (err) {
    log.error('Failed to check follow status', { ticketId, userId, error: err });
    return false;
  }
}

/**
 * Follow a ticket.
 */
export async function followTicket(
  ticketId: string,
  userId: string,
): Promise<void> {
  try {
    await supabase
      .from('ticket_followers')
      .insert({ ticket_id: ticketId, user_id: userId });
    log.info('Ticket followed', { ticketId, userId });
  } catch (err) {
    log.error('Failed to follow ticket', { ticketId, userId, error: err });
    throw err;
  }
}

/**
 * Unfollow a ticket.
 */
export async function unfollowTicket(
  ticketId: string,
  userId: string,
): Promise<void> {
  try {
    await supabase
      .from('ticket_followers')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('user_id', userId);
    log.info('Ticket unfollowed', { ticketId, userId });
  } catch (err) {
    log.error('Failed to unfollow ticket', { ticketId, userId, error: err });
    throw err;
  }
}
