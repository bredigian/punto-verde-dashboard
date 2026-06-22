import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'
import { todayAR } from '@/lib/date'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = todayAR()

  // Argentina is UTC-3, so the local day starts at UTC 03:00 and ends at next day UTC 03:00
  const start = `${today}T03:00:00.000Z`
  const nextDay = new Date(`${today}T03:00:00.000Z`)
  nextDay.setDate(nextDay.getDate() + 1)
  const end = nextDay.toISOString()

  const [{ data: sales }, { data: expenses }, { data: closing }] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false }),
    supabase
      .from('expenses')
      .select('*')
      .gte('created_at', start)
      .lt('created_at', end)
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
