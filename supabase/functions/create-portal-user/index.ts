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

async function upsertClientProfile(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  fullName?: string
) {
  const payload = {
    id: userId,
    full_name: fullName || email.split("@")[0] || email,
    email,
    role_id: null,
    is_active: true,
  };

  const { error } = await supabaseAdmin.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) throw error;
}

async function linkClient(
  supabaseAdmin: ReturnType<typeof createClient>,
  clientId: string | undefined,
  userId: string
) {
  if (!clientId) return;
  const { error } = await supabaseAdmin.from("clients").update({ auth_user_id: userId }).eq("id", clientId);
  if (error) throw error;
}

async function findUserByEmail(supabaseAdmin: ReturnType<typeof createClient>, email: string) {
  const normalized = email.trim().toLowerCase();
  let page = 1;

  while (page <= 20) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item) => item.email?.toLowerCase() === normalized);
    if (user) return user;
    if (data.users.length < 1000) return null;
    page += 1;
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { email, password, full_name, existing_user_id, client_id } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const fullName = typeof full_name === "string" && full_name.trim() ? full_name.trim() : normalizedEmail;

    if (!normalizedEmail || !password) {
      return ok({ error: "Email and password are required" });
    }

    if (String(password).length < 8) {
      return ok({ error: "Password must be at least 8 characters" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return ok({ error: "Supabase function is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (existing_user_id) {
      const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(
        existing_user_id,
        { email: normalizedEmail, password, email_confirm: true, user_metadata: { full_name: fullName, client_id: client_id ?? null, account_type: "client" } }
      );
      if (error) return ok({ error: error.message });
      await upsertClientProfile(supabaseAdmin, updated.user.id, normalizedEmail, fullName);
      await linkClient(supabaseAdmin, client_id, updated.user.id);
      return ok({ user_id: updated.user.id });
    }

    const existing = await findUserByEmail(supabaseAdmin, normalizedEmail);
    if (existing) {
      const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        { password, email_confirm: true, user_metadata: { ...(existing.user_metadata ?? {}), full_name: fullName, client_id: client_id ?? null, account_type: "client" } }
      );
      if (error) return ok({ error: error.message });
      await upsertClientProfile(supabaseAdmin, updated.user.id, normalizedEmail, fullName);
      await linkClient(supabaseAdmin, client_id, updated.user.id);
      return ok({ user_id: updated.user.id });
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, client_id: client_id ?? null, account_type: "client" },
    });

    if (createErr) return ok({ error: createErr.message });

    const userId = created.user.id;

    await upsertClientProfile(supabaseAdmin, userId, normalizedEmail, fullName);
    await linkClient(supabaseAdmin, client_id, userId);

    return ok({ user_id: userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return ok({ error: message || "Unable to create portal user" });
  }
});
