import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  organizationName?: string;
  loginUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const callerClient = createClient(supabaseUrl, serviceRoleKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await userClient.auth.getUser();

    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is admin
    const { data: memberships } = await callerClient
      .from("memberships")
      .select("id, roles!inner(code)")
      .eq("user_id", caller.id)
      .eq("is_active", true);

    const isAdmin = (memberships || []).some((m: any) =>
      ["admin_platform", "super_admin", "admin", "admin_org", "manager", "gestionnaire"].includes(m.roles?.code)
    );

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: CreateUserRequest = await req.json();
    if (!body.email || !body.password || !body.full_name) {
      return new Response(
        JSON.stringify({ error: "email, password and full_name are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create user via admin API
    const { data: newUser, error: createError } =
      await callerClient.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { full_name: body.full_name },
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send welcome email via send-email Edge Function
    try {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({
          to: [body.email],
          subject: `Bienvenue sur ${body.organizationName || "la plateforme"}`,
          template: "welcome",
          data: {
            name: body.full_name,
            organizationName: body.organizationName || "la plateforme",
            loginUrl: body.loginUrl || "#",
            email: body.email,
            password: body.password,
          },
        }),
      });

      if (!emailRes.ok) {
        console.error("Welcome email failed:", await emailRes.text());
      }
    } catch (emailErr) {
      console.error("Welcome email error:", emailErr);
    }

    return new Response(
      JSON.stringify({
        user: { id: newUser.user.id, email: newUser.user.email },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
