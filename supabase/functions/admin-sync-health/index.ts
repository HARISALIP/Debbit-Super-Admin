import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...CORS_HEADERS,
    },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, error: 'Missing Supabase environment variables' }, 500)
  }

  let body: { days?: number } = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const days = Math.max(7, Math.min(90, Number(body.days) || 30))
  const since = new Date(Date.now() - days * 86400000).toISOString()
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [wsRes, auditRes] = await Promise.all([
    supabase.from('workstation_devices').select('*').order('updated_at', { ascending: false }),
    supabase
      .from('workstation_audit_logs')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(150),
  ])

  if (wsRes.error) return json({ ok: false, error: wsRes.error.message }, 500)
  if (auditRes.error) return json({ ok: false, error: auditRes.error.message }, 500)

  return json({
    ok: true,
    workstations: wsRes.data ?? [],
    auditLogs: auditRes.data ?? [],
  })
})
