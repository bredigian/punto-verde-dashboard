import { createClient } from '@/lib/supabase/server'
import HistoryClient from './history-client'
import { PAGE_SIZE } from './constants'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const supabase = await createClient()

  const [{ data: sales }, { data: closings }] = await Promise.all([
    supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE),
    supabase.from('cash_closings').select('date'),
  ])

  const closedDates = new Set((closings ?? []).map(c => c.date))

  return (
    <HistoryClient
      sales={sales ?? []}
      closedDates={closedDates}
      initialHasMore={(sales ?? []).length === PAGE_SIZE}
    />
  )
}
