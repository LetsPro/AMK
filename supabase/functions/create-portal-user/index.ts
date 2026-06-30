import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function ok(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, full_name, existing_user_id } = await req.json();

    if (!email || !password) {
      return ok({ error: "Email and password are required" });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (existing_user_id) {
      const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(
        existing_user_id,
        { email, password, email_confirm: true }
      );
      if (error) return ok({ error: error.message });
      return ok({ user_id: updated.user.id });
    }

    // Try to create new user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? email },
    });

    if (createErr) {
      // If email already registered, find and update that user
      if (createErr.message.includes("already") || createErr.message.includes("registered")) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existing = list?.users?.find((u) => u.email === email);
        if (existing) {
          const { data: updated, error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
            existing.id,
            { password, email_confirm: true }
          );
          if (updErr) return ok({ error: updErr.message });
          return ok({ user_id: updated.user.id });
        }
      }
      return ok({ error: createErr.message });
    }

    const userId = created.user.id;

    // Create profile row (ignore error — may already exist from trigger)
    await supabaseAdmin.from("profiles").upsert(
      { id: userId, full_name: full_name ?? email, email },
      { onConflict: "id", ignoreDuplicates: true }
    );

    return ok({ user_id: userId });
  } catch (err) {
    return ok({ error: String(err) });
  }
});
