/**
 * Notifications service — invoke Supabase edge functions for emails/SMS.
 */
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const log = createLogger('service:notifications');

interface SendEmailParams {
  template: 'welcome' | 'notification' | 'ticket' | 'reply';
  to: string[];
  data: Record<string, unknown>;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });
    if (error) throw error;
    log.info('Email sent', { template: params.template, to: params.to });
    return data;
  } catch (err) {
    log.error('Email send failed', { template: params.template, error: err });
    throw err;
  }
}

export async function triggerNotification(params: {
  type: string;
  userIds: string[];
  data: Record<string, unknown>;
  channels?: ('email' | 'sms' | 'push')[];
}) {
  try {
    const { data, error } = await supabase.functions.invoke('notification-engine', {
      body: params,
    });
    if (error) throw error;
    log.info('Notification triggered', { type: params.type, userCount: params.userIds.length });
    return data;
  } catch (err) {
    log.error('Notification trigger failed', { type: params.type, error: err });
    throw err;
  }
}

/**
 * Send a test email (used by EmailTester admin component).
 */
export async function sendTestEmail(params: {
  template: string;
  to: string[];
  data: Record<string, unknown>;
}) {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });
    if (error) throw error;
    log.info('Test email sent', { template: params.template, to: params.to });
    return data;
  } catch (err) {
    log.error('Test email send failed', { error: err });
    throw err;
  }
}
