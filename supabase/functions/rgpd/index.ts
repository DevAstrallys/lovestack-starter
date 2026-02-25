import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token invalide' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { action } = await req.json();
    const userId = user.id;

    // ──────────────────────────────────────────
    // ACTION: export — RGPD data portability
    // ──────────────────────────────────────────
    if (action === 'export') {
      const [
        { data: profile },
        { data: memberships },
        { data: locationMemberships },
        { data: tickets },
        { data: activities },
        { data: notifPrefs },
      ] = await Promise.all([
        supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
        supabaseAdmin.from('memberships').select('*, roles(code, label)').eq('user_id', userId),
        supabaseAdmin.from('location_memberships').select('*').eq('user_id', userId),
        supabaseAdmin.from('tickets').select('id, title, description, status, priority, created_at, source, category_code, nature_code').eq('created_by', userId),
        supabaseAdmin.from('ticket_activities').select('id, activity_type, content, created_at').eq('actor_id', userId),
        supabaseAdmin.from('notifications_prefs').select('*').eq('user_id', userId).maybeSingle(),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: {
          id: userId,
          email: user.email,
          created_at: user.created_at,
        },
        profile,
        memberships,
        location_memberships: locationMemberships,
        tickets,
        ticket_activities: activities,
        notification_preferences: notifPrefs,
      };

      return new Response(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // ──────────────────────────────────────────
    // ACTION: delete — RGPD right to erasure
    // ──────────────────────────────────────────
    if (action === 'delete') {
      console.log(`RGPD deletion requested for user ${userId}`);

      // 1. Anonymise tickets created by user (keep tickets for business continuity)
      await supabaseAdmin
        .from('tickets')
        .update({
          created_by: null,
          reporter_name: null,
          reporter_email: null,
          reporter_phone: null,
        })
        .eq('created_by', userId);

      // 2. Anonymise ticket activities
      await supabaseAdmin
        .from('ticket_activities')
        .update({ actor_id: null })
        .eq('actor_id', userId);

      // 3. Delete notification preferences
      await supabaseAdmin
        .from('notifications_prefs')
        .delete()
        .eq('user_id', userId);

      // 4. Delete location memberships
      await supabaseAdmin
        .from('location_memberships')
        .delete()
        .eq('user_id', userId);

      // 5. Delete memberships
      await supabaseAdmin
        .from('memberships')
        .delete()
        .eq('user_id', userId);

      // 6. Delete profile
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      // 7. Delete auth user (cascades remaining FK references)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('Error deleting auth user:', deleteError);
        throw deleteError;
      }

      // 8. Audit log
      await supabaseAdmin.from('audit_logs').insert({
        action: 'rgpd_account_deleted',
        entity: 'user',
        entity_id: userId,
        data: { deleted_at: new Date().toISOString() },
      });

      console.log(`User ${userId} successfully deleted (RGPD)`);

      return new Response(JSON.stringify({ success: true, message: 'Compte supprimé avec succès' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Action inconnue' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('RGPD function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
