import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'
import { todayAR } from '@/lib/date'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = todayAR()

  // Explicit -03:00 offset so Postgres compares in AR timezone regardless of server TZ
  const start = `${today}T00:00:00-03:00`
  const end = `${today}T23:59:59.999999-03:00`

  const [{ data: sales }, { data: expenses }, { data: closing }, { data: pending, error: pendingError }] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: false }),
    supabase
      .from('expenses')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('created_at', { ascending: true }),
    supabase
      .from('cash_closings')
      .select('*')
      .eq('date', today)
      .maybeSingle(),
    // Días pasados con actividad y sin cierre (ver migrations/002_pending_closing_dates.sql)
    supabase.rpc('pending_closing_dates'),
  ])

  // Si la función todavía no existe en la DB, la home sigue andando sin el aviso.
  if (pendingError) console.error('pending_closing_dates failed:', pendingError.message)
  const pendingDates = ((pending ?? []) as { closing_date: string }[]).map(r => r.closing_date)

  return (
    <DashboardClient
      // key por fecha: al cambiar el día el cliente se remonta con estado limpio
      key={today}
      today={today}
      initialSales={sales ?? []}
      initialExpenses={expenses ?? []}
      initialClosing={closing ?? null}
      pendingDates={pendingDates}
    />
  )
}
