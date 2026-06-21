import { createClient } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: sales }, { data: expenses }, { data: closing }] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false }),
    supabase
      .from('expenses')
      .select('*')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
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
