'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { dateToAR } from '@/lib/date'
import { Sale, Expense } from '@/types'
import { Button } from '@/components/ui/button'
import { CierreCajaDrawer } from '@/components/cierre-caja-drawer'

interface Props {
  /** Días pasados con actividad y sin cierre, del más antiguo al más reciente. */
  pendingDates: string[]
}

interface DayData {
  date: string
  sales: Sale[]
  expenses: Expense[]
}

export function PendingClosingBanner({ pendingDates }: Props) {
  const [loading, setLoading] = useState(false)
  const [dayData, setDayData] = useState<DayData | null>(null)
  const router = useRouter()
  const supabase = createClient()

  if (pendingDates.length === 0) return null

  // Siempre se cierra primero el más antiguo; al refrescar aparece el siguiente.
  const oldest = pendingDates[0]
  const label = format(dateToAR(oldest), "EEEE d 'de' MMMM", { locale: es })

  async function handleOpen() {
    setLoading(true)
    const start = `${oldest}T00:00:00-03:00`
    const end = `${oldest}T23:59:59.999999-03:00`
    const [{ data: sales }, { data: expenses }] = await Promise.all([
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
    ])
    setDayData({ date: oldest, sales: sales ?? [], expenses: expenses ?? [] })
    setLoading(false)
  }

  return (
    <>
      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300 rounded-lg px-3 py-2.5 mb-4">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {pendingDates.length === 1
              ? 'Caja sin cerrar'
              : `${pendingDates.length} días sin cerrar`}
          </p>
          <p className="text-xs capitalize truncate">{label}</p>
        </div>
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-white dark:text-black shrink-0"
          onClick={handleOpen}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cerrar'}
        </Button>
      </div>

      {dayData && (
        <CierreCajaDrawer
          key={dayData.date}
          open
          date={dayData.date}
          sales={dayData.sales}
          initialExpenses={dayData.expenses}
          initialClosing={null}
          onClose={() => setDayData(null)}
          onClosed={() => router.refresh()}
        />
      )}
    </>
  )
}
