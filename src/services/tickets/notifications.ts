/**
 * Ticket notification helpers — send alerts on status change.
 */
import { sendEmail } from '@/services/notifications';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:tickets:notifications');

interface StatusChangeNotificationParams {
  ticketId: string;
  ticketTitle: string;
  oldStatus: string;
  newStatus: string;
  reporterEmail?: string | null;
  reporterName?: string | null;
  communicationMode?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  waiting: 'En attente',
  resolved: 'Résolu',
  closed: 'Fermé',
};

export async function notifyStatusChange(params: StatusChangeNotificationParams) {
  const { ticketId, ticketTitle, oldStatus, newStatus, reporterEmail, reporterName, communicationMode } = params;

  // Only notify if we have email and it's email mode (or default)
  if (!reporterEmail || (communicationMode && communicationMode !== 'email')) {
    log.info('Skipping status notification — no email or non-email mode', {
      ticketId,
      communicationMode,
      hasEmail: !!reporterEmail,
    });
    return;
  }

  try {
    await sendEmail({
      template: 'notification',
      to: [reporterEmail],
      data: {
        recipientName: reporterName || 'Cher(e) résident(e)',
        title: `Mise à jour de votre demande`,
        message: `Le statut de votre signalement "${ticketTitle}" est passé de "${STATUS_LABELS[oldStatus] || oldStatus}" à "${STATUS_LABELS[newStatus] || newStatus}".`,
        ticketId,
        ticketTitle,
        oldStatus: STATUS_LABELS[oldStatus] || oldStatus,
        newStatus: STATUS_LABELS[newStatus] || newStatus,
      },
    });
    log.info('Status change notification sent', { ticketId, oldStatus, newStatus, to: reporterEmail });
  } catch (err) {
    log.error('Failed to send status change notification', { ticketId, error: err });
    // Don't throw — notification failure shouldn't block the status update
  }
}
