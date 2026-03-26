import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { professorId, fullName, email, phone } = await req.json();

    if (!professorId || !fullName || !email) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: professorId, fullName, email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if email already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Este email já está cadastrado" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user with default password "123456"
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: "123456",
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Set must_change_password on profile
    await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("user_id", userId);

    // Create student record linked to professor and auth user
    const { error: studentError } = await supabaseAdmin.from("students").insert({
      professor_id: professorId,
      full_name: fullName,
      email,
      phone: phone || null,
      user_id: userId,
      status: "active",
    });

    if (studentError) {
      // Rollback: delete created auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: studentError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
