import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const { id, banned } = await req.json();

    if (!id) {
      throw new Error('Missing user ID');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');

    // Client con JWT del usuario → para obtener su perfil
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false }
      }
    );

    // Verificar que el usuario sea admin
    const {
      data: { user },
      error: userError
    } = await userClient.auth.getUser();

    if (userError || !user) throw new Error('Invalid user token');

    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) throw new Error('No se pudo obtener el perfil del usuario');
    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Client con Service Role → para actualizar auth.users
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    // Actualizar estado de ban en auth.users
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      id,
      { ban_duration: banned ? '87600h' : '0h' }
    );

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: corsHeaders }
    );
  }
});