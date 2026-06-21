'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sale, Expense, CashClosing } from '@/types'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/money-input'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Banknote, Trash2, Plus, Lock } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  sales: Sale[]
  initialExpenses: Expense[]
  initialClosing: CashClosing | null
  today: string
}

export function CierreCajaDrawer({ open, onClose, sales, initialExpenses, initialClosing, today }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)
  const [closing, setClosing] = useState<CashClosing | null>(initialClosing)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [closing_in_progress, setClosingInProgress] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [waitingForConfirm, setWaitingForConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const supabase = createClient()

  const isClosed = closing !== null

  const totalEfectivo = sales.filter(s => s.payment_method === 'efectivo').reduce((sum, s) => sum + s.total, 0)
  const totalMP = sales.filter(s => s.payment_method === 'mercadopago').reduce((sum, s) => sum + s.total, 0)
  const totalVentas = totalEfectivo + totalMP
  const totalGastos = expenses.reduce((sum, e) => sum + e.amount, 0)
  const resultado = totalVentas - totalGastos

  async function handleAddExpense() {
    const parsed = parseFloat(amount)
    if (!desc.trim() || isNaN(parsed) || parsed <= 0) return
    setSaving(true)
    const { data, error } = await supabase
      .from('expenses')
      .insert({ description: desc.trim(), amount: parsed })
      .select()
      .single()
    if (!error && data) {
      setExpenses(prev => [...prev, data])
      setDesc('')
      setAmount('')
    }
    setSaving(false)
  }

  async function handleDeleteExpense(id: string) {
    setDeletingId(id)
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  function handleRequestCierre() {
    setWaitingForConfirm(true)
    setTimeout(() => setConfirmOpen(true), 300)
  }

  function handleCancelCierre() {
    setConfirmOpen(false)
    setWaitingForConfirm(false)
  }

  async function handleCerrarCaja() {
    setClosingInProgress(true)
    const { data, error } = await supabase
      .from('cash_closings')
      .insert({ date: today, total_sales: totalVentas, total_expenses: totalGastos, result: resultado })
      .select()
      .single()
    if (!error && data) {
      setClosing(data)
      setConfirmOpen(false)
      setWaitingForConfirm(false)
      onClose()
    }
    setClosingInProgress(false)
  }

  return (
    <>
    <Drawer open={open && !waitingForConfirm} onOpenChange={v => !v && !waitingForConfirm && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            Cierre de caja
            {isClosed && <Lock className="h-4 w-4 text-muted-foreground" />}
          </DrawerTitle>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8 space-y-6">

          {isClosed && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2 text-sm">
              <Lock className="h-4 w-4 shrink-0" />
              Caja cerrada. Las ventas de hoy están liquidadas.
            </div>
          )}

          {/* Resumen de ventas */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ventas del día</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Banknote className="h-4 w-4" /> Efectivo
                </span>
                <span className="text-sm font-medium">
                  ${totalEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <img src="/mercado-pago-logo.svg" alt="MP" className="h-4 w-4" /> Mercado Pago
                </span>
                <span className="text-sm font-medium">
                  ${totalMP.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-semibold">Total ventas</span>
                <span className="text-sm font-bold text-green-700">
                  ${totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Gastos</p>

            {expenses.length > 0 && (
              <div className="space-y-2 mb-3">
                {expenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground truncate flex-1">{expense.description}</span>
                    <span className="text-sm font-medium shrink-0">
                      -${expense.amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </span>
                    {!isClosed && (
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={deletingId === expense.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Total gastos</span>
                  <span className="text-sm font-bold text-red-600">
                    -${totalGastos.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            )}

            {!isClosed && (
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Descripción"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="flex-1 h-9"
                />
                <div className="w-28">
                  <MoneyInput value={amount} onChange={setAmount} compact />
                </div>
                <Button
                  size="icon"
                  onClick={handleAddExpense}
                  disabled={saving || !desc.trim() || !amount || parseFloat(amount) === 0}
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Resultado */}
          <div className={`rounded-xl p-4 ${resultado >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Resultado final</span>
              <span className={`text-2xl font-bold ${resultado >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                ${resultado.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {!isClosed && (
            <Button
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleRequestCierre}
              disabled={closing_in_progress}
            >
              <Lock className="h-4 w-4 mr-2" />
              Cerrar caja
            </Button>
          )}
        </div>
      </DrawerContent>
      </Drawer>

      <AlertDialog open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar la caja?</AlertDialogTitle>
            <AlertDialogDescription>
              Las ventas de hoy quedarán liquidadas y no podrán eliminarse. Las ventas nuevas se registrarán como del día siguiente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCierre}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCerrarCaja}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {closing_in_progress ? 'Cerrando...' : 'Confirmar cierre'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
