import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  type: 'welcome' | 'ticket_created' | 'ticket_updated' | 'custom';
  userIds: string[];
  data: any;
  channels?: ('email' | 'sms' | 'push')[];
  organizationId?: string;
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
    const { type, userIds, data, channels = ['email'], organizationId }: NotificationRequest = await req.json();

    console.log(`Processing ${type} notification for ${userIds.length} users`);

    // Récupérer les profils et préférences des utilisateurs
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        notifications_prefs (
          email,
          sms,
          push,
          locale
        )
      `)
      .in('id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    const results = [];

    for (const profile of profiles) {
      const prefs = profile.notifications_prefs;
      const shouldSendEmail = channels.includes('email') && prefs?.email;
      const shouldSendSms = channels.includes('sms') && prefs?.sms;
      const shouldSendPush = channels.includes('push') && prefs?.push;

      // Préparer les données pour les templates
      const templateData = {
        name: profile.full_name,
        organizationName: data.organizationName || "Votre App",
        ...data
      };

      // Envoyer email si demandé et autorisé
      if (shouldSendEmail) {
        try {
          const emailTemplate = getEmailTemplate(type);
          const emailResponse = await supabase.functions.invoke('send-email', {
            body: {
              template: emailTemplate,
              to: [profile.id], // Utiliser l'ID pour récupérer l'email via auth
              data: templateData
            }
          });

          if (emailResponse.error) {
            console.error(`Erreur envoi email pour ${profile.id}:`, emailResponse.error);
          } else {
            console.log(`Email envoyé à ${profile.id}`);
          }

          results.push({
            userId: profile.id,
            channel: 'email',
            success: !emailResponse.error,
            error: emailResponse.error?.message
          });
        } catch (emailError) {
          console.error(`Erreur email pour ${profile.id}:`, emailError);
          results.push({
            userId: profile.id,
            channel: 'email',
            success: false,
            error: emailError.message
          });
        }
      }

      // TODO: Implémenter SMS et Push notifications
      if (shouldSendSms) {
        console.log(`SMS notification pour ${profile.id} (à implémenter)`);
      }

      if (shouldSendPush) {
        console.log(`Push notification pour ${profile.id} (à implémenter)`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: userIds.length,
      results
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Erreur dans notification-engine:', error);

    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

function getEmailTemplate(type: string): string {
  switch (type) {
    case 'welcome':
      return 'welcome';
    case 'ticket_created':
    case 'ticket_updated':
      return 'ticket';
    case 'custom':
    default:
      return 'notification';
  }
}