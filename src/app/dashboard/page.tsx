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

  const [{ data: sales }, { data: expenses }, { data: closing }] = await Promise.all([
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
  ])

  return (
    <DashboardClient
      initialSales={sales ?? []}
      initialExpenses={expenses ?? []}
      initialClosing={closing ?? null}
    />
  )
}
