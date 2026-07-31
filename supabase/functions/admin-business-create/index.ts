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
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, error: 'Missing Supabase environment variables' }, 500)
  }

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const legal_name = typeof body.legal_name === 'string' ? body.legal_name.trim() : null
  const registration_no = typeof body.registration_no === 'string' ? body.registration_no.trim() : null
  const tax_id = typeof body.tax_id === 'string' ? body.tax_id.trim() : null
  const country = typeof body.country === 'string' && body.country ? body.country : 'MY'
  const currency = typeof body.currency === 'string' && body.currency ? body.currency : 'MYR'
  const active_tax_regime = typeof body.active_tax_regime === 'string' && body.active_tax_regime ? body.active_tax_regime : 'MY_SST_6'
  const business_type = typeof body.business_type === 'string' && body.business_type ? body.business_type : 'RETAIL'
  const address_line1 = typeof body.address_line1 === 'string' ? body.address_line1.trim() : null
  const address_line2 = typeof body.address_line2 === 'string' ? body.address_line2.trim() : null
  const city = typeof body.city === 'string' ? body.city.trim() : null
  const postal_code = typeof body.postal_code === 'string' ? body.postal_code.trim() : null
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null
  const email = typeof body.email === 'string' ? body.email.trim() : null
  const website = typeof body.website === 'string' ? body.website.trim() : null
  const owner_id = typeof body.owner_id === 'string' && body.owner_id ? body.owner_id : null

  if (!name) {
    return json({ ok: false, error: 'Business name is required' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let ownerId = owner_id
  if (!ownerId) {
    const { data: firstUser, error: userErr } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .maybeSingle()
    if (userErr || !firstUser) {
      return json({ ok: false, error: 'No owner user available to assign' }, 500)
    }
    ownerId = firstUser.id
  }

  const payload = {
    owner_id: ownerId,
    name,
    legal_name,
    registration_no,
    tax_id,
    country,
    currency,
    active_tax_regime,
    business_type,
    address_line1,
    address_line2,
    city,
    postal_code,
    phone,
    email,
    website,
  }

  const { data, error } = await supabase
    .from('businesses')
    .insert([payload])
    .select('*')
    .maybeSingle()

  if (error) {
    return json({ ok: false, error: error.message }, 500)
  }

  return json({ ok: true, business: data })
})
