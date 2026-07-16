import { createClient } from "@/lib/supabase/server"
import CierresClient from "./cierres-client"
import { PAGE_SIZE } from "./constants"
import { todayAR } from "@/lib/date"

export const dynamic = 'force-dynamic'

export default async function CierresPage() {
  const supabase = await createClient()

  const year = todayAR().slice(0, 4)

  const [{ data: closings }, { data: yearClosings }] = await Promise.all([
    // Paginated list
    supabase
      .from("cash_closings")
      .select("*")
      .order("date", { ascending: false })
      .limit(PAGE_SIZE),
    // Bounded set for the monthly/yearly summary cards (≤ 365 rows)
    supabase
      .from("cash_closings")
      .select("date,result,total_mercadopago")
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`),
  ])

  return (
    <CierresClient
      closings={closings ?? []}
      yearClosings={yearClosings ?? []}
      initialHasMore={(closings ?? []).length === PAGE_SIZE}
    />
  )
}
