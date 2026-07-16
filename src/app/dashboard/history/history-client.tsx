'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sale, Category, PaymentMethod } from '@/types'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { todayAR, formatInAR, dateToAR } from '@/lib/date'
import { History, Banknote, Trash2, Lock, Loader2 } from 'lucide-react'
import { PAGE_SIZE } from './constants'
import Image from 'next/image'
import logo from '../../../../public/punto-fresco-logo.jpg'
import { createClient } from '@/lib/supabase/client'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

const CATEGORY_COLORS: Record<Category, string> = {
  verduleria: 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100',
  polleria: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-600 dark:text-yellow-50',
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
    const day = formatInAR(sale.created_at, 'yyyy-MM-dd')
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
  closedDates: Set<string>
  initialHasMore: boolean
}

export default function HistorialClient({ sales: initialSales, closedDates, initialHasMore }: Props) {
  const [sales, setSales] = useState(initialSales)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; date: string } | null>(null)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const groups = groupByDay(sales)

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || sales.length === 0) return
    setLoadingMore(true)
    const last = sales[sales.length - 1]
    const { data } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .lt('created_at', last.created_at)
      .limit(PAGE_SIZE)
    const rows = data ?? []
    setSales(prev => [...prev, ...rows])
    if (rows.length < PAGE_SIZE) setHasMore(false)
    setLoadingMore(false)
  }, [loadingMore, hasMore, sales, supabase])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMore])

  async function handleDelete(id: string, date: string) {
    if (closedDates.has(date)) return
    setDeletingId(id)
    await supabase.from('sales').delete().eq('id', id)
    setSales(prev => prev.filter(s => s.id !== id))
    setDeletingId(null)
    setDeleteTarget(null)
    router.refresh()
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <Image src={logo} alt="Punto Fresco" width={36} height={36} className="rounded-lg object-cover" />
        <h1 className="text-xl font-bold">Historial</h1>
      </div>
      <p className="text-sm text-muted-foreground/70 mb-6">Todas las ventas registradas, agrupadas por día.</p>

      {groups.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aún no hay ventas registradas.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ date, sales: daySales, total }) => {
            const isToday = date === todayAR()
            const label = isToday
              ? 'Hoy'
              : format(dateToAR(date), "EEEE d 'de' MMMM", { locale: es })

            const isClosed = closedDates.has(date)

            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-sm font-semibold capitalize text-muted-foreground flex items-center gap-1.5">
                    {isClosed && <Lock className="h-3.5 w-3.5" />}
                    {label}
                  </p>
                  <span className="text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 px-2.5 py-1 rounded-full">
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
                            {formatInAR(sale.created_at, 'HH:mm')}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="py-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-lg font-bold text-foreground">
                            ${sale.total.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                            {sale.product_name && sale.product_name !== 'Venta' && (
                              <span className="ml-1.5 font-normal text-sm text-muted-foreground">
                                ({sale.product_name})
                              </span>
                            )}
                          </p>
                          {!isClosed && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                              onClick={() => setDeleteTarget({ id: sale.id, date })}
                              disabled={deletingId === sale.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id, deleteTarget.date)}
              disabled={!!deletingId}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
