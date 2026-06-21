import { createClient } from "@/lib/supabase/server"
import CierresClient from "./cierres-client"

export default async function CierresPage() {
  const supabase = await createClient()
  const { data: closings } = await supabase
    .from("cash_closings")
    .select("*")
    .order("date", { ascending: false })

  return <CierresClient closings={closings ?? []} />
}
