import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
  const oneHourAgo  = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString()

  // FR-303: Warning → Critical after 2 hours unacknowledged
  const { data: warnings } = await supabase.from('flags')
    .select('id, course_id, description')
    .eq('severity', 'warning')
    .eq('status', 'open')
    .lt('created_at', twoHoursAgo)

  if (warnings && warnings.length > 0) {
    for (const f of warnings) {
      await supabase.from('flags').update({
        severity: 'critical',
        escalated_from: 'warning',
        escalated_at: now.toISOString(),
        status: 'open',
      }).eq('id', f.id)
    }
  }

  // FR-303: Critical → Emergency after 1 hour unresolved
  const { data: criticals } = await supabase.from('flags')
    .select('id, course_id, description')
    .eq('severity', 'critical')
    .in('status', ['open', 'acknowledged'])
    .lt('created_at', oneHourAgo)

  if (criticals && criticals.length > 0) {
    for (const f of criticals) {
      await supabase.from('flags').update({
        severity: 'emergency',
        escalated_from: 'critical',
        escalated_at: now.toISOString(),
      }).eq('id', f.id)
    }

    // FR-304: Notify managers via email + SMS for emergency escalations
    const { data: managers } = await supabase.from('profiles')
      .select('id, full_name, phone, email')
      .in('role', ['super_admin', 'manager'])
      .eq('is_active', true)

    if (managers && managers.length > 0) {
      const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? ''
      const message = `🚨 EMERGENCY: ${criticals.length} flag(s) escalated to emergency level and require immediate action. Please check the dashboard now.`
      try {
        await fetch(`${appUrl}/api/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ managers, message, sms: true }),
        })
      } catch (e) {
        console.error('Notify failed:', e)
      }
    }
  }

  return new Response(
    JSON.stringify({
      escalated_warnings: warnings?.length ?? 0,
      escalated_criticals: criticals?.length ?? 0,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
