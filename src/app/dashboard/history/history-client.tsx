'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sale, Category, PaymentMethod } from '@/types'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { History, Banknote, Trash2 } from 'lucide-react'
import Image from 'next/image'
import logo from '../../../../public/punto-fresco-logo.jpg'
import { createClient } from '@/lib/supabase/client'

const CATEGORY_COLORS: Record<Category, string> = {
  verduleria: 'bg-green-100 text-green-700',
  polleria: 'bg-yellow-100 text-yellow-700',
}

const CATEGORY_LABELS: Record<Category, string> = {
  verduleria: 'Verdulería',
  polleria: 'Pollería',
}

interface DayGroup {
  date: string
  sales: Sale[]
  total: number
}

function groupByDay(sales: Sale[]): DayGroup[] {
  const map = new Map<string, Sale[]>()
  for (const sale of sales) {
    const day = sale.created_at.slice(0, 10)
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(sale)
  }
  return Array.from(map.entries()).map(([date, sales]) => ({
    date,
    sales,
    total: sales.reduce((sum, s) => sum + s.total, 0),
  }))
}

interface Props {
  sales: Sale[]
}

export default function HistorialClient({ sales: initialSales }: Props) {
  const [sales, setSales] = useState(initialSales)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const groups = groupByDay(sales)

  async function handleDelete(id: string) {
    setDeletingId(id)
    await supabase.from('sales').delete().eq('id', id)
    setSales(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Image src={logo} alt="Punto Fresco" width={36} height={36} className="rounded-lg object-cover" />
        <h1 className="text-xl font-bold">Historial</h1>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aún no hay ventas registradas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ date, sales: daySales, total }) => {
            const parsed = parseISO(date)
            const isToday = date === new Date().toISOString().slice(0, 10)
            const label = isToday
              ? 'Hoy'
              : format(parsed, "EEEE d 'de' MMMM", { locale: es })

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-sm font-semibold capitalize text-muted-foreground">{label}</p>
                  <span className="text-sm font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                    ${total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="space-y-3">
                  {daySales.map((sale) => (
                    <Card key={sale.id}>
                      <CardHeader className="pb-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            {sale.payment_method === 'efectivo'
                              ? <Banknote className="h-3.5 w-3.5" />
                              : <img src="/mercado-pago-logo.svg" alt="MP" className="h-3.5 w-3.5" />
                            }
                            {sale.payment_method === 'efectivo' ? 'Efectivo' : 'Mercado Pago'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(sale.created_at), 'HH:mm')}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-lg font-bold text-green-700">
                            ${sale.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                            {sale.product_name && sale.product_name !== 'Venta' && (
                              <span className="ml-1.5 font-normal text-sm text-muted-foreground">
                                ({sale.product_name})
                              </span>
                            )}
                          </p>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                            onClick={() => handleDelete(sale.id)}
                            disabled={deletingId === sale.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                      <CardFooter className="py-2">
                        <Badge variant="secondary" className={`text-xs ${CATEGORY_COLORS[sale.category]}`}>
                          {CATEGORY_LABELS[sale.category]}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
