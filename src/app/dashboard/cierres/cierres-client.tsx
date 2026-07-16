'use client'

import { useState, useEffect, useRef, useCallback, Fragment } from 'react'
import { CashClosing, Expense } from '@/types'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { todayAR, formatInAR, nowInAR, dateToAR } from '@/lib/date'
import { BookLock, Banknote, Receipt, TrendingUp, CalendarDays, Loader2 } from 'lucide-react'
import Image from 'next/image'
import logo from '../../../../public/punto-fresco-logo.jpg'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { PAGE_SIZE } from './constants'

type YearClosing = Pick<CashClosing, 'date' | 'result' | 'total_mercadopago'>

interface Props {
  closings: CashClosing[]
  yearClosings: YearClosing[]
  initialHasMore: boolean
}

export default function CierresClient({ closings: initialClosings, yearClosings, initialHasMore }: Props) {
  const now = nowInAR()
  const currentMonth = now.getFullYear() * 100 + (now.getMonth() + 1)
  const currentYear = now.getFullYear()

  const monthlyClosings = yearClosings.filter(c => {
    const d = dateToAR(c.date)
    return d.getFullYear() * 100 + (d.getMonth() + 1) === currentMonth
  })

  const monthlyResult = monthlyClosings.reduce((sum, c) => sum + c.result, 0)
  const yearlyResult = yearClosings.reduce((sum, c) => sum + c.result, 0)

  const monthlyMP = monthlyClosings.reduce((sum, c) => sum + (c.total_mercadopago ?? 0), 0)
  const yearlyMP = yearClosings.reduce((sum, c) => sum + (c.total_mercadopago ?? 0), 0)

  const [closings, setClosings] = useState(initialClosings)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const [selectedClosing, setSelectedClosing] = useState<CashClosing | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || closings.length === 0) return
    setLoadingMore(true)
    const last = closings[closings.length - 1]
    const { data } = await supabase
      .from('cash_closings')
      .select('*')
      .order('date', { ascending: false })
      .lt('date', last.date)
      .limit(PAGE_SIZE)
    const rows = data ?? []
    setClosings(prev => [...prev, ...rows])
    if (rows.length < PAGE_SIZE) setHasMore(false)
    setLoadingMore(false)
  }, [loadingMore, hasMore, closings, supabase])

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

  async function handleViewExpenses(closing: CashClosing) {
    setSelectedClosing(closing)
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('created_at', `${closing.date}T00:00:00-03:00`)
      .lte('created_at', `${closing.date}T23:59:59.999999-03:00`)
      .order('created_at', { ascending: true })
    setExpenses(data ?? [])
    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto p-4 pb-24">
      <div className="flex items-center gap-3 mb-2">
        <Image src={logo} alt="Punto Fresco" width={36} height={36} className="rounded-lg object-cover" />
        <h1 className="text-xl font-bold">Cierres de caja</h1>
      </div>
      <p className="text-sm text-muted-foreground/70 mb-4">Resumen de cada cierre con ventas, gastos y resultado neto.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {format(now, 'MMMM', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
            </span>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-[11px] text-muted-foreground">Neto</p>
            <p className={`text-xl font-bold ${monthlyResult >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              ${monthlyResult.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </p>
            <div className="mt-2 pt-2 border-t">
              <span className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1">
                <img src="/mercado-pago-logo.svg" alt="MP" className="h-3 w-3" />
                Mercado Pago
              </span>
              <p className="text-base font-semibold text-sky-700 dark:text-sky-300">
                ${monthlyMP.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {currentYear}
            </span>
          </CardHeader>
          <CardContent className="py-1">
            <p className="text-[11px] text-muted-foreground">Neto</p>
            <p className={`text-xl font-bold ${yearlyResult >= 0 ? 'text-foreground' : 'text-red-600'}`}>
              ${yearlyResult.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </p>
            <div className="mt-2 pt-2 border-t">
              <span className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1">
                <img src="/mercado-pago-logo.svg" alt="MP" className="h-3 w-3" />
                Mercado Pago
              </span>
              <p className="text-base font-semibold text-sky-700 dark:text-sky-300">
                ${yearlyMP.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {closings.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookLock className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aún no hay cierres registrados.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {closings.map((closing, index) => {
            const date = dateToAR(closing.date)
            const isToday = closing.date === todayAR()
            const label = isToday
              ? 'Hoy'
              : format(date, "EEEE d 'de' MMMM", { locale: es })
            const positivo = closing.result >= 0

            const monthKey = date.getFullYear() * 100 + date.getMonth()
            const prevDate = index > 0 ? dateToAR(closings[index - 1].date) : null
            const prevKey = prevDate ? prevDate.getFullYear() * 100 + prevDate.getMonth() : null
            const showMonthSeparator = monthKey !== prevKey
            const monthLabel =
              format(date, 'MMMM', { locale: es }) +
              (date.getFullYear() !== currentYear ? ` ${date.getFullYear()}` : '')

            return (
              <Fragment key={closing.id}>
              {showMonthSeparator && (
                <div className="flex items-center gap-3 pt-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-medium text-muted-foreground capitalize">
                    {monthLabel}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <Card>
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 capitalize">
                      <BookLock className="h-3.5 w-3.5" />
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatInAR(closing.closed_at, 'HH:mm')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="py-1 space-y-2">
                  <p className={`text-lg font-bold ${positivo ? 'text-foreground' : 'text-red-600'}`}>
                    ${closing.result.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
                  {closing.total_mercadopago !== null && closing.total_efectivo !== null && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-muted/40 px-2.5 py-1.5">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Banknote className="h-3 w-3" />
                          Efectivo
                        </span>
                        <p className="text-sm font-semibold">
                          ${closing.total_efectivo.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 dark:border-sky-900 dark:bg-sky-950">
                        <span className="text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-1">
                          <img src="/mercado-pago-logo.svg" alt="MP" className="h-3 w-3" />
                          Mercado Pago
                        </span>
                        <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">
                          ${closing.total_mercadopago.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="py-2 flex items-center justify-between">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Banknote className="h-3.5 w-3.5" />
                      Ventas ${closing.total_sales.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-red-500">
                      − Gastos ${closing.total_expenses.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  {closing.total_expenses > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground gap-1 px-2"
                      onClick={() => handleViewExpenses(closing)}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Ver gastos
                    </Button>
                  )}
                </CardFooter>
              </Card>
              </Fragment>
            )
          })}

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!selectedClosing} onOpenChange={v => !v && setSelectedClosing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Gastos del {selectedClosing && format(dateToAR(selectedClosing.date), "d 'de' MMMM", { locale: es })}
            </AlertDialogTitle>
          </AlertDialogHeader>

          {loading ? (
            <div className="space-y-3 py-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No hay gastos registrados.</p>
          ) : (
            <div className="space-y-2 py-1">
              {expenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{expense.description}</span>
                  <span className="text-sm font-medium shrink-0">
                    ${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-bold text-red-600">
                  ${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedClosing(null)}>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
