import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

// Templates
import { WelcomeEmail } from './_templates/welcome.tsx';
import { NotificationEmail } from './_templates/notification.tsx';
import { TicketEmail } from './_templates/ticket.tsx';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  template: 'welcome' | 'notification' | 'ticket';
  to: string[];
  data: any;
  from?: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, to, data, from = 'Votre App <onboarding@resend.dev>' }: EmailRequest = await req.json();

    console.log(`Sending ${template} email to:`, to);

    let html: string;
    let subject: string;

    // Render template based on type
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
      default:
        throw new Error(`Template non supporté: ${template}`);
    }

    // Send email
    const { data: emailData, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Erreur Resend:', error);
      throw error;
    }

    console.log('Email envoyé avec succès:', emailData);

    // Log to outbox
    await supabase.from('channels_outbox').insert({
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
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Erreur dans send-email function:', error);
    
    // Log error to outbox
    try {
      await supabase.from('channels_outbox').insert({
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
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});