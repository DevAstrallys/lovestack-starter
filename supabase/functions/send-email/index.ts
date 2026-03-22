import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

// Templates
import { WelcomeEmail } from './_templates/welcome.tsx';
import { NotificationEmail } from './_templates/notification.tsx';
import { TicketEmail } from './_templates/ticket.tsx';
import { ReplyEmail } from './_templates/reply.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  template: 'welcome' | 'notification' | 'ticket' | 'reply';
  to: string[];
  data: any;
  from?: string;
  replyTo?: string;
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

/**
 * Authenticate the caller: accepts either a valid JWT (user)
 * or a service-role key (internal edge-function-to-edge-function calls).
 */
async function authenticateCaller(req: Request): Promise<{ authenticated: boolean; userId?: string; isServiceRole?: boolean }> {
  // Check for service-role key (internal calls from notification-engine)
  const apiKey = req.headers.get('apikey') || req.headers.get('x-supabase-service-role');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (apiKey && serviceRoleKey && apiKey === serviceRoleKey) {
    return { authenticated: true, isServiceRole: true };
  }

  // Check for user JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    return { authenticated: false };
  }

  return { authenticated: true, userId: data.user.id };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTH CHECK ---
    const auth = await authenticateCaller(req);
    if (!auth.authenticated) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { template, to, data, from = 'Votre App <onboarding@resend.dev>', replyTo }: EmailRequest = await req.json();

    let html: string;
    let subject: string;

    switch (template) {
      case 'welcome':
        html = await renderAsync(React.createElement(WelcomeEmail, data));
        subject = `Bienvenue ${data.name} !`;
        break;
      case 'notification':
        html = await renderAsync(React.createElement(NotificationEmail, data));
        subject = data.subject || 'Nouvelle notification';
        break;
      case 'ticket':
        html = await renderAsync(React.createElement(TicketEmail, data));
        subject = `Ticket #${data.ticketNumber} - ${data.status}`;
        break;
      case 'reply':
        html = await renderAsync(React.createElement(ReplyEmail, data));
        subject = `Re: ${data.ticketTitle}`;
        break;
      default:
        throw new Error(`Template non supporté: ${template}`);
    }

    const sendOptions: any = { from, to, subject, html };
    if (replyTo) sendOptions.reply_to = replyTo;

    const { data: emailData, error } = await resend.emails.send(sendOptions);

    if (error) {
      console.error('Erreur Resend:', error);
      throw error;
    }

    // Log to outbox
    await supabaseAdmin.from('channels_outbox').insert({
      channel: 'email',
      to_ref: { emails: to },
      subject,
      body: html,
      status: 'sent',
      sent_at: new Date().toISOString(),
      payload: { template, data, email_id: emailData.id }
    });

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailData.id,
      message: 'Email envoyé avec succès'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Erreur dans send-email function:', error);
    
    try {
      await supabaseAdmin.from('channels_outbox').insert({
        channel: 'email',
        to_ref: { emails: [] },
        status: 'error',
        error: error.message,
        payload: { error: error.message }
      });
    } catch (logError) {
      console.error('Erreur de logging:', logError);
    }

    return new Response(
      JSON.stringify({ error: 'Failed to send email', success: false }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
