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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');

    // Client con JWT del usuario → para obtener su perfil
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '', // usar anon para cliente usuario
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false }
      }
    );

    // Obtener datos del usuario actual
    const {
      data: { user },
      error: userError
    } = await userClient.auth.getUser();

    if (userError || !user) throw new Error('Invalid user token');

    // Obtener el perfil y verificar que sea admin
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

    // Client con Service Role → para hacer la query de admin
    const serverClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: { persistSession: false }
      }
    );

    const { data, error } = await serverClient
      .from('v_admin_users')
      .select('*');

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders
    });
  }
});
