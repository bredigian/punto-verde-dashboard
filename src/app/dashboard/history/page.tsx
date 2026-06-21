import { createClient } from '@/lib/supabase/server'
import HistoryClient from './history-client'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })

  return <HistoryClient sales={sales ?? []} />
}
