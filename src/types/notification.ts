/**
 * /src/types/notification.ts
 *
 * Notification types.
 * Replaces inline definitions in:
 *   services/notifications/index.ts,
 *   services/tickets/notifications.ts
 */

export type NotificationType =
  | 'welcome'
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_assigned'
  | 'ticket_resolved'
  | 'custom';

export type NotificationChannel = 'email' | 'sms' | 'push';

export type EmailTemplate = 'welcome' | 'notification' | 'ticket' | 'reply';

export interface SendEmailParams {
  template: EmailTemplate;
  to: string[];
  data: Record<string, unknown>;
  from?: string;
  replyTo?: string;
}
