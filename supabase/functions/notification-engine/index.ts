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

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

/**
 * Authenticate: requires a valid user JWT.
 */
async function authenticateCaller(req: Request): Promise<{ authenticated: boolean; userId?: string }> {
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

    const { type, userIds, data, channels = ['email'], organizationId }: NotificationRequest = await req.json();

    // Récupérer les profils et préférences des utilisateurs
    const { data: profiles, error: profilesError } = await supabaseAdmin
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

      const templateData = {
        name: profile.full_name,
        organizationName: data.organizationName || "Votre App",
        ...data
      };

      if (shouldSendEmail) {
        try {
          // Resolve actual email from auth.users
          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
          if (userError || !userData?.user?.email) {
            console.error(`Could not resolve email for user ${profile.id}`);
            results.push({ userId: profile.id, channel: 'email', success: false, error: 'Email not found' });
            continue;
          }

          const emailTemplate = getEmailTemplate(type);
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              template: emailTemplate,
              to: [userData.user.email],
              data: templateData,
            }),
          });

          const emailResult = await emailResponse.json();

          results.push({
            userId: profile.id,
            channel: 'email',
            success: emailResult.success ?? false,
            error: emailResult.error,
          });
        } catch (emailError: any) {
          console.error(`Email send error for user ${profile.id}:`, emailError);
          results.push({
            userId: profile.id,
            channel: 'email',
            success: false,
            error: 'Email send failed',
          });
        }
      }

      // SMS and Push: not yet implemented, skipped silently
    }

    return new Response(JSON.stringify({
      success: true,
      processed: userIds.length,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Erreur dans notification-engine:', error);

    return new Response(JSON.stringify({
      error: 'Notification processing failed',
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
