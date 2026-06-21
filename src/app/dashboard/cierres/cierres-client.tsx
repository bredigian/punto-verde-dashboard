'use client'

import { useState } from 'react'
import { CashClosing, Expense } from '@/types'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { BookLock, Banknote, Receipt, TrendingUp, CalendarDays } from 'lucide-react'
import Image from 'next/image'
import logo from '../../../../public/punto-fresco-logo.jpg'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

interface Props {
  closings: CashClosing[]
}

export default function CierresClient({ closings }: Props) {
  const now = new Date()
  const currentMonth = now.getFullYear() * 100 + (now.getMonth() + 1)
  const currentYear = now.getFullYear()

  const monthlyResult = closings
    .filter(c => {
      const d = parseISO(c.date)
      return d.getFullYear() * 100 + (d.getMonth() + 1) === currentMonth
    })
    .reduce((sum, c) => sum + c.result, 0)

  const yearlyResult = closings
    .filter(c => parseISO(c.date).getFullYear() === currentYear)
    .reduce((sum, c) => sum + c.result, 0)

  const [selectedClosing, setSelectedClosing] = useState<CashClosing | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleViewExpenses(closing: CashClosing) {
    setSelectedClosing(closing)
    setLoading(true)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .gte('created_at', `${closing.date}T00:00:00`)
      .lte('created_at', `${closing.date}T23:59:59`)
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
            <p className={`text-xl font-bold ${monthlyResult >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              ${monthlyResult.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </p>
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
            <p className={`text-xl font-bold ${yearlyResult >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              ${yearlyResult.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
            </p>
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
          {closings.map((closing) => {
            const date = parseISO(closing.date)
            const isToday = closing.date === new Date().toISOString().slice(0, 10)
            const label = isToday
              ? 'Hoy'
              : format(date, "EEEE d 'de' MMMM", { locale: es })
            const positivo = closing.result >= 0

            return (
              <Card key={closing.id}>
                <CardHeader className="pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5 capitalize">
                      <BookLock className="h-3.5 w-3.5" />
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(closing.closed_at), 'HH:mm')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="py-1">
                  <p className={`text-lg font-bold ${positivo ? 'text-green-700' : 'text-red-600'}`}>
                    ${closing.result.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </p>
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
            )
          })}
        </div>
      )}

      <AlertDialog open={!!selectedClosing} onOpenChange={v => !v && setSelectedClosing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Gastos del {selectedClosing && format(parseISO(selectedClosing.date), "d 'de' MMMM", { locale: es })}
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
