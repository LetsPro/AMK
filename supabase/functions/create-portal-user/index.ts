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

    if (!normalizedEmail || !password) {
      return ok({ error: "Email and password are required" });
    }

    if (String(password).length < 8) {
      return ok({ error: "Password must be at least 8 characters" });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (existing_user_id) {
      const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(
        existing_user_id,
        { email: normalizedEmail, password, email_confirm: true, user_metadata: { full_name: full_name ?? normalizedEmail, client_id: client_id ?? null } }
      );
      if (error) return ok({ error: error.message });
      await linkClient(supabaseAdmin, client_id, updated.user.id);
      return ok({ user_id: updated.user.id });
    }

    const existing = await findUserByEmail(supabaseAdmin, normalizedEmail);
    if (existing) {
      const { data: updated, error } = await supabaseAdmin.auth.admin.updateUserById(
        existing.id,
        { password, email_confirm: true, user_metadata: { ...(existing.user_metadata ?? {}), full_name: full_name ?? normalizedEmail, client_id: client_id ?? null } }
      );
      if (error) return ok({ error: error.message });
      await linkClient(supabaseAdmin, client_id, updated.user.id);
      return ok({ user_id: updated.user.id });
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? normalizedEmail, client_id: client_id ?? null, account_type: "client" },
    });

    if (createErr) return ok({ error: createErr.message });

    const userId = created.user.id;

    await linkClient(supabaseAdmin, client_id, userId);

    return ok({ user_id: userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return ok({ error: message || "Unable to create portal user" });
  }
});
