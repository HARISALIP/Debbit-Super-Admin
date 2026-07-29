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

  const days = Math.max(1, Math.min(14, Number(body.days) || 7))
  const dayLabels: string[] = []
  const start = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start)
    d.setDate(start.getDate() - i)
    dayLabels.push(d.toISOString().slice(0, 10))
  }
  const today = dayLabels[dayLabels.length - 1]

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [bizRes, wsRes, salesRes, supportRes] = await Promise.all([
    supabase.from('businesses').select('id', { count: 'exact', head: true }),
    supabase.from('workstation_devices').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase
      .from('sales')
      .select('sale_date, total')
      .eq('is_void', false)
      .gte('sale_date', dayLabels[0])
      .lte('sale_date', today),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  if (bizRes.error) return json({ ok: false, error: bizRes.error.message }, 500)
  if (wsRes.error) return json({ ok: false, error: wsRes.error.message }, 500)
  if (salesRes.error) return json({ ok: false, error: salesRes.error.message }, 500)
  if (supportRes.error) return json({ ok: false, error: supportRes.error.message }, 500)

  const salesData = (salesRes.data ?? []) as Array<{ sale_date: string; total: number }>
  const totals: Record<string, number> = Object.fromEntries(dayLabels.map((day) => [day, 0]))
  salesData.forEach((row) => {
    const key = row.sale_date
    if (typeof key === 'string' && key in totals) {
      totals[key] = (totals[key] || 0) + (Number(row.total) || 0)
    }
  })

  const chart = dayLabels.map((day) => ({ sale_date: day, total: totals[day] || 0 }))
  const recentSales = chart.reduce((sum, row) => sum + row.total, 0)
  const todayRevenue = chart[chart.length - 1]?.total || 0

  return json({
    ok: true,
    summary: {
      totalBusinesses: bizRes.count ?? 0,
      activeWorkstations: wsRes.count ?? 0,
      recentSales,
      openTickets: supportRes.count ?? 0,
    },
    chart,
    todayRevenue,
  })
})
